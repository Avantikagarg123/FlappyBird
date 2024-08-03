import { Platform, useWindowDimensions} from "react-native";
import {
  Canvas,
  useImage,
  Image,
  Group,
  Text,
  matchFont
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

const GRAVITY = 400;
const JUMP_FORCE = -200;
const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipeBottom = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeTop = useImage(require("../assets/images/pipe-green-top.png"));
  const base = useImage(require("../assets/sprites/base.png"));
  const gameOver = useSharedValue(false);
  const pipex = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  // Crossing the Pipe
  const birdX = width / 4;
  // const birdCenterX = useDerivedValue(() => birdX + 32);
  // const birdCenterY = useDerivedValue(() => birdY.value + 24);
  const birdYVelocity = useSharedValue(0);
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);
  const pipeSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 10], [1, 2]);
  });
  const obstacles = useDerivedValue(() => {
    return [
      //bottom pipe
      {
        x: pipex.value,
        y: bottomPipeY.value,
        h: pipeHeight,
        w: pipeWidth,
      },

      // top pipe
      {
        x: pipex.value,
        y: topPipeY.value,
        h: pipeHeight,
        w: pipeWidth,
      },
    ];
  });

  // Pipes Repeating
  useEffect(() => {
    moveTheMap();
  }, []);
  const moveTheMap = () => {
    pipex.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-200, {
        duration: 3000 / pipeSpeed.value,
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 })
    );
  };

  //Scoring System
  useAnimatedReaction(
    () => pipex.value,
    (currentValue, previousValue) => {
      const middle = birdX;
      //change pipeoffset for the position the pipes
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipex);
        runOnJS(moveTheMap)();
      }
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        // do something ✨
        runOnJS(setScore)(score + 1);
      }
    }
  );

  const isPointCollidingWithRect = (point: any, rect: any) => {
    "worklet";
    //Bottom Pipe
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
    );
  };

  //Collision Detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };
      // floor collision detection
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );
      if (isColliding) {
        gameOver.value = true;
      }
      //   //Bottom Pipe
      //   if (
      //     birdCenterX.value >= x.value &&
      //     birdCenterX.value <= x.value + pipeWidth &&
      //     birdCenterY.value >= height - 320 + pipeOffset &&
      //     birdCenterY.value <= height - 320 + pipeOffset + pipeHeight
      //   ) {
      //     gameOver.value = true;
      //   }

      //   //Top Pipe
      //   if (
      //     birdCenterX.value >= x.value &&
      //     birdCenterX.value <= x.value + pipeWidth &&
      //     birdCenterY.value >= pipeOffset-320 &&
      //     birdCenterY.value <= pipeOffset-320 + pipeHeight
      //   ) {
      //     gameOver.value = true;
      //   }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipex);
      }
    }
  );

  //  Bird Falling
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipex.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  // Bird Movement
  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      //restart
      restartGame();
    } else {
      //Jump
      birdYVelocity.value = JUMP_FORCE;
    }
  });
  // Bird Rotation
  const birdTranform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-200, 200],
          [-0.2, 0.2],
          Extrapolation.CLAMP
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });

  // Count
  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 50,
  };
  const font = matchFont(fontStyle);

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
            y={topPipeY}
            x={pipex}
            width={pipeWidth}
            height={pipeHeight}
          />
          <Image
            image={pipeBottom}
            y={bottomPipeY}
            x={pipex}
            width={pipeWidth}
            height={pipeHeight}
          />

          {/* Bird */}
          <Group transform={birdTranform} origin={birdOrigin}>
            <Image image={bird} y={birdY} x={birdX} width={64} height={48} />
          </Group>
          {/* Sim */}
          {/* <Circle cy={birdCenterY} cx={birdCenterX} r={15} color={"red"} /> */}

          {/* Score */}

          <Text
            x={width / 2 - 20}
            y={100}
            text={score.toString()}
            font={font}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;
