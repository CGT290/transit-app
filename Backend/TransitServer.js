const express = require('express');
require('dotenv').config(); 
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); // need fs for file based purposes like reading a file or checking if the file exist. fs.readFileSync(), fs.existsSync
const gtfs = require('gtfs-realtime-bindings');
const path = require('path'); 

const app = express();
app.use(cors()); 
const PORT = 5000; 
const API_KEY = process.env.MTA_BUS_TIME_API_KEY;
const cache = {}; // to store the API responses to optimize the Calls


function  convertTimeToEDT12hr(time){
    if(!time){
        return "Unkown or Undefined time";
    }
    const date = new Date(time);
    const option = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' };
    return date.toLocaleString('en-US', option);
}

// This API request is there to fetch the static GTFS data for bus stop locations, since BUS Time API does not provide stop locations, will remove this later to reduce 
app.get('/gtfs-stops', async (_, res) => { 
    try {
        const filePath = path.join(__dirname, 'stops.json');  // Storing the path of a specific file and checking if it exists
        if (!fs.existsSync(filePath)) 
            return res.status(404).json({ error: 'file not found' });

        
        const stopsData = fs.readFileSync(filePath, 'utf8'); // Reading the file and parsing the JSON data to be a JS object
        const stops = JSON.parse(stopsData);

        const filteredStops = stops.map(entry => {
        const cleanedEntry = {...entry }; // for the shallow copy of the entry object

        ['stop_desc', 'zone_id', 'stop_url', 'parent_station', ].forEach(field => {
            if(cleanedEntry[field] === "") {
                delete cleanedEntry[field]; // remove the field if its empty
            }
       });
        return cleanedEntry; 
       });

       // Formated data to make it more readable by adding new lines and spaces between the objects
       const formatData = filteredStops.map(entry => {
           const lines = Object.entries(entry).map(([key, value]) => `${key}: ${value}`); // convert each entry to a string
              return lines.join('\n') + '\n-----------------'; 
       }).join('\n\n'); // join the formatted entries with new lines between them

        res.header('Content-Type', 'text/plain'); // Set the content type to plain text
        
        //using .send instead of .json cause .json is designed to send JSON data, while .send can send any type of data, rn our data is converted to strings
        res.status(200).send(formatData); // Return the GTFS data for bus stops
    } catch (error) {
        console.error('Error fetching GTFS stops:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/bus-info/destination/:destinationID', async (req, res) => {
    //To get request parameter for the URL path
    const destinationID = req.params.destinationID; 

    if (!destinationID) {
        return res.status(400).json({ error: 'Please provide a destination ID.' });
    }

    const url = `https://bustime.mta.info/api/siri/stop-monitoring.json?key=${API_KEY}&MonitoringRef=${destinationID}`;

    try {
        const response = await axios.get(url);
        let stopData = response.data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];

        if (!Array.isArray(stopData)) {
            stopData = stopData ? [stopData] : [];
        }
        if (stopData.length === 0) {
            return res.status(200).json({ message: 'No data found, bus may not be operating right now.' });
        }
        //http://localhost:5000/bus-info/destination/{DestinationID}
        //example:  http://localhost:5000/bus-info/destination/300090
        const busInfo = stopData.map(stop => {
            const vehicleJourney = stop?.MonitoredVehicleJourney || {};
            const MonitoredCall = vehicleJourney?.MonitoredCall || {};

            return {
                SpecificStops: MonitoredCall.StopPointName || "Unknown Stop",
                arrivalTime: MonitoredCall.ExpectedArrivalTime ? convertTimeToEDT12hr(MonitoredCall.ExpectedArrivalTime) : "Expected Arrival Time not available",
                line: vehicleJourney.PublishedLineName || "Unknown Bus Route",
                direction: vehicleJourney.DirectionRef || "Unknown",
                vehiclePosition: {
                    latitude: vehicleJourney.VehicleLocation?.Latitude || "Unknown Latitude",
                    longitude: vehicleJourney.VehicleLocation?.Longitude || "Unknown Longitude"
                }
            };
        });

        // Format output for readability
        const formattedData = busInfo.map(entry => {
            const vehiclePosition = JSON.stringify(entry.vehiclePosition);
            const lines = [
                `BusStop: ${entry.SpecificStops}`, //current stop its at
                `ArrivalTime: ${entry.arrivalTime}`, // Stores arrival time for buses heading towards users current destination
                `BusLineName: ${entry.line}`, // Bus route name
                `Direction: ${entry.direction}`, // Direction ID (0 = away from city, 1 = towards city)
                `CurrentBusLocation: ${vehiclePosition}`, // Current location of the bus
                '-----------------',
            ];
            return lines.join('\n');
        }).join('\n\n');

       // console.log("Raw API Data:", JSON.stringify(stopData, null, 2)); // To view Full data 
        res.header('Content-Type', 'text/plain').status(200).send(formattedData);

    } catch (error) {
        console.error("Error fetching bus info:", error.message);
        res.status(500).json({ error: error.message });
    }
});
/*
 MTAs GTFS feed GTFS-Realtime is encoded in Protocol Buffers (protobuf), some sort of binary format, 
 we'll need to parsed it properly else we'll be getting garbage data.

 Articles i found: 
 - https://medium.com/@subwayexpert/using-protocol-buffers-with-the-nyc-subway-a40688544dfb
 - https://www.npmjs.com/package/mta-gtfs-realtime-bindings

 FeedMessage class is generated from the GTFS-Realtime.proto file, we'll use it to parse the GTFS data.
*/

//Placed this object route handler for subway arrivals so that its not recreated during every request
const Train_Feeds = {
    'Subway_ACE': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace', //For A,C,E trains and S^R rail 
    'Subway_G': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g', //G train
    'Subway_NQRW': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw', //N,Q,R,W trains 
    'Subway_1-7': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs', //1,2,3,4,5,6,7 trains and S 
    'Subway_BDFM': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm', //B,D,F,M trains and S^F
    'Subway_JZ': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz', //J,Z trains
    'Subway_L': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l', //L train
    'Subway_SIR': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si', //SIR train
};

async function fetchSubwayArrival(endpointURL){
    
    try{
        const response = await axios.get(endpointURL, {
            headers: { "x-api-key": API_KEY },
            responseType: 'arraybuffer', // Set the response type to arraybuffer to handle binary data
        });
        

    if (!response.data || response.data.length === 0) {
        throw new Error("No data received from the GTFS feed.");
    } 
       const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(response.data)); // Decode the binary data using the FeedMessage class
       
       /* Was using this log to figure out why for some train lines the times(arrival and departure), were the same. Thought it was an
       error turns out that how its actually set up
       console.log("Raw Feed Data:", JSON.stringify(feed.entity, null, 2)); // To check full feeds data and figure out why some lines aren't working
       */
       return feed.entity; 
    }catch(error){
        console.error("Error fetching subway arrival data:", error.message);
        return {error: "Failed to fetch subway data"};
    }
}

//http://localhost:5000/subway-arrival/{Train_Feeds}, example: http://localhost:5000/subway-arrival/Subway_L
app.get('/subway-arrival/:trainLines', async (req, res) => {
    const trainLines = req.params.trainLines;
    
    const endpointURL = Train_Feeds[trainLines];
    if (!endpointURL) {
        return res.status(400).json({ error: 'Invalid train line provided.' });
    }

    try {
        const subwayData = await fetchSubwayArrival(endpointURL);
    
        if (!subwayData || subwayData.length === 0) {
            return res.status(200).json({ message: 'No data found for the specified train line.' });
        }
        
        const formattedData = subwayData.flatMap(entry => {
            const tripUpdate = entry.tripUpdate || {};
            const stopTimeUpdates = tripUpdate.stopTimeUpdate || [];

           
            const formatTimestamp = (timestamp) => {
                if (timestamp) {  
                    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour12: true, timeZone: 'America/New_York' });
                }
                return 'Unknown';  
            };
                       
            return stopTimeUpdates.map(update => {
                const stopId = update.stopId || 'Unknown';
                const arrivalTime = formatTimestamp(update.arrival?.time);
                const routeId = tripUpdate.trip?.routeId || 'Unknown';
        
                const lines = [
                    `RouteId: ${routeId}`, //Example: A, for the A train
                    `StopId: ${stopId}`,
                    `ArrivalTime: ${arrivalTime}`, //arrival time of the train at the stop
                    '------------------',
                ]
                return lines.join('\n'); 
            });
        }).join('\n\n');
         
        res.header('Content-Type', 'text/plain');  
        res.status(200).send(formattedData);  
    } catch (error) {
        console.error("Error fetching subway data:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Transit server is running on port ${PORT}`);
    
});
