import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';

export default function LiveFeed(){
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true); //loading state, don't forget to set it to false later(below), else the state will run endlessly

useEffect(() => {
  const fetchTWEETS = async () => {
    try {
      console.log('Fetching tweets...');
      const res = await fetch('http://10.0.2.2:4000/static-tweets'); // this is the default android emulator address for localhost, for physical devices its the ip address of the computer running the server
      console.log('Response:', res.status); // debugging to check the response status
      const data = await res.json();
      console.log('Fetched tweets:', data); // debugging to check the data and its structure
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
            <Text style={styles.timePostedStyle}>Posted at: {tweet.formattedDate}</Text>
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
    marginBottom: 5,

  },
  feedContainer:{
    maxHeight: 700,
    flexDirection: 'column', //to adjust the content(text in this case) to be top-bottom
   // borderWidth: 0, keep this commented this is to make the border visible for testing purposes
    borderRadius: 5,
    marginTop: 0,
    marginHorizontal: 11,
    
  },
  smallerContainer:{
    marginTop: 8,
    marginBottom: 8,
   // borderWidth: 0, keep this commented this is to make the border visible for testing purposes
    padding: 3,
    borderRadius: 8,
    marginHorizontal: 10,
    //backgroundColor: 'white',

  },
  textStyle:{
    fontSize: 11,
    borderWidth: 1,
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: 'white',
  },

  timePostedStyle:{
    fontSize: 9,
    backgroundColor: 'white',
    

  }
});

