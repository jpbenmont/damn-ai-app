import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DailyTasks, TaskItem, HistoryLog } from '../types';

const STORAGE_KEY = '@damn_app_state_mobile_v1';

export function generateSquadCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'DAMN-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const defaultCode = generateSquadCode();

export const initialAppState: AppState = {
  activeTab: 'dashboard',
  user: {
    name: "Lock-In User",
    email: "",
    squadCode: defaultCode,
    mySquadCode: defaultCode,
    joinedSquads: [defaultCode],
    dayCurrent: 1,
    dayTotal: 60,
    currentStreak: 0,
    currentWeight: 75,
    targetWeight: 70,
    waterGoalMl: 3000,
    waterCurrentMl: 0,
    stepsGoal: 10000,
    stepsCurrent: 0,
    xp: 0,
    level: 1,
    rank: "LVL 1 • LOCK-IN NOVICE",
    fitnessGoal: "Productivity, Habits & Daily Execution",
    dietType: "Balanced",
    onboardingCompleted: false,
  },
  selectedLockInDaysTemp: 60,
  squadMembers: [],
  dailyTasks: {
    morning: [
      { id: "m1", label: "Wake Up on Time (7:00 AM)", completed: false, xp: 50 },
      { id: "m2", label: "Morning Water & Oral Care", completed: false, xp: 50 },
      { id: "m3", label: "Review Daily Tasks & Priorities", completed: false, xp: 50 },
      { id: "m4", label: "15 Min Sunlight & Fresh Air", completed: false, xp: 50 },
      { id: "m5", label: "10 Min Mindful Breathing / Meditation", completed: false, xp: 50 },
    ],
    breakfast: [
      { id: "b1", label: "Energizing Healthy Breakfast", completed: false, xp: 50 },
    ],
    lunch: [
      { id: "l1", label: "Nutrient-Dense Lunch & Hydration", completed: false, xp: 50 },
      { id: "l2", label: "Post-Lunch 15-Min Walk", completed: false, xp: 50 },
    ],
    workout: [
      { id: "w1", label: "Priority Deep Focus Session", completed: false, xp: 100 },
      { id: "w2", label: "Daily Physical Movement / Walk", completed: false, xp: 100 },
      { id: "w3", label: "Hit Daily Step Goal (8k Steps)", completed: false, xp: 100 },
    ],
    evening: [
      { id: "e1", label: "Nutritious Dinner & Wind Down", completed: false, xp: 50 },
      { id: "e2", label: "Review Daily Wins & Smart Reminders", completed: false, xp: 50 },
    ],
    discipline: [
      { id: "d1", label: "Zero Refined Sugar / Soda", completed: false, xp: 150 },
      { id: "d2", label: "Zero Junk Food / Fried Snacks", completed: false, xp: 150 },
      { id: "d3", label: "No Doomscrolling (Screen Limit)", completed: false, xp: 100 },
    ],
    night: [
      { id: "n1", label: "Night Skincare & Dental Care", completed: false, xp: 50 },
      { id: "n2", label: "Blue Light Screen Curfew (10:00 PM)", completed: false, xp: 50 },
      { id: "n3", label: "Deep Sleep Protocol (8 Hours Target)", completed: false, xp: 100 },
    ],
  },
  workoutSplit: {
    activeDay: "Monday",
    days: {
      Monday: {
        focus: "Chest, Shoulders & Triceps (Push Heavy)",
        exercises: [
          { id: "e1", name: "Incline Dumbbell Press", sets: "4 Sets", reps: "8-12 Reps", completed: false, notes: "Chest focus" },
          { id: "e2", name: "Flat Barbell Bench Press", sets: "3 Sets", reps: "6-10 Reps", completed: false, notes: "Power" },
          { id: "e3", name: "Dumbbell Lateral Raises", sets: "4 Sets", reps: "12-15 Reps", completed: false, notes: "Delts" },
          { id: "e4", name: "Overhead Triceps Rope Extension", sets: "3 Sets", reps: "12 Reps", completed: false, notes: "Triceps" },
          { id: "e5", name: "Push-ups to Failure Burnout", sets: "2 Sets", reps: "Max Reps", completed: false, notes: "Burnout" },
        ]
      },
      Tuesday: {
        focus: "Back, Rear Delts & Biceps (Pull Power)",
        exercises: [
          { id: "e6", name: "Lat Pulldown / Pull-ups", sets: "4 Sets", reps: "8-12 Reps", completed: false, notes: "Lats" },
          { id: "e7", name: "Seated Cable Row / Barbell Row", sets: "4 Sets", reps: "10-12 Reps", completed: false, notes: "Mid-back" },
          { id: "e8", name: "Face Pulls", sets: "3 Sets", reps: "15 Reps", completed: false, notes: "Rear delts" },
          { id: "e9", name: "Incline Incline Dumbbell Bicep Curls", sets: "4 Sets", reps: "10-12 Reps", completed: false, notes: "Biceps" },
          { id: "e10", name: "Hammer Curls", sets: "3 Sets", reps: "12-15 Reps", completed: false, notes: "Brachialis" },
        ]
      },
      Wednesday: {
        focus: "Quads, Hamstrings & Calves (Leg Destruction)",
        exercises: [
          { id: "e11", name: "Barbell Back Squats / Hack Squats", sets: "4 Sets", reps: "8-10 Reps", completed: false, notes: "Quads" },
          { id: "e12", name: "Romanian Deadlifts (RDL)", sets: "4 Sets", reps: "10-12 Reps", completed: false, notes: "Hamstrings" },
          { id: "e13", name: "Walking Lunges with Dumbbells", sets: "3 Sets", reps: "12 Steps/Leg", completed: false, notes: "Glutes" },
          { id: "e14", name: "Standing Calf Raises", sets: "4 Sets", reps: "15-20 Reps", completed: false, notes: "Calves" },
        ]
      },
      Thursday: {
        focus: "Chest Hypertrophy & Arms (Push Pump)",
        exercises: [
          { id: "e15", name: "Cable Chest Flyes", sets: "4 Sets", reps: "12-15 Reps", completed: false, notes: "Pectorals" },
          { id: "e16", name: "Dips (Bodyweight or Weighted)", sets: "3 Sets", reps: "10-12 Reps", completed: false, notes: "Lower chest" },
          { id: "e17", name: "Seated Dumbbell Shoulder Press", sets: "4 Sets", reps: "8-10 Reps", completed: false, notes: "Shoulders" },
          { id: "e18", name: "Skull Crushers", sets: "3 Sets", reps: "12 Reps", completed: false, notes: "Triceps" },
        ]
      },
      Friday: {
        focus: "Upper Back Density & Forearms (Pull Hypertrophy)",
        exercises: [
          { id: "e19", name: "Single Arm Dumbbell Row", sets: "4 Sets", reps: "10-12 Reps", completed: false, notes: "Lats" },
          { id: "e20", name: "T-Bar Row", sets: "3 Sets", reps: "10 Reps", completed: false, notes: "Upper back" },
          { id: "e21", name: "Preacher Curls", sets: "4 Sets", reps: "10-12 Reps", completed: false, notes: "Bicep peak" },
          { id: "e22", name: "Hanging Leg Raises (Core)", sets: "3 Sets", reps: "15 Reps", completed: false, notes: "Abs" },
        ]
      },
      Saturday: {
        focus: "Hamstrings, Glutes & Abs (Lower Focus)",
        exercises: [
          { id: "e23", name: "Leg Press (High & Wide Foot Placement)", sets: "4 Sets", reps: "12 Reps", completed: false, notes: "Glutes/Hams" },
          { id: "e24", name: "Lying Leg Curls", sets: "4 Sets", reps: "12-15 Reps", completed: false, notes: "Hamstrings" },
          { id: "e25", name: "Plank Hold", sets: "3 Sets", reps: "60 Seconds", completed: false, notes: "Core stability" },
        ]
      },
      Sunday: {
        focus: "Active Recovery & Mobility (Mind & Body)",
        exercises: [
          { id: "e26", name: "45-Minute Outdoor Nature Walk", sets: "1 Session", reps: "45 Mins", completed: false, notes: "Zone 2 Cardio" },
          { id: "e27", name: "Full Body Foam Rolling & Stretching", sets: "1 Session", reps: "20 Mins", completed: false, notes: "Mobility" },
        ]
      }
    }
  },
  supplements: [],
  historicalLogs: []
};

export async function loadSavedState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean any legacy mock bots from saved squad members
      const cleanSquadMembers = (parsed.squadMembers || []).filter((m: any) => !m.uid?.startsWith('bot-'));
      
      // Ensure user has a valid unique personal squad code
      let mySquadCode = parsed.user?.mySquadCode;
      if (!mySquadCode || typeof mySquadCode !== 'string' || !mySquadCode.startsWith('DAMN-')) {
        mySquadCode = generateSquadCode();
      }
      const squadCode = parsed.user?.squadCode || mySquadCode;
      const joinedSquads = Array.isArray(parsed.user?.joinedSquads) && parsed.user.joinedSquads.length > 0
        ? parsed.user.joinedSquads
        : [mySquadCode];

      return {
        ...initialAppState,
        ...parsed,
        user: { 
          ...initialAppState.user, 
          ...parsed.user,
          mySquadCode,
          squadCode,
          joinedSquads
        },
        dailyTasks: { ...initialAppState.dailyTasks, ...parsed.dailyTasks },
        workoutSplit: { ...initialAppState.workoutSplit, ...parsed.workoutSplit },
        supplements: parsed.supplements || [],
        historicalLogs: parsed.historicalLogs || initialAppState.historicalLogs,
        squadMembers: cleanSquadMembers
      };
    }
  } catch (error) {
    console.warn('Failed to load state from AsyncStorage:', error);
  }
  return JSON.parse(JSON.stringify(initialAppState));
}

export async function persistState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to AsyncStorage:', error);
  }
}

const CHAT_STORAGE_KEY = '@damn_chat_history_v1';

export async function loadChatHistory(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load chat history:', err);
  }
  return [];
}

export async function persistChatHistory(messages: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to save chat history:', err);
  }
}

export function getRankTitle(level: number): string {
  if (level >= 15) return `LVL ${level} • UNSTOPPABLE GOD`;
  if (level >= 10) return `LVL ${level} • DISCIPLINE WARRIOR`;
  if (level >= 5) return `LVL ${level} • DISCIPLINE MONK`;
  return `LVL ${level} • LOCK-IN NOVICE`;
}

export function calculateExecutionPct(dailyTasks: DailyTasks): number {
  let total = 0;
  let done = 0;
  Object.values(dailyTasks).forEach(section => {
    if (Array.isArray(section)) {
      section.forEach(t => {
        total++;
        if (t.completed) done++;
      });
    }
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function calculateRecoveryScore(executionPct: number, waterCurrent: number, waterGoal: number): number {
  const waterPct = waterGoal > 0 ? Math.min(100, (waterCurrent / waterGoal) * 100) : 0;
  const score = Math.round((executionPct * 0.5) + (waterPct * 0.3) + 20);
  return Math.min(100, Math.max(10, score));
}
