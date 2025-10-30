import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeInDown } from "react-native-reanimated";

import SongCard from "../components/SongCard";
import { useAudioPlayer } from "../hooks/useAudioPlayer";

const PlaylistScreen: React.FC = () => {
  const {
    playlists,
    tracks,
    playTrack,
    removePlaylist,
    addPlaylist,
  } = useAudioPlayer();
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const trackIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    tracks.forEach((track, index) => map.set(track.id, index));
    return map;
  }, [tracks]);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert("Playlist name", "Please enter a playlist name");
      return;
    }
    await addPlaylist(playlistName.trim());
    setPlaylistName("");
    setModalVisible(false);
  };

  const playlistsEntries = useMemo(() => Object.entries(playlists), [playlists]);

  const handlePlayTrack = (trackId: string) => {
    const index = trackIndexMap.get(trackId);
    if (index !== undefined) {
      void playTrack(index, { forcePlay: true });
    }
  };

  return (
    <LinearGradient colors={["#050505", "#0a0306", "#050505"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 240 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(850)} className="mb-6">
          <Text className="font-display text-3xl text-[#ff0033]">Playlists</Text>
          <Text className="mt-2 text-sm text-white/60">
            Organize your music into neon-drenched collections.
          </Text>
        </Animated.View>

        <Pressable
          onPress={() => setModalVisible(true)}
          className="mb-6 flex-row items-center justify-between rounded-3xl border border-dashed border-[#ff0033]/50 bg-[#070707]/80 px-5 py-4"
        >
          <Text className="font-body text-sm text-white/80">Create playlist</Text>
          <Ionicons name="add-circle" size={26} color="#ff0033" />
        </Pressable>

        {playlistsEntries.map(([name, trackIds]) => {
          const playlistTracks = trackIds
            .map((id) => {
              const index = trackIndexMap.get(id);
              if (index === undefined) return null;
              return tracks[index];
            })
            .filter(Boolean) as typeof tracks[number][];

          return (
            <LinearGradient
              key={name}
              colors={["rgba(255,0,51,0.25)", "rgba(10,10,10,0.85)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mb-6 rounded-3xl p-[1px]"
            >
              <View className="rounded-3xl bg-[#050505]/95 px-5 py-4">
                <View className="mb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="font-display text-xl text-white">{name}</Text>
                    <Text className="text-xs text-white/50">{playlistTracks.length} tracks</Text>
                  </View>
                  {name !== "Liked" && (
                    <Pressable
                      onPress={() =>
                        Alert.alert("Remove playlist", `Delete ${name}?`, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: () => removePlaylist(name) },
                        ])
                      }
                      className="rounded-full border border-[#ff0033]/40 p-2"
                    >
                      <Ionicons name="trash" size={18} color="#ff0033" />
                    </Pressable>
                  )}
                </View>

                {playlistTracks.length ? (
                  playlistTracks.map((track, idx) => (
                    <SongCard
                      key={track.id}
                      track={track}
                      index={idx}
                      onPress={() => handlePlayTrack(track.id)}
                      isActive={false}
                    />
                  ))
                ) : (
                  <Text className="py-4 text-center text-sm text-white/40">No tracks yet</Text>
                )}
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-5">
          <View className="w-full rounded-3xl border border-[#ff0033]/40 bg-[#080808] p-6">
            <Text className="font-display text-lg text-white">Create Playlist</Text>
            <TextInput
              placeholder="Vibes, workouts, focus..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={playlistName}
              onChangeText={setPlaylistName}
              autoFocus
              className="mt-4 rounded-2xl border border-[#ff0033]/40 bg-[#050505] px-4 py-3 font-body text-white"
            />
            <View className="mt-6 flex-row justify-end gap-3">
              <Pressable onPress={() => setModalVisible(false)} className="px-4 py-2">
                <Text className="text-sm text-white/60">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreatePlaylist}
                className="rounded-full border border-[#ff0033] bg-[#ff0033]/20 px-5 py-2"
              >
                <Text className="font-body text-sm uppercase tracking-[2px] text-[#ff0033]">Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default PlaylistScreen;
