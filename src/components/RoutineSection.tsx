import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Edit3, Sun, Coffee, Utensils, Dumbbell, Moon, ShieldAlert, Sparkles } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { TaskItem } from '../types';
import { useApp } from '../context/AppContext';

interface RoutineSectionProps {
  sectionKey: string;
  title: string;
  tasks: TaskItem[];
  allowEdit?: boolean;
}

export const RoutineSection: React.FC<RoutineSectionProps> = ({
  sectionKey,
  title,
  tasks,
  allowEdit = true,
}) => {
  const { toggleTask, openModal } = useApp();

  const getIcon = () => {
    switch (sectionKey) {
      case 'morning':
        return <Sun size={17} color={COLORS.accentYellow} />;
      case 'breakfast':
        return <Coffee size={17} color={COLORS.accentOrange} />;
      case 'lunch':
        return <Utensils size={17} color={COLORS.accentGreen} />;
      case 'workout':
        return <Dumbbell size={17} color={COLORS.accentGreen} />;
      case 'evening':
        return <Utensils size={17} color={COLORS.accentPurple} />;
      case 'discipline':
        return <ShieldAlert size={17} color={COLORS.accentPink} />;
      case 'night':
        return <Moon size={17} color={COLORS.accentPurple} />;
      default:
        return <Sparkles size={17} color={COLORS.accentBlue} />;
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <View style={styles.iconCircle}>{getIcon()}</View>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.badge, isAllDone && styles.badgeComplete]}>
            <Text style={[styles.badgeText, isAllDone && styles.badgeTextComplete]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {allowEdit && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openModal('routine_editor', { sectionKey, title, tasks })}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={COLORS.textSub} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Task List */}
      <View style={styles.taskList}>
        {tasks.map(task => {
          return (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskRow,
                task.completed && styles.taskRowCompleted,
              ]}
              onPress={() => toggleTask(sectionKey, task.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkbox,
                  task.completed && styles.checkboxChecked,
                ]}
              >
                {task.completed && <Check size={13} color={COLORS.textInverse} strokeWidth={3.5} />}
              </View>

              <Text
                style={[
                  styles.taskLabel,
                  task.completed && styles.taskLabelCompleted,
                ]}
              >
                {task.label}
              </Text>

              <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>+{task.xp || 50} XP</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.cardCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  badge: {
    backgroundColor: COLORS.cardCream,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeComplete: {
    backgroundColor: COLORS.cardMint,
  },
  badgeText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSub,
  },
  badgeTextComplete: {
    color: COLORS.accentGreen,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardCream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.btn - 8,
    gap: 4,
  },
  editBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgMain,
    borderRadius: RADIUS.btn - 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  taskRowCompleted: {
    backgroundColor: COLORS.cardMint,
    borderColor: COLORS.cardBorder,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accentBlack,
    borderColor: COLORS.accentBlack,
  },
  taskLabel: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  taskLabelCompleted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  xpPill: {
    backgroundColor: COLORS.cardLavender,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  xpPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentPurple,
  },
});
