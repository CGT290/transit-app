require('dotenv').config(); // Load variables from .env, using this to keep personal info like API_KEY hidden
const express = require('express');
const fs = require('fs');
const { ApifyClient } = require('apify-client');
const cors = require('cors');  
const app = express();

const PORT = 3000;
app.use(cors()); 

const client = new ApifyClient({
    token: process.env.API_TOKEN, 
});


const fetchTweets = async () => {
    try {
        const run = await client.task(process.env.TASK_ID).call();

        // Fetch dataset results from the run
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const tweets = items.map(tweet => ({
            text: tweet.text,
            createdAt: tweet.createdAt,
            formattedDate: new Date(tweet.createdAt).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                hour12: true,
            }),
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest post

        // Save tweets to a JSON file
        fs.writeFileSync('TweetFetch.json', JSON.stringify(tweets, null, 2), (error) => {
            if (error) {
                console.error('Error writing to file:', error.message);
            } else {
                console.log('Tweets saved successfully!');
            }
        });

 console.log('Latest Tweets have been fetched and saved!');
        /*To output the tweets to the console, DON'T DELETE, might still use later to check for potential error
        tweets.forEach((tweet, index) => {
            console.log(`${index + 1}. Text: "${tweet.text}" | Posted At: ${tweet.createdAt}`);
        });
        */
    } catch (error) {
        console.error('Error fetching tweets:', error.message);
    }
};

app.get('/fetched-tweets', (_, res) => {
    try {
        console.log('Attempting to fetch tweets from:', __dirname + '/TweetFetch.json');
        const rawData = fs.readFileSync(__dirname + '/TweetFetch.json', 'utf8');
        const tweets = JSON.parse(rawData);
        res.status(200).json(tweets);
    } catch (error) {
        console.error('Error fetching tweets:', error.message);
        res.status(500).json({ error: 'Failed to fetch tweets' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    fetchTweets(); // Run immediately on server startup

    setInterval(fetchTweets, 6 * 60 * 60 * 1000); // Fetch tweets every 6 hours
});
//curl http://localhost:3000/fetched-tweets