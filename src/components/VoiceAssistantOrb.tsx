import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceAssistantOrbProps {
  assistantState: AssistantState;
  onPressMic: () => void;
  isMuted?: boolean;
  personality?: 'hype' | 'chill' | 'savage' | 'zen';
  currentTranscript?: string;
}

export const VoiceAssistantOrb: React.FC<VoiceAssistantOrbProps> = ({
  assistantState,
  onPressMic,
  isMuted = false,
  personality = 'hype',
  currentTranscript = '',
}) => {
  // 11 dynamic wave bars for rich audio frequency soundwave visualizer
  const bar0 = useRef(new Animated.Value(12)).current;
  const bar1 = useRef(new Animated.Value(20)).current;
  const bar2 = useRef(new Animated.Value(32)).current;
  const bar3 = useRef(new Animated.Value(48)).current;
  const bar4 = useRef(new Animated.Value(64)).current;
  const bar5 = useRef(new Animated.Value(80)).current; // center peak
  const bar6 = useRef(new Animated.Value(64)).current;
  const bar7 = useRef(new Animated.Value(48)).current;
  const bar8 = useRef(new Animated.Value(32)).current;
  const bar9 = useRef(new Animated.Value(20)).current;
  const bar10 = useRef(new Animated.Value(12)).current;

  // Dynamic Audio Waveform Animation
  useEffect(() => {
    let waveLoop: Animated.CompositeAnimation | null = null;

    const animateBar = (animVal: Animated.Value, min: number, max: number, duration: number) => {
      return Animated.sequence([
        Animated.timing(animVal, {
          toValue: max,
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
        Animated.timing(animVal, {
          toValue: min,
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
      ]);
    };

    if (assistantState === 'listening') {
      waveLoop = Animated.loop(
        Animated.parallel([
          animateBar(bar0, 8, 38, 240),
          animateBar(bar1, 14, 52, 280),
          animateBar(bar2, 20, 68, 230),
          animateBar(bar3, 26, 82, 290),
          animateBar(bar4, 32, 92, 220),
          animateBar(bar5, 38, 98, 260),
          animateBar(bar6, 32, 90, 210),
          animateBar(bar7, 26, 80, 300),
          animateBar(bar8, 20, 66, 250),
          animateBar(bar9, 14, 50, 270),
          animateBar(bar10, 8, 36, 240),
        ])
      );
      waveLoop.start();
    } else if (assistantState === 'speaking') {
      waveLoop = Animated.loop(
        Animated.parallel([
          animateBar(bar0, 10, 30, 310),
          animateBar(bar1, 16, 44, 340),
          animateBar(bar2, 24, 60, 290),
          animateBar(bar3, 30, 72, 330),
          animateBar(bar4, 36, 82, 280),
          animateBar(bar5, 42, 88, 320),
          animateBar(bar6, 36, 80, 290),
          animateBar(bar7, 30, 70, 350),
          animateBar(bar8, 24, 58, 300),
          animateBar(bar9, 16, 42, 330),
          animateBar(bar10, 10, 28, 320),
        ])
      );
      waveLoop.start();
    } else if (assistantState === 'thinking') {
      waveLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(bar0, { toValue: 24, duration: 200, useNativeDriver: false }),
            Animated.timing(bar5, { toValue: 40, duration: 200, useNativeDriver: false }),
            Animated.timing(bar10, { toValue: 24, duration: 200, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(bar0, { toValue: 12, duration: 200, useNativeDriver: false }),
            Animated.timing(bar5, { toValue: 60, duration: 200, useNativeDriver: false }),
            Animated.timing(bar10, { toValue: 12, duration: 200, useNativeDriver: false }),
          ]),
        ])
      );
      waveLoop.start();
    } else {
      // Idle resting wave
      Animated.parallel([
        Animated.timing(bar0, { toValue: 12, duration: 250, useNativeDriver: false }),
        Animated.timing(bar1, { toValue: 20, duration: 250, useNativeDriver: false }),
        Animated.timing(bar2, { toValue: 32, duration: 250, useNativeDriver: false }),
        Animated.timing(bar3, { toValue: 48, duration: 250, useNativeDriver: false }),
        Animated.timing(bar4, { toValue: 64, duration: 250, useNativeDriver: false }),
        Animated.timing(bar5, { toValue: 80, duration: 250, useNativeDriver: false }),
        Animated.timing(bar6, { toValue: 64, duration: 250, useNativeDriver: false }),
        Animated.timing(bar7, { toValue: 48, duration: 250, useNativeDriver: false }),
        Animated.timing(bar8, { toValue: 32, duration: 250, useNativeDriver: false }),
        Animated.timing(bar9, { toValue: 20, duration: 250, useNativeDriver: false }),
        Animated.timing(bar10, { toValue: 12, duration: 250, useNativeDriver: false }),
      ]).start();
    }

    return () => {
      waveLoop?.stop();
    };
  }, [assistantState]);

  // Determine state colors
  let stateColor = '#141416';
  let statusText = 'TAP WAVE TO SPEAK';
  let badgeBg = '#F3F4F6';
  let badgeColor = COLORS.textSub;

  if (assistantState === 'listening') {
    stateColor = '#059669';
    statusText = 'LISTENING...';
    badgeBg = '#ECFDF5';
    badgeColor = '#059669';
  } else if (assistantState === 'thinking') {
    stateColor = '#D97706';
    statusText = 'PROCESSING...';
    badgeBg = '#FFFBEB';
    badgeColor = '#D97706';
  } else if (assistantState === 'speaking') {
    stateColor = '#6D28D9';
    statusText = 'SPEAKING...';
    badgeBg = '#EDE7F6';
    badgeColor = '#6D28D9';
  }

  const bars = [bar0, bar1, bar2, bar3, bar4, bar5, bar6, bar7, bar8, bar9, bar10];

  return (
    <View style={styles.container}>
      {/* Dynamic Status Capsule */}
      <View style={[styles.statusCapsule, { backgroundColor: badgeBg }]}>
        <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
        <Text style={[styles.statusCapsuleText, { color: badgeColor }]}>{statusText}</Text>
        <Text style={styles.personalityTag}>• WISPR FLOW</Text>
      </View>

      {/* Voice Assistant Wave Visualizer Container (PURE SOUND WAVE ONLY - NO MIC ICON) */}
      <TouchableOpacity
        style={styles.waveVisualizerBox}
        onPress={onPressMic}
        activeOpacity={0.85}
      >
        {/* Animated Sound Wave Bars */}
        <View style={styles.waveformRow}>
          {bars.map((barAnim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.waveBar,
                {
                  height: barAnim,
                  backgroundColor: stateColor,
                  opacity: assistantState === 'idle' ? 0.88 : 1,
                },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>

      {/* Spoken Query Real-time Transcript Preview */}
      {currentTranscript ? (
        <View style={styles.transcriptBubble}>
          <Text style={styles.transcriptLabel}>HEARING:</Text>
          <Text style={styles.transcriptText}>"{currentTranscript}"</Text>
        </View>
      ) : (
        <Text style={styles.hintSubtext}>
          {assistantState === 'listening'
            ? 'Say: "Remind me in 2 hours to...", "Add milk to family shopping", "Tell family dinner tonight"'
            : 'Tap wave or say "Hey DAMN" for instant reminders & shopping radar'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 10,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusCapsuleText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  personalityTag: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  waveVisualizerBox: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    backgroundColor: '#FAFAF8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7.5,
    height: 100,
    width: '100%',
    paddingHorizontal: 20,
  },
  waveBar: {
    width: 7,
    borderRadius: 5,
    minHeight: 8,
  },
  transcriptBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginTop: 8,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    alignItems: 'center',
  },
  transcriptLabel: {
    fontFamily: FONTS.outfitBold,
    fontSize: 9,
    color: COLORS.accentGreen,
    letterSpacing: 1,
    marginBottom: 2,
  },
  transcriptText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    color: COLORS.textMain,
    textAlign: 'center',
  },
  hintSubtext: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
});
