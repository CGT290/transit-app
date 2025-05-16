require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path'); 
const NodeGeocoder = require('node-geocoder');

const app = express();
app.use(cors()); 

const PORT = 3500; 

const API_KEY = process.env.MTA_BUS_TIME_API_KEY;
const gMapKEY = process.env.GOOGLE_API_KEY;
//console.log(API_KEY);
//console.log(gMapKEY);
 const geoOptions = {
  provider: 'google',
  apiKey: gMapKEY,
}

const geocoder = NodeGeocoder(geoOptions);

function convertTimeToEDT12hr(time){
    if(!time){
        return "Unkown or Undefined time";
    }
    const date = new Date(time);
    const option = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' };
    return date.toLocaleString('en-US', option);
}

const stopsFile = path.join(__dirname, 'stops.json'); // to p
let stops = [];

try{
    stops = JSON.parse(fs.readFileSync(stopsFile, 'utf-8'));
   // console.log(`Loaded ${stops.length} stops form ${stopsFile}`);
    if(!stops.length){
        console.error("No stops loaded! check stops.json exist and is a valid JSON ")
    }
}catch(error){
    console.log("Failed to load static GTFS stops.json: ", error );
}

//Calculating distance between to coordinates haversine Method in METERS: 
// https://henry-rossiter.medium.com/calculating-distance-between-geographic-coordinates-with-javascript-5f3097b61898
function haversineDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
  const R = 6371e3; //The earth's radius in meters
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;
  const d = Math.acos(
    Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(deltaLambda),
  ) * R;
  return d;
}

//curl http://localhost:3500/geolocate, accuracy value holds the estimated error in meters calculation. accuracy: 1991.8 means its ~2km off the range its trying to get
// this to locate user current destiantion
app.get('/geolocate', async (req, res) => {
  const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${gMapKEY}`;
  try {
    const geoLocRes = await axios.post(url,
      {considerIp: true}
    );
    res.json(geoLocRes.data);
  } catch (error) {
    console.error('Geolocate error: ', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

//curl "http://localhost:3500/geocode?address=1600+Pennsylvania+Ave+NW",
// to convert address into lat and lon values
app.get('/geocode', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Please provide an address' });
  }

  try {
    console.log('Geocode requested for: ', address);
    const [result] = await geocoder.geocode(address); //gecoding the address past
    console.log('Geocode results: ', result);

    if (!result) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json({
      lat: result.latitude,
      lng: result.longitude,
      formatted: result.formattedAddress
    });
  } catch (err) {
    console.error('Geocode error:', err);
    res.status(500).json({ error: err.message });
  }
});

// curl "http://localhost:3500/bus-info/nearby?latitude={latitudeNum}&longitude={longititudeNum}", example:  curl "http://localhost:3500/bus-info/nearby?latitude=40.578033&longitude=-73.939932"
//Purpose: Find nearest static GTFS stops with the set radius, Fetch the actual real time mta data for each stop. Finally it filters thems, groups them, sort them (by arrival), and limit amount displayed
app.get('/bus-info/nearby', async (req, res) => {
  //radius value holds the distance of stops to look for based on users location. radius = 300, stops within 300 meters. 230-237 meters is the supposive avg distance between bus stops in NYC
  const { latitude, longitude, radius = 400, maxStop = 5 } = req.query;
  const userLat  = parseFloat(latitude);
  const userLong = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLong)) {
    return res.status(400).json({ error: 'Need valid lat & lon' });
  }

  const nearbyStops = stops
    .map(stop => ({
      ...stop,
        distance: haversineDistanceBetweenPoints(
        userLat, userLong,
        stop.stop_lat, stop.stop_lon
      )
    }))
    .filter(s => s.distance <= Number(radius))
    .sort((a, b) => a.distance - b.distance) //sorts by nearest
    .slice(0, Number(maxStop)); //creates an array to hold values the first 5 items, these items being the stops

  if (nearbyStops.length === 0) {
    return res.status(200).json({ message: 'No nearby stops found' });
  }

  const url = 'https://bustime.mta.info/api/siri/stop-monitoring.json';
  try {
    const requests = nearbyStops.map(stop =>
      axios.get(url, {
        params: {
          key: API_KEY,
          MonitoringRef: stop.stop_id //MonitoringRef being the query param MTAs API expecting to identify stops
        }
      }).catch(() => null) //to ensure tduring each request one bad data doesn't lead to the rest failing
    );
    
    const responses = await Promise.all(requests);
    //turn array for all visits into one
    const allBusLines = responses.flatMap((resp) => {
      const visits = resp.data?.Siri?.ServiceDelivery
        ?.StopMonitoringDelivery?.[0]
        ?.MonitoredStopVisit || [];
      const visitArray = Array.isArray(visits) ? visits : [visits];

      return visitArray.map(visit => {
        const journey = visit.MonitoredVehicleJourney || {};
        const call    = journey.MonitoredCall || {};
        const etaTime  = call.ExpectedArrivalTime;

        return {
          stopId: call.StopPointRef || "Unknown StopID",
          stopName: call.StopPointName || "Unknown Stop name",
          etaTime,                                
          etaFormatted: convertTimeToEDT12hr(etaTime),
          route: journey.PublishedLineName || "Unknown Bus Route",
          direction: journey.DirectionRef || "Unknown",
          stopsAway: call.Extensions?.Distances?.StopsFromCall || "Unknown stops away from current stopName",
          vehiclePosition: {
            latitude:  journey.VehicleLocation?.Latitude,
            longitude: journey.VehicleLocation?.Longitude
          }
        };
      });
    });

    const currentTime = Date.now();
    const newBuslines = allBusLines.filter(bus =>
      bus.etaTime && new Date(bus.etaTime).getTime() >= currentTime
    );

    newBuslines.sort((a,b) =>
      new Date(a.etaTime).getTime() - new Date(b.etaTime).getTime()
    );
    
    const uniqueByRoute = [];
    //This is just to ensure that it the entry for each route if they do share same times it guarantess that at least one entry for each route is shown.
    const seenAlready = new Set();
    for(const bus of newBuslines){
      if(!seenAlready.has(bus.route)){
        seenAlready.add(bus.route);
        uniqueByRoute.push(bus);
      }
    }

    const limit = uniqueByRoute.slice(0, Number(maxStop));

    res.json({
      currentLocation: { latitude: userLat, longitude: userLong },
      nearbyStops,
      buses: limit
    });

  } catch (err) {
    console.error('Error fetching bus info:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
    console.log(`Bus server is running on port ${PORT}`);
});  
