import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false, // hides the extra header 
        }}
      />
      <Stack.Screen name="+not-found" options={{}} />
    </Stack>
  );
}
