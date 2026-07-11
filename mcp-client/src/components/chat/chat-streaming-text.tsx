import { useEffect, useRef } from "react";
import { Animated } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ClassNames } from "@/constants/theme";

interface Props {
  text: string;
  isStreaming: boolean;
}

export function ChatStreamingText({ text, isStreaming }: Props) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isStreaming) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [isStreaming, cursorOpacity]);

  if (!text && !isStreaming) return null;

  return (
    <ThemedText className={ClassNames.bodyLineHeight}>
      {text}
      {isStreaming && (
        <Animated.Text className="text-primary" style={{ opacity: cursorOpacity }}>
          ▍
        </Animated.Text>
      )}
    </ThemedText>
  );
}
