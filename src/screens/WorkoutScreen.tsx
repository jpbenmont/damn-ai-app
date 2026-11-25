import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dumbbell, Check } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';

export const WorkoutScreen: React.FC = () => {
  const { state, toggleExercise } = useApp();
  const { workoutSplit } = state;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedDay, setSelectedDay] = useState(workoutSplit.activeDay || 'Monday');

  const currentDayData = workoutSplit.days[selectedDay] || {
    focus: 'Rest & Recovery',
    exercises: [],
  };

  const exercises = currentDayData.exercises || [];
  const completedCount = exercises.filter(e => e.completed).length;

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Workout Protocol</Text>
          <Text style={styles.pageSub}>Personalized 7-day hypertrophy & strength split</Text>
        </View>

        {/* 7-Day Split Nav Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPillsRow}
        >
          {daysOfWeek.map(day => {
            const isSelected = selectedDay === day;
            const shortName = day.substring(0, 3).toUpperCase();
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillActive,
                ]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Focus Header Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View style={styles.focusTitleRow}>
              <View style={styles.iconCircle}>
                <Dumbbell size={16} color="#059669" />
              </View>
              <Text style={styles.focusDay}>{selectedDay}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{completedCount}/{exercises.length} Done</Text>
            </View>
          </View>
          <Text style={styles.focusDescription}>{currentDayData.focus}</Text>
        </View>

        {/* Exercise Cards */}
        <View style={styles.exercisesList}>
          {exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Rest & Active Recovery Day. Light walking, stretching and hydration only.</Text>
            </View>
          ) : (
            exercises.map((ex, idx) => {
              const isDone = !!ex.completed;
              return (
                <TouchableOpacity
                  key={ex.id || idx}
                  style={[
                    styles.exerciseCard,
                    isDone && styles.exerciseCardDone,
                  ]}
                  onPress={() => toggleExercise(selectedDay, idx)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                    {isDone && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                  </View>

                  <View style={styles.exInfo}>
                    <Text style={[styles.exName, isDone && styles.exNameDone]}>
                      {ex.name}
                    </Text>
                    <View style={styles.exMetaRow}>
                      <Text style={styles.exSetsReps}>{ex.sets} • {ex.reps}</Text>
                      {ex.notes && <Text style={styles.exNotes}>({ex.notes})</Text>}
                    </View>
                  </View>

                  <View style={styles.xpPill}>
                    <Text style={styles.xpText}>+50 XP</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Extra spacing for dock */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F5',
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 22,
    fontWeight: '900',
    color: '#141416',
  },
  pageSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  dayPillsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  dayPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5DF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  dayPillActive: {
    backgroundColor: '#141416',
    borderColor: '#141416',
  },
  dayPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#787A82',
    letterSpacing: 0.5,
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECE8',
    marginBottom: 14,
  },
  focusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  focusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#E8F7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusDay: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  badge: {
    backgroundColor: '#F0F0EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 11,
    fontWeight: '800',
    color: '#787A82',
  },
  focusDescription: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  exercisesList: {
    gap: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  emptyText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#ECECE8',
    gap: 12,
  },
  exerciseCardDone: {
    backgroundColor: '#F4FBF6',
    borderColor: '#D4EFE0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#C8C8C0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#141416',
    borderColor: '#141416',
  },
  exInfo: {
    flex: 1,
  },
  exName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#141416',
  },
  exNameDone: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  exMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  exSetsReps: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#4B4D54',
  },
  exNotes: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#787A82',
  },
  xpPill: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
});
