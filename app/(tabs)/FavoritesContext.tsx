import React, { useState, createContext, useContext } from 'react';

// creating a context object that will be filled with FavoritesProvider later, rn it's null
const FavoritesContext = createContext(null);

    
export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]); //our global state to store favorites

    const addFavorite = (newFavorite) => {
        // making sure item isn't already in the list of favorites and adding it if its new 
        if (!favorites.includes(newFavorite)) {
            setFavorites((prevFavorites) => [...prevFavorites, newFavorite]);
            return true; 
        }
        return false; // item is a duplicate
    };

    const removeFavorite = (item) => {
        // filters the list to remove the item clicked and update the state with the item removed
        setFavorites((prevFavorites) =>
            prevFavorites.filter((favorite) => favorite !== item)
        );
    };

    // Return the provider with the necessary values

    // Any component that is passed in the child prop will be rendered inside the provider
    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

// Our custom hook to use useContext(FavoritesContext) to access the favorites context in any component
export function useFavorites() {
    return useContext(FavoritesContext);
}