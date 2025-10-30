import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useAudioPlayer } from "../hooks/useAudioPlayer";

const ControlButton: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  active?: boolean;
  onPress: () => void;
}> = ({ icon, size = 28, active, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`rounded-full border border-[#ff0033]/40 bg-[#111]/80 p-4 ${
      active ? "shadow-[0_0_20px_rgba(255,0,51,0.45)]" : ""
    }`}
    android_ripple={{ color: "rgba(255,0,51,0.2)", borderless: true }}
  >
    <Ionicons name={icon} size={size} color={active ? "#ff0033" : "#f5f5f5"} />
  </Pressable>
);

const PlayerControls: React.FC = () => {
  const {
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleShuffle,
    isShuffleEnabled,
    currentTrack,
    toggleFavorite,
    favorites,
  } = useAudioPlayer();

  const vibrate = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePress = useCallback(
    async (callback: () => Promise<void> | void) => {
      await vibrate();
      await callback();
    },
    [vibrate]
  );

  return (
    <View className="w-full">
      <LinearGradient
        colors={["rgba(10,10,10,0.6)", "rgba(255,0,51,0.15)"]}
        className="mb-6 flex-row items-center justify-between rounded-full px-5 py-4"
      >
        <Pressable
          onPress={() =>
            currentTrack ? handlePress(() => toggleFavorite(currentTrack.id)) : Promise.resolve()
          }
          className="rounded-full bg-[#080808]/80 p-3"
        >
          <Ionicons
            name={currentTrack && favorites.has(currentTrack.id) ? "heart" : "heart-outline"}
            size={22}
            color="#ff0033"
          />
        </Pressable>

        <ControlButton icon="play-back" onPress={() => handlePress(playPrevious)} size={26} />

        <Pressable
          onPress={() => handlePress(togglePlayPause)}
          className="rounded-full border border-[#ff0033] bg-[#ff0033]/10 p-6 shadow-[0_0_25px_rgba(255,0,51,0.55)]"
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={34} color="#ff0033" />
        </Pressable>

        <ControlButton icon="play-forward" onPress={() => handlePress(playNext)} size={26} />

        <ControlButton
          icon={isShuffleEnabled ? "shuffle" : "shuffle-outline"}
          onPress={() => handlePress(toggleShuffle)}
          size={22}
          active={isShuffleEnabled}
        />
      </LinearGradient>

      {currentTrack && (
        <Text className="text-center font-body text-xs uppercase tracking-[4px] text-[#ff3355]/80">
          {currentTrack.title}
        </Text>
      )}
    </View>
  );
};

export default PlayerControls;
