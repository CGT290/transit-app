[DEMO](https://youtu.be/ZpwaomCMhEE)
An NYC Transit mobile application built with react native expo to help users track public transits stops, view live arrival data, save their favorite location, and recieve recent news via tweets from .

Home Page:
- The page the user will be on frequently, User simply inputs a destination afterwards a list of current options (buses only for now) will be provided alongside live data for each option
  
- Live arrival data consist of the number of stops the bus needs to make to get to users current location, to be more specific the location of a bus stop the user is closest to. Second data provide is how long it will take to get their in minutes

- To determine users current location Gelocation is used, Geocoding is use to convert the address from text format to latitude and longitude values


Favorites Page:
- Issue: The input field in home page does not have any form of autocomplete so the user would have to always rewrite a location from scratch
  
- Solution: A page where where users can place destinations they often visit and can just copy it from favorites and paste in in home page

- created a custom favorites context , useFavorites, to aid in managing a consisitence interaction between favorites page and the home page

- No duplicates are accepted and alert will prompt informing the user

Live Feed Page:
- Provides user with the most up to date and often more detail updates on any Train/bus lines in NYC
- Its meant to store only the 10 most recent tweets for NYC transportation


stop.json file:
- Stores the stops.txt info of all 5 boroughs that was taken from MTA Developer. Retrieved all data for all sstops involving the stopIDs, stopNames(address), stopLat, and stopLong
- [MTA Bus Time](https://bustime.mta.info/) with the stopIds to verify that the live data being retrieved is accurate
- With the latitude and longitude values and Haversine distance algorithm we're able to determine the nearest stops within a set radius
- bus-info/nearby incorparates the Haversine algorithm nearest relevant buses based on users current location

APIFY:
- Use this to fetch the tweets and store them in a json file. From there the tweets can be retrieved and sent to the LIVE FEED page for the user to read
- Apify also gives you an option of setting up a scheduler to fetch data on a custom time interval
