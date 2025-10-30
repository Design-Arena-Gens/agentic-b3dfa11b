import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAudioPlayer } from "../hooks/useAudioPlayer";

const SettingsRow: React.FC<{
  title: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}> = ({ title, description, right, onPress }) => (
  <Pressable
    onPress={onPress}
    className="mb-4 rounded-3xl border border-[#ff0033]/25 bg-[#080808]/70 px-5 py-4"
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="font-display text-base text-white">{title}</Text>
        {description ? <Text className="mt-1 text-xs text-white/50">{description}</Text> : null}
      </View>
      {right}
    </View>
  </Pressable>
);

const SettingsScreen: React.FC = () => {
  const { autoResumeEnabled, setAutoResumeEnabled, refreshLibrary, tracks } = useAudioPlayer();
  const [rescanning, setRescanning] = useState(false);

  const handleRescan = async () => {
    setRescanning(true);
    await refreshLibrary();
    setRescanning(false);
  };

  return (
    <LinearGradient colors={["#050505", "#12020a", "#050505"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 240 }}>
        <Animated.View entering={FadeInDown.duration(900)} className="mb-6">
          <Text className="font-display text-3xl text-[#ff0033]">Settings</Text>
          <Text className="mt-2 text-sm text-white/60">
            Tailor NeonBeat to pulse the way you like.
          </Text>
        </Animated.View>

        <SettingsRow
          title="Auto resume playback"
          description="Continue the vibe with the last track whenever NeonBeat opens."
          right={
            <Switch
              value={autoResumeEnabled}
              onValueChange={(value) => void setAutoResumeEnabled(value)}
              trackColor={{ true: "#ff3355", false: "#222" }}
              thumbColor={autoResumeEnabled ? "#ff0033" : "#555"}
            />
          }
        />

        <SettingsRow
          title="Rescan library"
          description="Sync new songs dropped into your device."
          onPress={handleRescan}
          right={<Ionicons name={rescanning ? "sync" : "refresh"} size={20} color="#ff0033" />}
        />

        <SettingsRow
          title="Support"
          description="Reach out or read the docs for NeonBeat."
          onPress={() => Linking.openURL("https://docs.expo.dev/versions/latest/sdk/av/")}
          right={<Ionicons name="open-outline" size={18} color="#ff3355" />}
        />

        <View className="mt-10 rounded-3xl border border-[#ff0033]/30 bg-[#090909]/70 px-5 py-5">
          <Text className="font-display text-sm uppercase tracking-[4px] text-white/40">Diagnostics</Text>
          <View className="mt-3 flex-row justify-between">
            <Text className="font-body text-xs text-white/60">Tracks indexed</Text>
            <Text className="font-body text-xs text-[#ff3355]">{tracks.length}</Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="font-body text-xs text-white/60">Auto resume</Text>
            <Text className="font-body text-xs text-[#ff3355]">
              {autoResumeEnabled ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SettingsScreen;
