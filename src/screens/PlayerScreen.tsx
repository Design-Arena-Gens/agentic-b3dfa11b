import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import Animated, { FadeInUp, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import PlayerControls from "../components/PlayerControls";
import Visualizer from "../components/Visualizer";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { formatTime } from "../utils/formatTime";

const fallbackArtwork = require("../assets/animations/fallback-artwork.png");

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NeonProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 260 }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 450 });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - circumference * Math.max(0, Math.min(animatedProgress.value, 1)),
  }));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#2a0a12"
        strokeWidth={6}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ff0033"
        strokeLinecap="round"
        strokeWidth={8}
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={animatedProps}
        fill="none"
      />
    </Svg>
  );
};

const PlayerScreen: React.FC = () => {
  const { top, bottom } = useSafeAreaInsets();
  const {
    currentTrack,
    progress,
    positionMillis,
    durationMillis,
    seek,
    setVolume,
    volume,
    isPlaying,
  } = useAudioPlayer();
  const navigation = useNavigation();
  const [seekingValue, setSeekingValue] = useState<number | null>(null);

  const handleSeekComplete = async (value: number) => {
    setSeekingValue(null);
    await seek(value);
  };

  const displayProgress = seekingValue ?? positionMillis;

  const albumArtSource = useMemo(
    () => (currentTrack?.artworkUri ? { uri: currentTrack.artworkUri } : fallbackArtwork),
    [currentTrack?.artworkUri]
  );

  return (
    <LinearGradient
      colors={["rgba(10,0,5,1)", "rgba(10,10,10,0.95)"]}
      style={{ flex: 1, paddingTop: top + 20, paddingBottom: bottom + 60 }}
    >
      <View className="flex-1 px-5">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => navigation.goBack()} className="rounded-full border border-[#ff0033]/40 p-3">
            <Ionicons name="chevron-down" size={22} color="#ff0033" />
          </Pressable>
          <Text className="font-display text-lg uppercase tracking-[0.6em] text-white/70">
            Now Playing
          </Text>
          <View className="h-10 w-10" />
        </View>

        <Animated.View entering={FadeInUp.duration(1200)} className="mt-12 items-center">
          <View className="rounded-[40px] border border-[#ff0033]/40 bg-[#080808]/80 p-4">
            <View className="absolute inset-0 -m-8 rounded-[48px] opacity-70">
              <NeonProgressRing progress={progress} />
            </View>
            <View className="h-[220px] w-[220px] overflow-hidden rounded-[36px] border border-[#ff0033]/50">
              <Image source={albumArtSource} resizeMode="cover" className="h-full w-full" />
              <LinearGradient
                colors={["transparent", "rgba(255,0,51,0.25)"]}
                className="absolute bottom-0 left-0 right-0 h-1/3"
              />
            </View>
          </View>

          <View className="mt-8 items-center">
            <Text className="font-display text-2xl text-white" numberOfLines={1}>
              {currentTrack?.title ?? "Nothing playing"}
            </Text>
            <Text className="mt-2 text-sm text-white/60" numberOfLines={1}>
              {currentTrack?.artist ?? "Unknown Artist"}
            </Text>
          </View>

          <View className="mt-8 items-center">
            <Visualizer isPlaying={isPlaying} />
          </View>
        </Animated.View>

        <View className="mt-8">
          <View className="flex-row justify-between">
            <Text className="font-body text-xs text-white/60">{formatTime(displayProgress)}</Text>
            <Text className="font-body text-xs text-white/40">{formatTime(durationMillis)}</Text>
          </View>
          <Slider
            value={displayProgress}
            minimumValue={0}
            maximumValue={durationMillis || 1}
            minimumTrackTintColor="#ff0033"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#ff0033"
            onValueChange={(value) => setSeekingValue(value)}
            onSlidingComplete={handleSeekComplete}
            style={{ marginTop: 12 }}
          />
        </View>

        <View className="mt-4 flex-row items-center justify-between rounded-3xl border border-[#ff0033]/30 bg-[#070707]/70 px-4 py-3">
          <Ionicons name="volume-low" size={22} color="#ff0033" />
          <Slider
            value={volume}
            onValueChange={(value) => setVolume(value)}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#ff3355"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#ff3355"
            style={{ flex: 1, marginHorizontal: 12 }}
          />
          <Ionicons name="volume-high" size={22} color="#ff3355" />
        </View>

        <View className="mt-10">
          <PlayerControls />
        </View>
      </View>
    </LinearGradient>
  );
};

export default PlayerScreen;
