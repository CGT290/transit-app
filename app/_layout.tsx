import { Stack } from "expo-router";
import { FavoritesProvider } from "./(tabs)/FavoritesContext";

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false, // hides the extra header 
        }}
      />
      <Stack.Screen name="+not-found" options={{}} />
    </Stack>
    </FavoritesProvider>
    
  );
}
