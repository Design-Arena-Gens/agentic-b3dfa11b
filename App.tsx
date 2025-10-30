import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme, View } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import PlaylistScreen from "./src/screens/PlaylistScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PlayerScreen from "./src/screens/PlayerScreen";
import MiniPlayer from "./src/components/MiniPlayer";
import { AudioProvider } from "./src/hooks/useAudioPlayer";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const neonTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#050505",
    card: "rgba(15,15,15,0.85)",
    primary: "#ff0033",
    text: "#f5f5f5",
    border: "rgba(255,0,51,0.4)",
    notification: "#ff3355",
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10,10,10,0.92)",
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#ff0033",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Playlists") {
            iconName = focused ? "albums" : "albums-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Playlists" component={PlaylistScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AudioProvider>
          <NavigationContainer theme={scheme === "dark" ? neonTheme : neonTheme}>
            <View className="flex-1 bg-[#050505]">
              <Stack.Navigator>
                <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
                <Stack.Screen
                  name="Player"
                  component={PlayerScreen}
                  options={{ headerShown: false, presentation: "transparentModal" }}
                />
              </Stack.Navigator>
              <MiniPlayer />
              <StatusBar style="light" />
            </View>
          </NavigationContainer>
        </AudioProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
