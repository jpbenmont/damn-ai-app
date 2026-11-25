import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Footprints } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const StepsCard: React.FC = () => {
  const { state, addSteps } = useApp();
  const current = state.user.stepsCurrent || 0;
  const goal = state.user.stepsGoal || 10000;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Footprints size={19} color={COLORS.accentGreen} strokeWidth={2.5} />
          <Text style={styles.title}>Daily Steps Tracker</Text>
        </View>
        <Text style={styles.goalText}>{goal.toLocaleString()} steps</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.infoRow}>
        <View style={styles.valRow}>
          <Text style={styles.currentVal}>{current.toLocaleString()}</Text>
          <Text style={styles.unit}>steps</Text>
        </View>
        <Text style={styles.pctText}>{pct}% of 10k goal</Text>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.btnGrid}>
        <TouchableOpacity style={styles.btnStep} onPress={() => addSteps(1000)} activeOpacity={0.7}>
          <Text style={styles.btnStepText}>+1,000</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnStep} onPress={() => addSteps(2500)} activeOpacity={0.7}>
          <Text style={styles.btnStepText}>+2,500</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnStep} onPress={() => addSteps(5000)} activeOpacity={0.7}>
          <Text style={styles.btnStepText}>+5,000</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnStep} onPress={() => addSteps(10000)} activeOpacity={0.7}>
          <Text style={styles.btnStepText}>10k Goal</Text>
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
    backgroundColor: COLORS.cardMint,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.accentGreen,
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
  btnStep: {
    flex: 1,
    backgroundColor: COLORS.cardCream,
    borderRadius: RADIUS.btn - 4,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnStepText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
});
