export type TabType = 'dashboard' | 'checklist' | 'reminders' | 'squad' | 'family' | 'analytics' | 'workout' | 'supplements';

export type ScreenType = 'splash' | 'auth' | 'onboarding' | 'app';

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
  xp: number;
  time?: string;
}

export interface DailyTasks {
  morning: TaskItem[];
  breakfast: TaskItem[];
  lunch: TaskItem[];
  workout: TaskItem[];
  evening: TaskItem[];
  discipline: TaskItem[];
  night: TaskItem[];
  [key: string]: TaskItem[];
}

export interface ExerciseItem {
  id?: string;
  name: string;
  sets: string;
  reps: string;
  completed?: boolean;
  notes?: string;
}

export interface DayWorkout {
  focus: string;
  exercises: ExerciseItem[];
}

export interface WorkoutSplit {
  activeDay: string;
  days: {
    Monday: DayWorkout;
    Tuesday: DayWorkout;
    Wednesday: DayWorkout;
    Thursday: DayWorkout;
    Friday: DayWorkout;
    Saturday: DayWorkout;
    Sunday: DayWorkout;
    [key: string]: DayWorkout;
  };
}

export interface SupplementItem {
  id: string;
  name: string;
  dose: string;
  timing: string;
  stock: number;
  targetStock?: number;
  purpose?: string;
  takenToday?: boolean;
}

export interface HistoryLog {
  day: number;
  date: string;
  executionPct: number;
  recoveryScore: number;
  weight?: number;
  completedCount?: number;
  totalCount?: number;
}

export interface SquadMember {
  uid: string;
  name: string;
  rank: string;
  streak: number;
  executionPct: number;
  lockInDays: number;
  xp: number;
  fitnessGoal?: string;
  workoutRoutine?: string;
  isOnline?: boolean;
  avatarText?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  squadCode: string;
  mySquadCode?: string;
  joinedSquads?: string[];
  dayCurrent: number;
  dayTotal: number;
  currentStreak: number;
  currentWeight: number;
  targetWeight: number;
  waterGoalMl: number;
  waterCurrentMl: number;
  stepsGoal: number;
  stepsCurrent: number;
  xp: number;
  level: number;
  rank: string;
  fitnessGoal?: string;
  dietType?: string;
  supplementsPreference?: string;
  onboardingCompleted?: boolean;
  lastRolloverDate?: string;
  lastRolloverTimestamp?: number;
}

export interface AppState {
  activeTab: TabType;
  user: UserProfile;
  selectedLockInDaysTemp: number;
  squadMembers: SquadMember[];
  dailyTasks: DailyTasks;
  workoutSplit: WorkoutSplit;
  supplements: SupplementItem[];
  historicalLogs: HistoryLog[];
}
