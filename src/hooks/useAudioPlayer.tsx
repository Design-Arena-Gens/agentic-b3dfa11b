import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, AVPlaybackStatus } from "expo-av";

export type Track = {
  id: string;
  uri: string;
  title: string;
  album?: string;
  artist?: string;
  duration?: number;
  artworkUri?: string | null;
  filename: string;
};

type PlaylistMap = Record<string, string[]>;

type AudioContextValue = {
  tracks: Track[];
  loading: boolean;
  currentTrack: Track | null;
  currentIndex: number | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isShuffleEnabled: boolean;
  progress: number;
  positionMillis: number;
  durationMillis: number;
  volume: number;
  favorites: Set<string>;
  playlists: PlaylistMap;
  autoResumeEnabled: boolean;
  initializeLibrary: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  playTrack: (index: number, options?: { forcePlay?: boolean }) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  seek: (positionMillis: number) => Promise<void>;
  setVolume: (value: number) => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  addPlaylist: (name: string) => Promise<void>;
  addTrackToPlaylist: (playlist: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlist: string, trackId: string) => Promise<void>;
  removePlaylist: (playlist: string) => Promise<void>;
  setAutoResumeEnabled: (value: boolean) => Promise<void>;
};

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

const FAVORITES_KEY = "NEONBEAT_FAVORITES_V1";
const PLAYLISTS_KEY = "NEONBEAT_PLAYLISTS_V1";
const LAST_TRACK_KEY = "NEONBEAT_LAST_TRACK_V1";
const AUTO_RESUME_KEY = "NEONBEAT_AUTO_RESUME_V1";
const SUPPORTED_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "aac"];

type PersistedLastTrack = {
  trackId: string;
  positionMillis: number;
};

function sanitizeTitle(filename: string) {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

async function ensureCacheDirectory() {
  const cacheDir = `${FileSystem.cacheDirectory}neonbeat/`;
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }
  return cacheDir;
}

export const AudioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<PlaylistMap>({ Liked: [] });
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionResponse | null>(null);
  const [autoResumeEnabled, setAutoResumeState] = useState(true);
  const lastTrackRef = useRef<PersistedLastTrack | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const playNextRef = useRef<() => Promise<void>>(async () => {});

  const currentTrack = useMemo(
    () => (currentIndex !== null ? tracks[currentIndex] ?? null : null),
    [currentIndex, tracks]
  );

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => undefined);
  }, []);

  const persistFavorites = useCallback(async (next: Set<string>) => {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
  }, []);

  const persistPlaylists = useCallback(async (next: PlaylistMap) => {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(next));
  }, []);

  const persistLastTrack = useCallback(async (payload: PersistedLastTrack | null) => {
    if (!payload) {
      await AsyncStorage.removeItem(LAST_TRACK_KEY);
      lastTrackRef.current = null;
      return;
    }
    lastTrackRef.current = payload;
    await AsyncStorage.setItem(LAST_TRACK_KEY, JSON.stringify(payload));
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ("error" in status) {
          console.warn("Playback error", status.error);
        }
        return;
      }
      setIsBuffering(status.isBuffering);
      setIsPlaying(status.isPlaying);
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? 1);

      if (status.didJustFinish) {
        void persistLastTrack({
          trackId: currentTrack?.id ?? "",
          positionMillis: 0,
        });
        void playNextRef.current();
      } else if (currentTrack) {
        void persistLastTrack({
          trackId: currentTrack.id,
          positionMillis: status.positionMillis ?? 0,
        });
      }
    },
    [currentTrack, persistLastTrack]
  );

  const unloadCurrentSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
        // ignore when already stopped
      }
      await soundRef.current.unloadAsync();
      soundRef.current.setOnPlaybackStatusUpdate(null);
      soundRef.current = null;
    }
  }, []);

  const loadSoundForTrack = useCallback(
    async (index: number, shouldPlay = true) => {
      if (!tracks[index]) return;
      const track = tracks[index];

      await unloadCurrentSound();

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.uri },
          { shouldPlay, volume, progressUpdateIntervalMillis: 250 },
          handlePlaybackStatus
        );
        soundRef.current = sound;
        setCurrentIndex(index);
        if (lastTrackRef.current?.trackId !== track.id) {
          await persistLastTrack({ trackId: track.id, positionMillis: 0 });
        }
      } catch (error) {
        console.warn("Failed to load track", error);
      }
    },
    [handlePlaybackStatus, persistLastTrack, tracks, unloadCurrentSound, volume]
  );

  const requestPermissionIfNeeded = useCallback(async () => {
    if (permissionStatus?.granted) return permissionStatus;
    const response = await MediaLibrary.requestPermissionsAsync(true);
    setPermissionStatus(response);
    return response;
  }, [permissionStatus]);

  const mapAssetsToTracks = useCallback(async (assets: MediaLibrary.Asset[]) => {
    const cacheDir = await ensureCacheDirectory();
    const result: Track[] = [];

    for (const asset of assets) {
      const extension = asset.filename.split(".").pop()?.toLowerCase();
      if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) continue;

      let artworkUri: string | null = null;
      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        const embeddedArtwork = (info as any)?.embeddedPicture ?? (info as any)?.embeddedArtwork;
        if (embeddedArtwork) {
          const artworkPath = `${cacheDir}${asset.id}.jpg`;
          await FileSystem.writeAsStringAsync(artworkPath, embeddedArtwork, {
            encoding: FileSystem.EncodingType.Base64,
          });
          artworkUri = artworkPath;
        } else if (info?.localUri && info.localUri !== asset.uri) {
          artworkUri = info.localUri;
        }
      } catch {
        // ignore artwork errors, continue
      }

      result.push({
        id: asset.id,
        uri: asset.uri,
        title: sanitizeTitle(asset.filename),
        album: asset.albumId ?? undefined,
        artist: (asset as any)?.artist ?? undefined,
        duration: asset.duration,
        artworkUri,
        filename: asset.filename,
      });
    }

    return result;
  }, []);

  const loadLibrary = useCallback(async () => {
    const { granted } = await requestPermissionIfNeeded();
    if (!granted) {
      setTracks([]);
      return;
    }

    setLoading(true);
    try {
      const assets: Track[] = [];
      let pagination: MediaLibrary.PagedInfo<MediaLibrary.Asset> | null = null;
      do {
        pagination = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 200,
          after: pagination?.endCursor,
        });
        const mapped = await mapAssetsToTracks(pagination.assets);
        assets.push(...mapped);
      } while (pagination.hasNextPage);

      assets.sort((a, b) => a.title.localeCompare(b.title));
      setTracks(assets);
      setShuffleOrder(assets.map((_, index) => index));
    } catch (error) {
      console.warn("Failed to load media library", error);
    } finally {
      setLoading(false);
    }
  }, [mapAssetsToTracks, requestPermissionIfNeeded]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as string[];
          setFavorites(new Set(parsed));
        }
      })
      .catch(() => undefined);

    AsyncStorage.getItem(PLAYLISTS_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as PlaylistMap;
          setPlaylists((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => undefined);

    AsyncStorage.getItem(LAST_TRACK_KEY)
      .then((value) => {
        if (value) {
          lastTrackRef.current = JSON.parse(value) as PersistedLastTrack;
        }
      })
      .catch(() => undefined);

    AsyncStorage.getItem(AUTO_RESUME_KEY)
      .then((value) => {
        if (value !== null) {
          setAutoResumeState(value === "true" || value === "1" || value === "" ? true : JSON.parse(value));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!tracks.length || !lastTrackRef.current || !autoResumeEnabled) return;
    const idx = tracks.findIndex((item) => item.id === lastTrackRef.current?.trackId);
    if (idx >= 0) {
      void (async () => {
        await loadSoundForTrack(idx, true);
        if (lastTrackRef.current?.positionMillis) {
          try {
            await soundRef.current?.setPositionAsync(lastTrackRef.current.positionMillis);
          } catch (error) {
            console.warn("Failed to restore last position", error);
          }
        }
      })();
    }
  }, [autoResumeEnabled, loadSoundForTrack, tracks]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        if (lastTrackRef.current?.trackId) {
          void persistLastTrack(lastTrackRef.current);
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [persistLastTrack]);

  const playTrack = useCallback(
    async (index: number, options?: { forcePlay?: boolean }) => {
      if (!tracks[index]) return;
      const shouldPlay = options?.forcePlay ?? true;
      await loadSoundForTrack(index, shouldPlay);
    },
    [loadSoundForTrack, tracks]
  );

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) {
      if (tracks.length) {
        await playTrack(0);
      }
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [playTrack, tracks.length]);

  const getNextIndex = useCallback(() => {
    if (!tracks.length) return null;
    if (isShuffleEnabled) {
      const currentOrder = shuffleOrder.length ? shuffleOrder : tracks.map((_, index) => index);
      const next = currentOrder[Math.floor(Math.random() * currentOrder.length)];
      return next;
    }
    if (currentIndex === null) return 0;
    return (currentIndex + 1) % tracks.length;
  }, [currentIndex, isShuffleEnabled, shuffleOrder, tracks]);

  const playNext = useCallback(async () => {
    const nextIndex = getNextIndex();
    if (nextIndex === null) return;
    await playTrack(nextIndex);
  }, [getNextIndex, playTrack]);

  const playPrevious = useCallback(async () => {
    if (!tracks.length) return;
    if (currentIndex === null) {
      await playTrack(0);
      return;
    }
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    await playTrack(prevIndex);
  }, [currentIndex, playTrack, tracks]);

  const toggleShuffle = useCallback(() => {
    if (!tracks.length) return;
    setIsShuffleEnabled((prev) => {
      if (!prev) {
        const order = tracks.map((_, index) => index);
        for (let i = order.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        setShuffleOrder(order);
      }
      return !prev;
    });
  }, [tracks]);

  const seek = useCallback(async (value: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(value);
    } catch (error) {
      console.warn("Seek failed", error);
    }
  }, []);

  const setVolume = useCallback(async (value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(clamped);
      } catch (error) {
        console.warn("Setting volume failed", error);
      }
    }
  }, []);

  const toggleFavorite = useCallback(
    async (trackId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }
        void persistFavorites(next);
        setPlaylists((playlistsState) => {
          const liked = new Set(playlistsState.Liked ?? []);
          if (next.has(trackId)) {
            liked.add(trackId);
          } else {
            liked.delete(trackId);
          }
          const updated = { ...playlistsState, Liked: [...liked] };
          void persistPlaylists(updated);
          return updated;
        });
        return next;
      });
    },
    [persistFavorites, persistPlaylists]
  );

  const addPlaylist = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPlaylists((prev) => {
        if (prev[trimmed]) return prev;
        const next = { ...prev, [trimmed]: [] };
        void persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists]
  );

  const addTrackToPlaylist = useCallback(
    async (playlist: string, trackId: string) => {
      setPlaylists((prev) => {
        const existing = prev[playlist] ?? [];
        if (existing.includes(trackId)) return prev;
        const next = { ...prev, [playlist]: [...existing, trackId] };
        void persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists]
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlist: string, trackId: string) => {
      setPlaylists((prev) => {
        const existing = prev[playlist] ?? [];
        const nextList = existing.filter((id) => id !== trackId);
        const next = { ...prev, [playlist]: nextList };
        void persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists]
  );

  const removePlaylist = useCallback(
    async (playlist: string) => {
      setPlaylists((prev) => {
        if (!prev[playlist] || playlist === "Liked") return prev;
        const next = { ...prev };
        delete next[playlist];
        void persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists]
  );

  const setAutoResumeEnabled = useCallback(async (enabled: boolean) => {
    setAutoResumeState(enabled);
    await AsyncStorage.setItem(AUTO_RESUME_KEY, JSON.stringify(enabled));
  }, []);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const value = useMemo<AudioContextValue>(() => {
    const progress = durationMillis ? positionMillis / durationMillis : 0;
    return {
      tracks,
      loading,
      currentTrack,
      currentIndex,
      isPlaying,
      isBuffering,
      isShuffleEnabled,
      progress,
      positionMillis,
      durationMillis,
      volume,
      favorites,
      playlists,
      autoResumeEnabled,
      initializeLibrary: loadLibrary,
      refreshLibrary: loadLibrary,
      playTrack,
      togglePlayPause,
      playNext,
      playPrevious,
      toggleShuffle,
      seek,
      setVolume,
      toggleFavorite,
      addPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      removePlaylist,
      setAutoResumeEnabled,
    };
  }, [
    addPlaylist,
    addTrackToPlaylist,
    autoResumeEnabled,
    currentIndex,
    currentTrack,
    durationMillis,
    favorites,
    isBuffering,
    isPlaying,
    isShuffleEnabled,
    loadLibrary,
    loading,
    playNext,
    playPrevious,
    playTrack,
    playlists,
    positionMillis,
    removePlaylist,
    removeTrackFromPlaylist,
    seek,
    setVolume,
    setAutoResumeEnabled,
    toggleFavorite,
    togglePlayPause,
    toggleShuffle,
    tracks,
    volume,
  ]);

  useEffect(() => {
    return () => {
      void unloadCurrentSound();
    };
  }, [unloadCurrentSound]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudioPlayer = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioProvider");
  }
  return context;
};
