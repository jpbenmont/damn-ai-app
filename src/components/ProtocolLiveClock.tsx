import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radio } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

export const ProtocolLiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();

  // Calculate remaining time until 11:59:59 PM today
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const leftHours = Math.floor(diffMs / (1000 * 60 * 60));
  const leftMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const leftSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  // Time of day phase
  let phaseText = 'MIDDAY LOCK-IN';
  let phaseColor = COLORS.accentGreen;
  let phaseBg = '#ECFDF5';

  if (hours >= 5 && hours < 12) {
    phaseText = 'MORNING PROTOCOL';
    phaseColor = '#D97706';
    phaseBg = '#FFFBEB';
  } else if (hours >= 12 && hours < 17) {
    phaseText = 'PEAK FOCUS WINDOW';
    phaseColor = '#059669';
    phaseBg = '#ECFDF5';
  } else if (hours >= 17 && hours < 21) {
    phaseText = 'EVENING EXECUTION';
    phaseColor = '#6366F1';
    phaseBg = '#EEF2FF';
  } else {
    phaseText = 'FINAL ROLLOVER COUNTDOWN';
    phaseColor = '#EF4444';
    phaseBg = '#FEF2F2';
  }

  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.phaseBadge, { backgroundColor: phaseBg }]}>
          <Radio size={12} color={phaseColor} strokeWidth={2.5} />
          <Text style={[styles.phaseText, { color: phaseColor }]}>{phaseText}</Text>
        </View>

        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>REAL-TIME SYNC</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.clockCol}>
          <Text style={styles.clockLabel}>LOCAL TIME</Text>
          <Text style={styles.timeVal}>{formattedTime}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.countdownCol}>
          <Text style={styles.countdownLabel}>DAY ROLLOVER IN</Text>
          <Text style={styles.countdownVal}>
            {String(leftHours).padStart(2, '0')}h {String(leftMins).padStart(2, '0')}m {String(leftSecs).padStart(2, '0')}s
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    color: '#71717A',
    letterSpacing: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clockCol: {
    flex: 1,
  },
  clockLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.textSub,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timeVal: {
    fontFamily: FONTS.headingExtraBold,
    fontSize: 18,
    color: COLORS.textMain,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 12,
  },
  countdownCol: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  countdownLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.textSub,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  countdownVal: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 0.5,
  },
});
