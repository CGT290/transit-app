
import { useState } from "react";
//import * as Location from 'expo-location';             
import {Text, View,ScrollView,TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFavorites } from "./FavoritesContext"; // Import global favorites context
import { LOCAL_IP } from "../../config";

interface BusOption {
  route: string;
  etaFormatted: string;
  stopsAway: number;
}

export default function Index() {
  const [destinationText, setDestinationText] = useState<string>("");
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { addFavorite }  = useFavorites();

  // to clear the old results when user types a new destination
  const onDestinationChange = (TEXT: string) => {
    setDestinationText(TEXT);
    setBuses([]);
  };

  const favoritesIconClick = () => {
    if (destinationText.trim()) {
      const added = addFavorite(destinationText.trim());
      if (!added) {
        Alert.alert("Duplicate", "This item is already in your favorites list.");
      }
      setDestinationText("");
    }
  };

 const onSearch = async () => {
  if (!destinationText.trim()) {
    return Alert.alert("Enter a destination");
  }
  setLoading(true);
  setBuses([]);

  try {
    console.log('Geocode requested for:', destinationText); //just to see check for the raw data that going to be geocoded

    //Geocoded the typed destination via the busServer.js 
    const geoRes = await fetch(
      `http://${LOCAL_IP}:3500/geocode?address=${encodeURIComponent(
        destinationText
      )}`
    );
    const geoJson = await geoRes.json();

    //to check the geocode results to see if the conversion is working
    console.log('Geocode result:', geoJson);

    if (!geoRes.ok) {
      throw new Error(geoJson.error || "Geocode failed");
    }
    const { lat, lng } = geoJson;

    // the coordinates im about to use to fetch buses
    console.log(`Fetching buses around: ${lat}, ${lng}`);

    // to Fetch up to 5 nearby buses around those geocoded coordinates
    const url =
      `http://${LOCAL_IP}:3500/bus-info/nearby` +
      `?latitude=${lat}` +
      `&longitude=${lng}` +
      `&maxStop=5`;
    const resp = await fetch(url);
    const json = await resp.json();

   
    console.log('Bus-info returned:', json);

    if (!resp.ok) {
      throw new Error(json.error || "Lookup failed");
    }

    if (!Array.isArray(json.buses) || json.buses.length === 0) {
      setBuses([]);
      return Alert.alert("No buses found at that location");
    }

    // to render route, etaFormat, and stops away 
    setBuses(
      json.buses.map((b: any) => ({
        route: b.route,
        etaFormatted: b.etaFormatted,
        stopsAway: b.stopsAway,
      }))
    );
  } catch (err: any) {
    Alert.alert("Error", err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter Destination"
          value={destinationText}
          onChangeText={onDestinationChange}
        />

        <TouchableOpacity onPress={favoritesIconClick} style={styles.iconBtn}>
          <AntDesign name="hearto" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSearch} style={styles.iconBtn}>
          <AntDesign name="search1" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      <ScrollView style={styles.results}>
        {buses.map((b, i) => (
          <View key={i} style={styles.resultItem}>
            <Text style={styles.route}>{b.route}</Text>
            <Text>
            Arrives: {b.etaFormatted}                                       {b.stopsAway} stops away
            </Text>
          </View>
        ))}

        {!loading && buses.length === 0 && (
          <Text style={styles.noResults}>No buses found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 10, },

  input: { 
    flex: 1,
    fontSize: 16,
    paddingVertical: 0  },
  
  iconBtn: { 
    padding: 8,
    marginLeft: 8 },
 
  results: { marginTop: 20 },

  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10, },

  route: {
    fontWeight: 'bold',
    marginBottom: 4 },

  noResults: { 
    textAlign: 'center',
    color: 'red',
    marginTop: 20 },
});
