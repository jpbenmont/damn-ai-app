import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONTS } from '../theme/fonts';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 - 100
  color?: string;
  bgColor?: string;
  label?: string;
  showText?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 50,
  strokeWidth = 5,
  progress,
  color = '#10B981',
  bgColor = '#D3F2E0',
  label,
  showText = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // If progress is 0, show tiny 1% indicator or dot
  const effProgress = Math.max(1.5, Math.min(100, progress));
  const strokeDashoffset = circumference - (effProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Track */}
        <Circle
          stroke={bgColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showText && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.textContainer}>
            <Text style={[styles.progressText, { color }]}>
              {label || `${Math.round(progress)}%`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: FONTS.headingBlack,
    fontSize: 11,
    fontWeight: '900',
  },
});
