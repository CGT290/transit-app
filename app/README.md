

A NYC Transit mobile application built with React Native expo to help users track public transit stops, view live arrival data, save their favorite locations, and receive recent news via tweets .

Home Page:
- The page the user will be on frequently. Users simply input a destination. Afterwards, a list of current options (buses only for now) will be provided alongside live data for each option
  
- Live arrival data consists of the number of stops the bus needs to make to get to the user's current location. To be more specific, the location of the bus stop the user is closest to. The second data provided is how long it will take to get there in minutes

- To determine users' current location, Gelocation is used. Geocoding is used to convert the address from text format to latitude and longitude values.


Favorites Page:
- Issue: The input field on the home page does not have any form of autocomplete, so the user would always have to rewrite a location from scratch
  
- Solution: A page where users can place destinations they often visit and can just copy it from favorites and paste in on the home page

- Created a custom favorites' context, useFavorites, to aid in managing a consistent interaction between the favorites page and the home page.

- No duplicates are accepted, and alert will prompt informing the user

Live Feed Page:
- Provides users with the most up-to-date and often more detailed updates on any train/bus lines in NYC
- It's meant to store only the 10 most recent tweets about NYC transportation.


stop.json file:
- Stores the stops.txt info of all 5 boroughs that were taken from the MTA Developer. Retrieved all data for all stops involving the stopIDs, stopNames(address), stopLat, and stopLong
  
- [MTA Bus Time](https://bustime.mta.info/) with the stopIds to verify that the live data being retrieved is accurate'
  
- With the latitude and longitude values and Haversine distance algorithm, we're able to determine the nearest stops within a set radius.
  
-  bus-info/nearby incorporates the Haversine algorithm to the nearest relevant buses based on the users' current location
  
APIFY:
- Use this to fetch the tweets and store them in a json file. From there, the tweets can be retrieved and sent to the LIVE FEED page for the user to read

- Apify also gives you the option of setting up a scheduler to fetch data on a custom time interval
