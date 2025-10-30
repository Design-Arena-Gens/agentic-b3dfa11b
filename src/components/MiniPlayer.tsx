import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useAudioPlayer } from "../hooks/useAudioPlayer";

const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, progress } = useAudioPlayer();
  const navigation = useNavigation();

  const shouldHide = useMemo(() => {
    const routes = navigation.getState()?.routes ?? [];
    const lastRoute = routes[routes.length - 1];
    return !currentTrack || lastRoute?.name === "Player";
  }, [currentTrack, navigation]);

  const animatedProgress = useDerivedValue(() => withTiming(progress, { duration: 350 }));

  const progressStyle = useAnimatedStyle(() => ({
    flex: Math.max(animatedProgress.value, 0.02),
  }));

  if (shouldHide) return null;

  return (
    <View className="absolute bottom-20 left-0 right-0 px-4">
      <LinearGradient
        colors={["rgba(255,0,51,0.35)", "rgba(10,10,10,0.85)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="overflow-hidden rounded-3xl border border-[#ff0033]/40"
      >
        <View className="h-1 flex-row bg-[#111]/60">
          <Animated.View style={progressStyle} className="h-full bg-[#ff0033]" />
          <View className="flex-1" />
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => navigation.navigate("Player" as never)}
            className="flex-1"
          >
            <Text className="font-display text-sm text-white" numberOfLines={1}>
              {currentTrack?.title}
            </Text>
            <Text className="text-[11px] uppercase tracking-[3px] text-white/60" numberOfLines={1}>
              {currentTrack?.artist ?? "Unknown Artist"}
            </Text>
          </Pressable>
          <Pressable
            onPress={togglePlayPause}
            className="rounded-full border border-[#ff0033]/60 bg-[#111]/90 p-3"
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#ff0033" />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

export default MiniPlayer;
