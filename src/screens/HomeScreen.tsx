import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import SongCard from "../components/SongCard";
import { useAudioPlayer } from "../hooks/useAudioPlayer";

const HomeScreen: React.FC = () => {
  const { top } = useSafeAreaInsets();
  const { tracks, loading, playTrack, currentIndex, refreshLibrary, playlists, addTrackToPlaylist } =
    useAudioPlayer();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const handleOpenPicker = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setPickerVisible(true);
    },
    []
  );

  const handleAddToPlaylist = useCallback(
    async (playlistName: string) => {
      if (selectedTrackId) {
        await addTrackToPlaylist(playlistName, selectedTrackId);
      }
      setPickerVisible(false);
      setSelectedTrackId(null);
    },
    [addTrackToPlaylist, selectedTrackId]
  );


  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshLibrary();
    setIsRefreshing(false);
  }, [refreshLibrary]);

  const libraryHeader = useMemo(
    () => (
      <View className="mb-6">
        <Animated.Text
          entering={FadeInDown.duration(900)}
          className="text-center font-display text-4xl uppercase tracking-[0.8em] text-[#ff0033] drop-shadow-[0_0_15px_rgba(255,0,51,0.8)]"
        >
          NeonBeat
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(200)}
          className="mt-4 text-center font-body text-sm text-white/70"
        >
          Dive into your personal universe of sound.
        </Animated.Text>
      </View>
    ),
    []
  );

  return (
    <LinearGradient
      colors={["#050505", "#12020a", "#050505"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, paddingTop: top + 20 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ff0033" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220 }}
      >
        {libraryHeader}
        <Animated.View
          entering={FadeInUp.duration(950)}
          className="mb-6 rounded-3xl border border-[#ff0033]/30 bg-[#070707]/90 p-5"
        >
          <Text className="font-display text-lg text-white">Library</Text>
          <Text className="mt-1 text-sm text-white/50">
            {loading ? "Scanning your device..." : `${tracks.length} tracks detected`}
          </Text>
        </Animated.View>

        <View>
          {tracks.map((track, index) => (
            <SongCard
              key={track.id}
              index={index}
              track={track}
              onPress={() => playTrack(index)}
              isActive={currentIndex === index}
              onMore={() => handleOpenPicker(track.id)}
            />
          ))}
          {!tracks.length && !loading && (
            <Animated.View entering={FadeInDown.delay(150)} className="mt-20 items-center">
              <Text className="font-display text-lg text-white/70">No songs found</Text>
              <Text className="mt-3 text-center text-sm text-white/40">
                Grant NeonBeat access to your media library or drop music files into your device storage.
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={pickerVisible} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full rounded-3xl border border-[#ff0033]/40 bg-[#080808] p-5">
            <Text className="font-display text-lg text-white">Add to playlist</Text>
            <View className="mt-4 gap-3">
              {Object.keys(playlists).map((name) => (
                <Pressable
                  key={name}
                  onPress={() => handleAddToPlaylist(name)}
                  className="rounded-2xl border border-[#ff0033]/40 bg-[#050505] px-4 py-3"
                >
                  <Text className="font-body text-sm text-white">{name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => {
                setPickerVisible(false);
                setSelectedTrackId(null);
              }}
              className="mt-5 self-end"
            >
              <Text className="text-sm text-white/60">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;
