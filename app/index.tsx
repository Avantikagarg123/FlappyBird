import { useWindowDimensions } from "react-native";
import { Canvas, useImage, Image } from "@shopify/react-native-skia";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
} from "react-native-reanimated";
import { useEffect } from "react";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

const GRAVITY = 100;
const App = () => {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipeBottom = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeTop = useImage(require("../assets/sprites/pipe-green.png"));
  const base = useImage(require("../assets/sprites/base.png"));

  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 2);
  const birdYVelocity = useSharedValue(100);
  const pipeOffset = 0;
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-200, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = -100;
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          {/* Background */}
          <Image image={bg} width={width} height={height} fit={"cover"} />
          {/* base */}
          <Image
            image={base}
            width={width}
            height={150}
            y={height - 75}
            x={0}
            fit={"cover"}
          />
          {/* Pipe */}
          <Image
            image={pipeTop}
            y={pipeOffset - 320}
            x={x}
            width={104}
            height={640}
          />
          <Image
            image={pipeBottom}
            y={height - 320 + pipeOffset}
            x={x}
            width={104}
            height={640}
          />

          {/* Bird */}
          <Image
            image={bird}
            y={birdY}
            x={width / 4}
            width={64}
            height={48}
            fit={"contain"}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;
