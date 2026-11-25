import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const HydrationCard: React.FC = () => {
  const { state, addWater } = useApp();
  const current = state.user.waterCurrentMl || 0;
  const goal = state.user.waterGoalMl || 3000;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Droplet size={19} color={COLORS.accentBlue} strokeWidth={2.5} />
          <Text style={styles.title}>Hydration</Text>
        </View>
        <Text style={styles.goalText}>{goal}ml</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.infoRow}>
        <View style={styles.valRow}>
          <Text style={styles.currentVal}>{current}</Text>
          <Text style={styles.unit}>ml</Text>
        </View>
        <Text style={styles.pctText}>{pct}% of daily goal</Text>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.btnGrid}>
        <TouchableOpacity style={styles.btnWater} onPress={() => addWater(250)} activeOpacity={0.7}>
          <Text style={styles.btnWaterText}>+250ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWater} onPress={() => addWater(500)} activeOpacity={0.7}>
          <Text style={styles.btnWaterText}>+500ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWater} onPress={() => addWater(750)} activeOpacity={0.7}>
          <Text style={styles.btnWaterText}>+750ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWater} onPress={() => addWater(1000)} activeOpacity={0.7}>
          <Text style={styles.btnWaterText}>+1.0L</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  goalText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.cardBlue,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.accentBlue,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  currentVal: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  unit: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  pctText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  btnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  btnWater: {
    flex: 1,
    backgroundColor: COLORS.cardCream,
    borderRadius: RADIUS.btn - 4,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnWaterText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
});
