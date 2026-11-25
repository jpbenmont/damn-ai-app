import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Image, View } from 'react-native';

interface MascotProps {
  size?: number;
  isFloating?: boolean;
  theme?: 'dark' | 'light';
}

export const MascotFace: React.FC<MascotProps> = ({ 
  size = 100, 
  isFloating = false,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFloating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isFloating]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: isFloating ? floatAnim : 0 }],
        },
      ]}
    >
      <Image
        source={require('../../assets/Damn_Avatar.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
