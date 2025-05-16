import { View, Text, StyleSheet, ScrollView, Pressable, Alert} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFavorites } from './FavoritesContext';
import * as Clipboard from 'expo-clipboard'


export default function FavoritesPage({}) {
  // State for managing an array of favorites  
  const { favorites, removeFavorite } = useFavorites(); // Access the global favorites context

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!: ',`${text}`);
    
  }
   
  return (
    <View style={styles.container}>
      <Text style={styles.HeaderText}>Favorite Destinations</Text>

      <ScrollView style={styles.FavoritesContainer} contentContainerStyle={styles.FavoritesContentContainer}>
       
        {favorites.map((item, index) => (
          <View key={index} style={styles.rowOfItem}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>{item}</Text>
            </View>

            <Pressable onPress={() => removeFavorite(item)}>
              <MaterialIcons name="delete"size={30}color="black" style={styles.deleteIcon}/>
            </Pressable>

             <Pressable onPress = {() => copyToClipboard(item)} style = {styles.copyBtn}>
              <Text>Copy</Text>
            </Pressable>
          </View>
        ))}

        {favorites.length === 0 &&(
           <Text style ={styles.emptyFavorites}>Nothing added to favorites</Text>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  HeaderText: {
    alignSelf: 'center',
    fontSize: 25,
    marginTop: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  FavoritesContainer: {
    maxHeight: 750,
    marginTop: 10,
    backgroundColor: 'rgb(245,245,245)',
  },
  FavoritesContentContainer: { alignItems: 'center' },
  rowOfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  itemContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 5,
    marginBottom: 15,
    marginTop: 15,
  },
  itemText: { fontSize: 15, color: 'black' },
  deleteIcon: { marginRight: 10 },
  
  copyBtn:{
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center'

  },
  emptyFavorites:{
    textAlign: 'center',
    color: 'red',
    marginTop: 250,
    fontSize: 30,
  }
});