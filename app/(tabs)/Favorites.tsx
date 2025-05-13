import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
//import { useLocalSearchParams } from 'expo-router'; horrible for managing a list across different pages, don't ever use again
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFavorites } from './FavoritesContext';


export default function FavoritesPage({}) {
  // State for managing an array of favorites
  
  const { favorites, removeFavorite } = useFavorites(); // Access the global favorites context
   
  
  return (
    <View style={styles.container}>
      <Text style={styles.HeaderText}>Favorite Destinations</Text>
      <ScrollView
        style={styles.FavoritesContainer}
        contentContainerStyle={styles.FavoritesContentContainer}
      >
        {favorites.map((item, index) => (
          <View key={index} style={styles.rowOfItem}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>{item}</Text>
            </View>
            <Pressable onPress={() => removeFavorite(item)}>
              <MaterialIcons
                name="delete"
                size={30}
                color="black"
                style={styles.deleteIcon}
              />
            </Pressable>
          </View>
        ))}
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
});