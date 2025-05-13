import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";


export default function TabsLayout() {
  return (
    //Instead of changing the text of the tabs look into changing the icon colors
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "HomePage",
          headerTitleAlign: "center",
          tabBarLabel: "Home",
          tabBarIcon: () => <FontAwesome6 name="train-subway" size={27} />,
        }}
      />
      <Tabs.Screen
        name="Favorites"
        options={{
          headerTitle: "FavoritesPage",
          headerTitleAlign: "center",
          tabBarIcon: () => <Ionicons name="heart" size={27} />,
        }}
      />
      <Tabs.Screen
        name="LiveFeed"
        options={{
          headerTitle: "Feed",
          headerTitleAlign: "center",
          tabBarIcon: () => <FontAwesome name="feed" size={27} />,
        }}
      />
    </Tabs>
  );
}