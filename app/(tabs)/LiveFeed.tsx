import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';

export default function LiveFeed(){
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true); //loading state, don't forget to set it to false later(below), else the state will run endlessly

useEffect(() => {
  const fetchTWEETS = async () => {
    try {
      const res = await fetch('http://localhost:3000/fetched-tweets');
      const data = await res.json();
      console.log(data);
      setTweets(data); // If we want to update the tweets state with fetched data
    } catch (error) {
      console.log('Got error while fetching tweets', error);
    } finally {
      console.log('A fetch attempt was done');
      setLoading(false); //stop endless load state
    }
  };
  fetchTWEETS(); 
}, []);


return (
  <View style={styles.container}>
    <Text style={styles.HeadingText}>Live Feed</Text>

    {loading ? (
      // Show ActivityIndicator while data is loading
      <ActivityIndicator size="large" color="#0000ff" />
    ) : (
      //Container for the Rendered tweets once the loading is complete
      <ScrollView style={styles.feedContainer}>
        {tweets.map((tweet, index) => (
          <View key={index} style={styles.smallerContainer}>
            <Text style={styles.textStyle}>{tweet.text}</Text>
            <Text style={styles.textStyle}>
              Likes: {tweet.public_metrics.like_count} | Retweets: {tweet.public_metrics.retweet_count}
            </Text>
          </View>
        ))}
      </ScrollView>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  HeadingText:{
    alignSelf: 'center',
    fontWeight: 'bold',
    marginTop: 15,
    fontSize: 25,
    marginBottom: 25,

  },
  feedContainer:{
    maxHeight: 550,
    flexDirection: 'column', //to adjust the content(text in this case) to be top-bottom
    borderWidth: 2,
    borderRadius: 5,
    backgroundColor: 'rgb(245,245,245)', //keep this planning to change background color soon
    marginTop: 15,
    marginHorizontal: 11,
    
  },
  smallerContainer:{
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    padding: 2,
    borderRadius: 8,
    marginHorizontal: 10,

  },
  textStyle:{
    fontSize: 12,
  },
  scrollContents:{
    alignContent: 'center',

  },
});

