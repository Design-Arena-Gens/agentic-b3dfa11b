import React, { useEffect } from "react";
import LottieView from "lottie-react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

type VisualizerProps = {
  isPlaying: boolean;
};

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = isPlaying
      ? withRepeat(withTiming(1, { duration: 2000 }), -1, false)
      : withTiming(0, { duration: 600 });
  }, [animatedProgress, isPlaying]);

  const animatedProps = useAnimatedProps(() => ({
    progress: animatedProgress.value,
  }));

  return (
    <AnimatedLottie
      source={require("../assets/animations/visualizer.json")}
      style={{ width: 220, height: 220 }}
      loop
      animatedProps={animatedProps}
      autoPlay
    />
  );
};

export default Visualizer;
