require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path'); 

const app = express();
app.use(cors()); 
const PORT = 3500; 

const API_KEY = process.env.MTA_BUS_TIME_API_KEY;
const gMapKEY = process.env.Cloud_KEY;


function  convertTimeToEDT12hr(time){
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
app.get('/geocode', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'please input a proper address' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  try {
    const gC_res = await axios.get(url, {
      params: {
        address,
        key: gMapKEY
      }
    });

    const firstResult = gC_res.data.results?.[0];

    if(!firstResult){
      return res.status(404).json({error: "first result NOT FOUND"});
    }

    return res.json({
      lat: firstResult.geometry.location.lat,
      lng : firstResult.geometry.location.lng,
      formatted: firstResult.formatted_address  //this formats the address to include street number , route, city, and state. 120 4TH AV, New York, NY
    });
  } catch (error) {
    if (error.response?.data) {
   return res
     .status(error.response.status || 500)
    .json(error.response.data);
  }
  return res.status(500).json({ error: error.message });
}
});

// curl "http://localhost:3500/bus-info/nearby?latitude={latitudeNum}&longitude={longititudeNum}", example:  curl "http://localhost:3500/bus-info/nearby?latitude=40.578033&longitude=-73.939932"
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
          stopsAway: call.Extensions?.Distances?.StopsFromCall || "Unknown stops away from current stopName", // 'X', the x is a number representing how many stops away it is from a particular stop_name
          vehiclePosition: {
            latitude:  journey.VehicleLocation?.Latitude,
            longitude: journey.VehicleLocation?.Longitude
          }
        };
      });
    });

    allBusLines.sort((a, b) =>
      new Date(a.etaTime) - new Date(b.etaTime)
    );

    res.json({
      currentLocation: { latitude: userLat, longitude: userLong },
      nearbyStops,
      buses: allBusLines
    });
  } catch (err) {
    console.error('Error fetching bus info:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
    console.log(`Bus server is running on port ${PORT}`);
    
});