import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Track, useAudioPlayer } from "../hooks/useAudioPlayer";

type SongCardProps = {
  track: Track;
  index: number;
  onPress?: () => void;
  onMore?: () => void;
  isActive?: boolean;
};

const fallbackArtwork = require("../assets/animations/fallback-artwork.png");

const SongCard: React.FC<SongCardProps> = ({ track, index, onPress, onMore, isActive }) => {
  const { favorites, toggleFavorite } = useAudioPlayer();
  const isFavorite = favorites.has(track.id);

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).springify().damping(18).stiffness(120)}
      className="mb-4"
    >
      <LinearGradient
        colors={["rgba(255,0,51,0.25)", "rgba(10,10,10,0.85)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-[1px]"
      >
        <Pressable
          onPress={onPress}
          android_ripple={{ color: "rgba(255,0,51,0.25)" }}
          className={`flex-row items-center gap-3 rounded-[28px] bg-[#070707]/95 px-3 py-3 ${
            isActive ? "border border-[#ff0033] shadow-[0_0_18px_rgba(255,0,51,0.35)]" : ""
          }`}
        >
          <View className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#ff0033]/40">
            <LinearGradient
              colors={["rgba(255,0,51,0.4)", "rgba(255,51,85,0.15)"]}
              className="absolute inset-0"
            />
            <Image
              source={track.artworkUri ? { uri: track.artworkUri } : fallbackArtwork}
              resizeMode="cover"
              className="h-full w-full"
            />
            {isActive && <View className="absolute inset-0 border-2 border-[#ff3355]/70 rounded-2xl" />}
          </View>

          <View className="flex-1">
            <Text className="font-display text-base text-white" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-xs text-white/60" numberOfLines={1}>
              {track.artist ?? "Unknown Artist"}
            </Text>
            {track.duration && (
              <Text className="mt-1 text-[11px] uppercase tracking-widest text-[#ff3355]">
                {(track.duration / 60).toFixed(1)} mins
              </Text>
            )}
          </View>

          <View className="flex h-full items-center justify-between gap-3">
            <Pressable
              onPress={() => toggleFavorite(track.id)}
              className="rounded-full bg-[#111]/80 p-2"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#ff0033" : "rgba(255,255,255,0.7)"}
              />
            </Pressable>
            <Pressable onPress={onMore} className="rounded-full bg-[#111]/80 p-2">
              <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
};

export default SongCard;
