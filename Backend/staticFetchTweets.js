//Have this server here so that I could run it without any sort of scheduler.
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors'); 
const app = express();

const PORT = 4000; 

app.use(cors()); // This to allow React Native to fetch from this server

//http://localhost:4000/static-tweets
app.get('/static-tweets', (_, res) => {
    try {
        console.log('Serving static tweets...');
        const rawData = fs.readFileSync(__dirname + '/TweetFetch.json', 'utf8'); 
        const tweets = JSON.parse(rawData);
        res.status(200).json(tweets);
    } catch (error) {
        console.error('Error fetching static tweets:', error.message);
        res.status(500).json({ error: 'Failed to fetch static tweets' });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Static server is running on port ${PORT}`);
});
