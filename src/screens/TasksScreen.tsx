import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';
import { RoutineSection } from '../components/RoutineSection';
import { calculateExecutionPct } from '../services/storage';

export const TasksScreen: React.FC = () => {
  const { state, openModal } = useApp();
  const { dailyTasks, user } = state;

  const todayPct = calculateExecutionPct(dailyTasks);

  let completedTasks = 0;
  let totalTasks = 0;
  Object.values(dailyTasks).forEach(sec => {
    if (Array.isArray(sec)) {
      sec.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    }
  });

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Daily Execution Tasks</Text>
          <Text style={styles.pageSub}>100% completion target for today</Text>
        </View>

        {/* Progress Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>TODAY'S EXECUTION</Text>
              <Text style={styles.summaryVal}>{completedTasks} of {totalTasks} Tasks Done</Text>
            </View>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>{todayPct}%</Text>
            </View>
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${todayPct}%` }]} />
          </View>
        </View>

        {/* Routine Sections */}
        <RoutineSection
          sectionKey="morning"
          title="Morning Protocol"
          tasks={dailyTasks.morning || []}
        />
        <RoutineSection
          sectionKey="breakfast"
          title="Breakfast Nutrition"
          tasks={dailyTasks.breakfast || []}
        />
        <RoutineSection
          sectionKey="lunch"
          title="Lunch Protocol"
          tasks={dailyTasks.lunch || []}
        />
        <RoutineSection
          sectionKey="workout"
          title="Daily Workout & Steps"
          tasks={dailyTasks.workout || []}
        />
        <RoutineSection
          sectionKey="evening"
          title="Evening Protocol"
          tasks={dailyTasks.evening || []}
        />
        <RoutineSection
          sectionKey="discipline"
          title="Stoic Discipline Rules"
          tasks={dailyTasks.discipline || []}
        />
        <RoutineSection
          sectionKey="night"
          title="Night Sleep Protocol"
          tasks={dailyTasks.night || []}
        />

        {/* Advance Day CTA */}
        <TouchableOpacity
          style={styles.finishDayBtn}
          onPress={() => openModal('finish')}
          activeOpacity={0.85}
        >
          <Lock size={15} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.finishDayText}>Finish Today & Advance to Day {user.dayCurrent + 1}</Text>
        </TouchableOpacity>

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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECE8',
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#787A82',
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
    marginTop: 2,
  },
  pctBadge: {
    backgroundColor: '#E8F7EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pctText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  track: {
    height: 7,
    backgroundColor: '#E8F7EE',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  finishDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  finishDayText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
