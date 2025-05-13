// app/tabs/index.tsx
import { Text, View, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, TouchableOpacity, Alert } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useState } from "react";
import { useFavorites } from "./FavoritesContext"; // Import global favorites context

export default function Index({}) {
  const [text, setText] = useState("");
  const { addFavorite } = useFavorites(); // Access the global addFavorite function

  const favoritesIconClick = () => {
    if (text.trim()) { // Ensure input is not empty
      const added = addFavorite(text.trim()); // Add to favorites, check for duplicates
      if (!added) {
        Alert.alert("Duplicate", "This item is already in your favorites list.");
      }
      setText(""); // Clear the input field
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always"> 
          <View style={styles.inputWithIcon}>
            <TextInput style={styles.TextInput} 
              placeholder="Enter Destination" 
              onChangeText={setText} 
              value={text} 
              editable={true} 
              keyboardType="default"
            />
           <TouchableOpacity onPress={favoritesIconClick} accessibilityLabel="Add to Favorites">
            <AntDesign name="hearto" size={25} color="black" style={styles.FavoriteIcon} />
           </TouchableOpacity>
          </View>

          <View style={styles.TextContainer}>
            <Text style={styles.optionText}>Options</Text>
            <Text style={styles.departText}>Departs </Text>
          </View>
           
           
        <View style={styles.TransportOptions}>
        {/* Wrapper for item and departure time */}
        <View style={styles.itemWrapper}>

        {/* itemsSymbols symbol for transport, where we'll style the train or bus symbols*/}
        <View style={styles.itemContainer}>
          <View style={styles.itemsSymbol}>
            <Text style= {styles.symbolText}>B6</Text> 
          </View>
         <Text style = {styles.locationText}>Location: (someLocation)</Text> 
        </View>

  
       <View style={styles.departureContainer}>
        <Text>5 mins</Text> 
       </View>
       
       </View>
      </View>
      
      </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  inputWithIcon:{
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 20,
    width: '90%',
    height: 35,
    
  },
  TextInput: {
    flex: 1,
    color: 'black',
    paddingVertical: 0,
    fontSize: 18,
    backgroundColor: 'transparent',

  },

  container:{
    flex: 1,
    backgroundColor: 'rgb(245,245,245)',    //'rgb(10,30,50)' other option
    alignContent: 'center',
    
    
  },
  scrollContainer:{
    flexGrow: 1,// to make sure that our  scrollview  items are scrollable
  },
  
  TextContainer:{
    width: '98%', //adjusting the width between the 2 text
    position: 'relative',
    height: 50,
    marginTop: 30,
  },
  optionText:{
    color: 'rgb(0,0,128)',
    marginTop: 30,
    position: 'absolute',
    left: 5,
    fontSize: 25
  },

  departText:{
    color: "rgb(0,0,128)",
    marginTop: 30,
    position: 'absolute',
    right: 0,
    fontSize: 25,
  },
  TransportOptions:{
    flex: 0.9,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 0.8,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 15,
  },
  FavoriteIcon:{
    right: 0,
    marginLeft: 10,
  },
  //only needed when testing page not found link, DO NOT REMOVE
  gotToFeed:{
    fontSize: 15,
    textAlign: 'center',
    paddingTop: 15,
    textDecorationLine: 'underline',

  },
  itemWrapper: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row', 
    alignItems: 'center', // makes sure item (Location: (someLocation)) is centered 
    padding: 7, // Space inside the container
    borderWidth: 2,
    borderRadius: 15,
    flex: 1, // Allow itemContainer to grow and take up any available space
    marginRight: 10, // Add space between itemContainer and departureContainer
    
  },
  itemsSymbol: {
    width: 25, // Circle diameter
    height: 25, // To make the circle make sure its the same as width
    borderRadius: 20, // Make it circular
    borderWidth: 2, 
    alignItems: 'center', //Same as justifyContent, push the item from left to the center
    justifyContent: 'center', // To place the text B6 for example in the center of the container
    backgroundColor: 'rgb(245,245,5)',
    marginRight: 7, // To adjust the position of the location text next to the symbol
  },
  //to edit the text location
  locationText: {
    fontSize: 13.5, 
    color: 'black',
    fontWeight: 'bold',
  },
  departureContainer: {
    backgroundColor: 'rgb(245,245,245)', 
    padding: 5, 
    borderRadius: 15, // making the corners of the container rounder
    borderWidth: 2,
    borderColor: 'black',
  },

  //to edit the text itemsSymbols
  symbolText:{
    fontSize: 10,
    fontWeight:  'bold',
  },

});