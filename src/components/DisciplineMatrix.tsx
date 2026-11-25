import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Grid } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { HistoryLog } from '../types';

interface DisciplineMatrixProps {
  dayTotal: number;
  dayCurrent: number;
  historicalLogs: HistoryLog[];
  todayPct: number;
}

export const DisciplineMatrix: React.FC<DisciplineMatrixProps> = ({
  dayTotal,
  dayCurrent,
  historicalLogs,
  todayPct,
}) => {
  const days = Array.from({ length: dayTotal }, (_, i) => i + 1);

  // Map day to execution pct
  const logMap: Record<number, number> = {};
  historicalLogs.forEach(log => {
    logMap[log.day] = log.executionPct;
  });

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Grid size={20} color={COLORS.accentGreen} strokeWidth={2.4} />
          <Text style={styles.title}>Discipline Matrix</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{dayTotal}  Days</Text>
        </View>
      </View>

      {/* Grid: Exactly 10 columns per row matching design tokens */}
      <View style={styles.matrix}>
        {days.map(dayNum => {
          const isPast = dayNum < dayCurrent;
          const isToday = dayNum === dayCurrent;

          let cellBg = COLORS.cardCream;
          let textColor = COLORS.textSub;
          let isBlack = false;

          if (isToday) {
            cellBg = COLORS.accentBlack;
            textColor = COLORS.textInverse;
            isBlack = true;
          } else if (isPast) {
            const exec = logMap[dayNum] || 0;
            if (exec >= 70) {
              cellBg = COLORS.cardMint;
              textColor = COLORS.accentGreen;
            } else if (exec > 0) {
              cellBg = COLORS.cardYellowLight;
              textColor = COLORS.accentOrange;
            } else {
              cellBg = COLORS.cardPinkLight;
              textColor = COLORS.accentPink;
            }
          }

          const dayFormatted = String(dayNum).padStart(2, '0');

          return (
            <View
              key={dayNum}
              style={[
                styles.cell,
                { backgroundColor: cellBg },
                isBlack && styles.activeCellShadow,
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  { color: textColor },
                  isBlack && styles.activeCellText,
                ]}
              >
                {dayFormatted}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  pill: {
    backgroundColor: COLORS.cardCream,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  pillText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  matrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    columnGap: 4,
  },
  cell: {
    width: '8.8%',
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  activeCellShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  cellText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 11,
    fontWeight: '700',
  },
  activeCellText: {
    fontFamily: FONTS.headingBlack,
    fontSize: 11.5,
    fontWeight: '900',
  },
});
