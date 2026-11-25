import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  AppState, 
  TabType, 
  ScreenType, 
  DailyTasks, 
  TaskItem, 
  UserProfile, 
  HistoryLog,
  SupplementItem 
} from '../types';
import { 
  initialAppState, 
  loadSavedState, 
  persistState, 
  calculateExecutionPct, 
  calculateRecoveryScore, 
  getRankTitle,
  generateSquadCode
} from '../services/storage';
import { 
  loginUser, 
  registerUser, 
  signInWithGoogle,
  logoutUser, 
  syncUserDataToCloud, 
  fetchUserDataFromCloud,
  fetchSquadLeaderboard,
  joinSquadInCloud,
  leaveSquadInCloud,
  getRedirectResult,
  auth
} from '../services/firebase';
import {
  initNotifications,
  sendPushNotification,
  scheduleDailyReminders
} from '../services/notifications';
import { reminderService } from '../services/reminderService';

export interface ActiveNotification {
  id: string;
  type: 'assistant' | 'family' | 'reminder' | 'streak' | 'morning' | 'night' | 'coach';
  title?: string;
  tag: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AppContextType {
  state: AppState;
  screen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  setActiveTab: (tab: TabType) => void;
  toggleTask: (section: string, taskId: string) => void;
  addWater: (amountMl: number) => void;
  addSteps: (amountSteps: number) => void;
  toggleExercise: (day: string, exerciseIndex: number) => void;
  takeSupplement: (supplementId: string) => void;
  addSupplement: (sup: Omit<SupplementItem, 'id'>) => void;
  deleteSupplement: (id: string) => void;
  updateLockInDays: (days: number, name?: string, targetWeight?: number) => void;
  advanceDay: () => void;
  addCustomTask: (section: string, label: string, xp?: number) => void;
  deleteTask: (section: string, taskId: string) => void;
  joinSquad: (code: string) => Promise<{ success: boolean; message: string }>;
  leaveSquad: (code: string) => Promise<{ success: boolean; message: string }>;
  setActiveSquad: (code: string) => void;
  saveOnboardingProfile: (data: any) => void;
  handleLogin: (email: string, pass: string) => Promise<void>;
  handleSignup: (name: string, email: string, pass: string) => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  handleLogout: () => Promise<void>;
  continueAsGuest: () => void;
  activeModal: string | null;
  openModal: (modalName: string, payload?: any) => void;
  closeModal: () => void;
  modalPayload: any;
  isLoading: boolean;
  currentNotification: ActiveNotification | null;
  triggerNotification: (notif: Omit<ActiveNotification, 'id'>) => void;
  dismissNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialAppState);
  const [screen, setScreen] = useState<ScreenType>('splash');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentNotification, setCurrentNotification] = useState<ActiveNotification | null>(null);

  // Initialize state on app startup
  useEffect(() => {
    async function init() {
      const saved = await loadSavedState();
      setState(saved);
      setIsLoading(false);

      // Initialize native Android Push Notifications & Daily Reminders
      initNotifications();
      if (saved.user.onboardingCompleted) {
        scheduleDailyReminders(saved.user.name || 'Warrior');
      }

      // Check for Google Auth redirect result on web
      if (Platform.OS === 'web' && auth) {
        try {
          const redirectRes = await getRedirectResult(auth);
          if (redirectRes && redirectRes.user) {
            const user = redirectRes.user;
            const cloudData = await fetchUserDataFromCloud(user.uid);
            if (cloudData) {
              updateState(prev => ({
                ...prev,
                ...cloudData,
                user: { 
                  ...prev.user, 
                  ...(cloudData.user || {}), 
                  name: user.displayName || prev.user.name,
                  email: user.email || prev.user.email, 
                  onboardingCompleted: true 
                }
              }));
            } else {
              const myCode = generateSquadCode();
              updateState(prev => ({
                ...prev,
                user: { 
                  ...prev.user, 
                  name: user.displayName || 'Lock-In Warrior',
                  email: user.email || '',
                  mySquadCode: myCode,
                  squadCode: myCode,
                  joinedSquads: [myCode],
                  onboardingCompleted: true 
                }
              }));
            }
            setScreen('app');
            return;
          }
        } catch (e) {
          console.warn('Google redirect result check notice:', e);
        }
      }

      // Splash delay transition
      setTimeout(() => {
        if (!saved.user.onboardingCompleted && !saved.user.email) {
          setScreen('auth');
        } else if (!saved.user.onboardingCompleted) {
          setScreen('onboarding');
        } else {
          setScreen('app');
        }
      }, 1800);
    }
    init();
  }, []);

  // Automated 11:59 PM (23:59) / Midnight Day Auto-Finish Checker
  useEffect(() => {
    const checkMidnightRollover = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayDateStr = now.toISOString().split('T')[0];

      setState(prev => {
        // Only run for active users who finished onboarding
        if (!prev.user.onboardingCompleted) return prev;

        const lastRollover = prev.user.lastRolloverDate;

        // Trigger if:
        // 1) Time is 23:59 (11:59 PM) and hasn't rolled over today
        // 2) Or date has progressed to a new calendar day past midnight
        const is1159PM = hours === 23 && minutes >= 59;
        const isNewCalendarDay = lastRollover && lastRollover !== todayDateStr;

        if ((is1159PM && lastRollover !== todayDateStr) || isNewCalendarDay) {
          console.log('⏰ Auto-finishing day at 11:59 PM / midnight rollover...');
          
          const execPct = calculateExecutionPct(prev.dailyTasks);
          const recScore = calculateRecoveryScore(execPct, prev.user.waterCurrentMl, prev.user.waterGoalMl);

          const logEntry: HistoryLog = {
            day: prev.user.dayCurrent,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            executionPct: execPct,
            recoveryScore: recScore,
            weight: prev.user.currentWeight,
          };

          const newStreak = execPct >= 70 ? (prev.user.currentStreak || 0) + 1 : 0;
          const nextDay = prev.user.dayCurrent + 1;

          // Reset tasks for the fresh day
          const resetTasks: DailyTasks = { ...prev.dailyTasks };
          Object.keys(resetTasks).forEach(k => {
            if (Array.isArray(resetTasks[k])) {
              resetTasks[k] = resetTasks[k].map(t => ({ ...t, completed: false }));
            }
          });

          // Reset supplements for the fresh day
          const resetSups = prev.supplements.map(s => ({ ...s, takenToday: false }));

          const updatedState: AppState = {
            ...prev,
            dailyTasks: resetTasks,
            supplements: resetSups,
            historicalLogs: [logEntry, ...(prev.historicalLogs || [])],
            user: {
              ...prev.user,
              dayCurrent: nextDay,
              currentStreak: newStreak,
              waterCurrentMl: 0,
              stepsCurrent: 0,
              lastRolloverDate: todayDateStr,
              lastRolloverTimestamp: Date.now(),
            }
          };

          persistState(updatedState);
          if (auth?.currentUser?.uid) {
            syncUserDataToCloud(auth.currentUser.uid, updatedState);
          }

          return updatedState;
        }

        return prev;
      });
    };

    // Run check immediately on mount
    checkMidnightRollover();

    // Check every 15 seconds so at exactly 11:59:00 PM it jumps to the next day
    const interval = setInterval(checkMidnightRollover, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerNotification = (notif: Omit<ActiveNotification, 'id'>) => {
    triggerHaptic();
    // Fire real native Android Push Notification
    sendPushNotification(
      notif.tag || notif.title || 'DAMN',
      notif.message,
      { type: notif.type }
    );
  };

  const dismissNotification = () => {
    setCurrentNotification(null);
  };

  // Smart Context-Aware Periodic Notification Engine (Everyday Assistant & Family)
  useEffect(() => {
    if (!state.user.onboardingCompleted) return;

    // Friendly reminder after 30 seconds of app activity
    const timer = setTimeout(() => {
      const name = state.user.name || 'Friend';
      const activeReminders = reminderService.getReminders().filter(r => !r.completed).length;

      if (activeReminders === 0) {
        triggerNotification({
          type: 'assistant',
          tag: 'DAMN',
          message: `Hey ${name}! Tap the mic or say "Remind me in 2 hours to..." to test your smart escalating alerts.`,
          actionLabel: 'ADD REMINDER',
          onAction: () => setActiveTab('reminders')
        });
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [state.user.onboardingCompleted]);

  // Save to AsyncStorage & Cloud whenever state changes
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      persistState(next);
      if (auth?.currentUser?.uid) {
        syncUserDataToCloud(auth.currentUser.uid, next);
      }
      return next;
    });
  };

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web' && Haptics && typeof Haptics.impactAsync === 'function') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light);
      }
    } catch (e) {}
  };

  const setActiveTab = (tab: TabType) => {
    triggerHaptic();
    updateState(prev => ({ ...prev, activeTab: tab }));
  };

  const openModal = (modalName: string, payload: any = null) => {
    triggerHaptic();
    setModalPayload(payload);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  const toggleTask = (section: string, taskId: string) => {
    triggerHaptic();
    updateState(prev => {
      const tasks = { ...prev.dailyTasks };
      const secList = tasks[section] ? [...tasks[section]] : [];
      let gainedXp = 0;

      const updatedList = secList.map(task => {
        if (task.id === taskId) {
          const willComplete = !task.completed;
          gainedXp = willComplete ? (task.xp || 50) : -(task.xp || 50);
          return { ...task, completed: willComplete };
        }
        return task;
      });

      tasks[section] = updatedList;
      const newXp = Math.max(0, (prev.user.xp || 0) + gainedXp);
      const newLevel = Math.floor(newXp / 250) + 1;
      const newRank = getRankTitle(newLevel);

      return {
        ...prev,
        dailyTasks: tasks,
        user: {
          ...prev.user,
          xp: newXp,
          level: newLevel,
          rank: newRank,
        }
      };
    });
  };

  const addWater = (amountMl: number) => {
    triggerHaptic();
    updateState(prev => {
      const newWater = (prev.user.waterCurrentMl || 0) + amountMl;
      return {
        ...prev,
        user: {
          ...prev.user,
          waterCurrentMl: newWater
        }
      };
    });
  };

  const addSteps = (amountSteps: number) => {
    triggerHaptic();
    updateState(prev => {
      const newSteps = (prev.user.stepsCurrent || 0) + amountSteps;
      return {
        ...prev,
        user: {
          ...prev.user,
          stepsCurrent: newSteps
        }
      };
    });
  };

  const toggleExercise = (day: string, exerciseIndex: number) => {
    triggerHaptic();
    updateState(prev => {
      const split = { ...prev.workoutSplit };
      const currentDayWorkout = split.days[day];
      if (currentDayWorkout && currentDayWorkout.exercises[exerciseIndex]) {
        const exs = [...currentDayWorkout.exercises];
        const isDone = !exs[exerciseIndex].completed;
        exs[exerciseIndex] = { ...exs[exerciseIndex], completed: isDone };
        split.days[day] = { ...currentDayWorkout, exercises: exs };

        const gainedXp = isDone ? 50 : -50;
        const newXp = Math.max(0, (prev.user.xp || 0) + gainedXp);
        const newLevel = Math.floor(newXp / 250) + 1;

        return {
          ...prev,
          workoutSplit: split,
          user: {
            ...prev.user,
            xp: newXp,
            level: newLevel,
            rank: getRankTitle(newLevel)
          }
        };
      }
      return prev;
    });
  };

  const takeSupplement = (supplementId: string) => {
    triggerHaptic();
    updateState(prev => {
      const sups = prev.supplements.map(sup => {
        if (sup.id === supplementId) {
          const taken = !sup.takenToday;
          const newStock = taken ? Math.max(0, sup.stock - 1) : sup.stock + 1;
          return { ...sup, stock: newStock, takenToday: taken };
        }
        return sup;
      });

      return { ...prev, supplements: sups };
    });
  };

  const addSupplement = (sup: Omit<SupplementItem, 'id'>) => {
    triggerHaptic();
    const newSup: SupplementItem = {
      ...sup,
      id: `sup_${Date.now()}`,
      takenToday: false,
    };
    updateState(prev => ({
      ...prev,
      supplements: [...prev.supplements, newSup]
    }));
  };

  const deleteSupplement = (id: string) => {
    triggerHaptic();
    updateState(prev => ({
      ...prev,
      supplements: prev.supplements.filter(s => s.id !== id)
    }));
  };

  const updateLockInDays = (days: number, name?: string, targetWeight?: number) => {
    triggerHaptic();
    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        dayTotal: days,
        name: name || prev.user.name,
        targetWeight: targetWeight !== undefined ? targetWeight : prev.user.targetWeight
      }
    }));
  };

  const advanceDay = () => {
    triggerHaptic();
    updateState(prev => {
      const execPct = calculateExecutionPct(prev.dailyTasks);
      const recScore = calculateRecoveryScore(execPct, prev.user.waterCurrentMl, prev.user.waterGoalMl);

      // Create history log entry
      const logEntry: HistoryLog = {
        day: prev.user.dayCurrent,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        executionPct: execPct,
        recoveryScore: recScore,
        weight: prev.user.currentWeight,
      };

      const newStreak = execPct >= 70 ? (prev.user.currentStreak || 0) + 1 : 0;
      const nextDay = prev.user.dayCurrent + 1;

      // Reset daily tasks for new day
      const resetTasks: DailyTasks = { ...prev.dailyTasks };
      Object.keys(resetTasks).forEach(k => {
        if (Array.isArray(resetTasks[k])) {
          resetTasks[k] = resetTasks[k].map(t => ({ ...t, completed: false }));
        }
      });

      // Reset supplements daily taken
      const resetSups = prev.supplements.map(s => ({ ...s, takenToday: false }));

      return {
        ...prev,
        dailyTasks: resetTasks,
        supplements: resetSups,
        historicalLogs: [logEntry, ...(prev.historicalLogs || [])],
        user: {
          ...prev.user,
          dayCurrent: nextDay,
          currentStreak: newStreak,
          waterCurrentMl: 0,
          stepsCurrent: 0,
          lastRolloverDate: new Date().toISOString().split('T')[0],
          lastRolloverTimestamp: Date.now(),
        }
      };
    });
  };

  const addCustomTask = (section: string, label: string, xp: number = 50) => {
    triggerHaptic();
    updateState(prev => {
      const tasks = { ...prev.dailyTasks };
      const secList = tasks[section] ? [...tasks[section]] : [];
      const newTask: TaskItem = {
        id: `custom_${Date.now()}`,
        label: label.trim(),
        completed: false,
        xp: xp
      };
      tasks[section] = [...secList, newTask];
      return { ...prev, dailyTasks: tasks };
    });
  };

  const deleteTask = (section: string, taskId: string) => {
    triggerHaptic();
    updateState(prev => {
      const tasks = { ...prev.dailyTasks };
      if (tasks[section]) {
        tasks[section] = tasks[section].filter(t => t.id !== taskId);
      }
      return { ...prev, dailyTasks: tasks };
    });
  };

  const setActiveSquad = (code: string) => {
    triggerHaptic();
    const formatted = code.trim().toUpperCase();
    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        squadCode: formatted
      }
    }));
    fetchSquadLeaderboard(formatted).then(members => {
      if (members && members.length > 0) {
        updateState(prev => ({ ...prev, squadMembers: members }));
      }
    }).catch(() => {});
  };

  const joinSquad = async (code: string): Promise<{ success: boolean; message: string }> => {
    triggerHaptic();
    const formatted = code.trim().toUpperCase();
    if (!formatted.startsWith('DAMN-')) {
      return { success: false, message: 'Invalid squad code format. Must start with DAMN- (e.g. DAMN-8K2P91).' };
    }

    const currentJoined = state.user.joinedSquads || [state.user.mySquadCode || state.user.squadCode];
    if (currentJoined.includes(formatted)) {
      setActiveSquad(formatted);
      return { success: true, message: `Switched to squad: ${formatted}` };
    }

    // 1 user can join at most 5 squads
    if (currentJoined.length >= 5) {
      return { 
        success: false, 
        message: 'Squad Limit Reached (Max 5 Squads)! You have already joined 5 squads. Leave an existing squad to join a new one.' 
      };
    }

    // Cloud join with max 20 member validation
    const cloudRes = await joinSquadInCloud(formatted, state.user, state.dailyTasks);
    if (!cloudRes.success) {
      return { success: false, message: cloudRes.error || 'Squad is full (Max 20 members).' };
    }

    const nextJoined = [...currentJoined, formatted];
    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        squadCode: formatted,
        joinedSquads: nextJoined
      }
    }));

    fetchSquadLeaderboard(formatted).then(members => {
      if (members && members.length > 0) {
        updateState(prev => ({ ...prev, squadMembers: members }));
      }
    }).catch(() => {});

    return { success: true, message: `Successfully joined ${formatted}!` };
  };

  const leaveSquad = async (code: string): Promise<{ success: boolean; message: string }> => {
    triggerHaptic();
    const formatted = code.trim().toUpperCase();
    const primaryCode = state.user.mySquadCode || 'DAMN-8K2P91';

    if (formatted === primaryCode) {
      return { success: false, message: 'You cannot leave your own primary squad.' };
    }

    const currentJoined = state.user.joinedSquads || [primaryCode];
    const filtered = currentJoined.filter(s => s !== formatted);
    const fallbackSquad = primaryCode;

    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        squadCode: fallbackSquad,
        joinedSquads: filtered
      }
    }));

    const uid = auth?.currentUser?.uid || `user_${state.user.name.toLowerCase().replace(/\s+/g, '_')}`;
    leaveSquadInCloud(formatted, uid).catch(() => {});
    fetchSquadLeaderboard(fallbackSquad).then(members => {
      updateState(prev => ({ ...prev, squadMembers: members }));
    }).catch(() => {});

    return { success: true, message: `Left squad ${formatted}. Switched back to your personal squad.` };
  };

  const saveOnboardingProfile = (data: any) => {
    triggerHaptic();

    const supplementsAns = (data.supplements || '').trim();
    const isNoSupplements = !supplementsAns || 
      supplementsAns.toLowerCase().includes('none') || 
      supplementsAns.toLowerCase().includes('no') || 
      supplementsAns.toLowerCase().includes('natural') || 
      supplementsAns.toLowerCase().includes('whole food') || 
      supplementsAns.toLowerCase().includes('nothing');

    // Build custom supplements array if user wants them
    const customSupplements: SupplementItem[] = [];
    if (!isNoSupplements) {
      const lowerSup = supplementsAns.toLowerCase();
      if (lowerSup.includes('whey') || lowerSup.includes('protein') || lowerSup.includes('full stack')) {
        customSupplements.push({
          id: 'sup_whey',
          name: 'Whey Protein Isolate',
          dose: '30g Scoop',
          timing: 'Post-Workout / Breakfast',
          stock: 30,
          targetStock: 30,
          purpose: 'Muscle Recovery & Daily Protein Goal',
          takenToday: false,
        });
      }
      if (lowerSup.includes('creatine') || lowerSup.includes('full stack')) {
        customSupplements.push({
          id: 'sup_creatine',
          name: 'Creatine Monohydrate',
          dose: '5g (1 Scoop)',
          timing: 'Post-Workout with Water',
          stock: 60,
          targetStock: 60,
          purpose: 'ATP Energy, Power Output & Muscle Fullness',
          takenToday: false,
        });
      }
      if (lowerSup.includes('vitamin') || lowerSup.includes('omega') || lowerSup.includes('full stack')) {
        customSupplements.push({
          id: 'sup_vitamins',
          name: 'Daily Multivitamin & Omega-3',
          dose: '1 Tablet + 1 Softgel',
          timing: 'With Morning Breakfast',
          stock: 60,
          targetStock: 60,
          purpose: 'Micronutrients, Joint Health & Immunity',
          takenToday: false,
        });
      }
      if (lowerSup.includes('pre-workout') || lowerSup.includes('pre workout') || lowerSup.includes('full stack')) {
        customSupplements.push({
          id: 'sup_pre',
          name: 'Pre-Workout Energy',
          dose: '1 Scoop in 250ml Water',
          timing: '20 Mins Pre-Workout',
          stock: 30,
          targetStock: 30,
          purpose: 'Focus, Blood Flow & Workout Intensity',
          takenToday: false,
        });
      }

      if (customSupplements.length === 0 && supplementsAns.length > 2) {
        customSupplements.push({
          id: `sup_custom_${Date.now()}`,
          name: supplementsAns,
          dose: 'Daily Dose',
          timing: 'With Meal / Workout',
          stock: 30,
          targetStock: 30,
          purpose: 'Custom Fitness Supplementation',
          takenToday: false,
        });
      }
    }

    // Build universal daily tasks for everyone
    const breakfastTasks: TaskItem[] = [
      { id: "b1", label: "Energizing Healthy Breakfast & Water", completed: false, xp: 50 },
    ];

    const workoutTasks: TaskItem[] = [
      { id: "w1", label: "Priority Deep Focus Session", completed: false, xp: 100 },
      { id: "w2", label: "Daily Movement & Walk", completed: false, xp: 100 },
      { id: "w3", label: `Hit ${((data.stepsGoal || 8000) / 1000).toFixed(0)}k Daily Step Goal`, completed: false, xp: 100 },
    ];

    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name: data.name || prev.user.name,
        dayTotal: data.dayTotal || 60,
        currentWeight: data.currentWeight || 75,
        targetWeight: data.targetWeight || 70,
        waterGoalMl: data.waterGoal || 3500,
        stepsGoal: data.stepsGoal || 10000,
        fitnessGoal: data.fitnessGoal || prev.user.fitnessGoal,
        dietType: data.dietType || prev.user.dietType,
        supplementsPreference: isNoSupplements ? "None" : supplementsAns,
        onboardingCompleted: true
      },
      supplements: customSupplements,
      dailyTasks: {
        ...prev.dailyTasks,
        breakfast: breakfastTasks,
        workout: workoutTasks,
      }
    }));
    scheduleDailyReminders(data.name || 'Warrior');
    setScreen('app');
  };

  const handleLogin = async (email: string, pass: string) => {
    const user = await loginUser(email, pass);
    const cloudData = await fetchUserDataFromCloud(user.uid);
    if (cloudData) {
      updateState(prev => ({
        ...prev,
        ...cloudData,
        user: { ...prev.user, ...(cloudData.user || {}), email: user.email || email, onboardingCompleted: true }
      }));
    } else {
      updateState(prev => ({
        ...prev,
        user: { ...prev.user, email: user.email || email, onboardingCompleted: true }
      }));
    }
    setScreen('app');
  };

  const handleSignup = async (name: string, email: string, pass: string) => {
    const user = await registerUser(name, email, pass);
    const myCode = generateSquadCode();
    updateState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name: name,
        email: email,
        mySquadCode: myCode,
        squadCode: myCode,
        joinedSquads: [myCode],
        onboardingCompleted: false
      }
    }));
    setScreen('onboarding');
  };

  const handleGoogleAuth = async () => {
    try {
      triggerHaptic();
    } catch (e) {}

    let user: any = null;
    try {
      user = await signInWithGoogle();
    } catch (authErr: any) {
      console.warn('Native Google Auth error:', authErr);
      throw authErr;
    }

    if (!user) return;

    const myCode = generateSquadCode();
    updateState(prev => ({
      ...prev,
      user: { 
        ...prev.user, 
        name: user.displayName || 'Warrior',
        email: user.email || 'warrior@gmail.com',
        mySquadCode: myCode,
        squadCode: myCode,
        joinedSquads: [myCode],
        onboardingCompleted: false 
      }
    }));
    setScreen('onboarding');

    // Asynchronously check cloud profile
    fetchUserDataFromCloud(user.uid).then(cloudData => {
      if (cloudData && cloudData.user && cloudData.user.onboardingCompleted) {
        updateState(prev => ({
          ...prev,
          ...cloudData,
          user: { 
            ...prev.user, 
            ...(cloudData.user || {}), 
            name: user.displayName || prev.user.name,
            email: user.email || prev.user.email, 
            onboardingCompleted: true 
          }
        }));
        setScreen('app');
      }
    }).catch(() => {});
  };

  const handleLogout = async () => {
    await logoutUser();
    updateState(prev => ({
      ...prev,
      user: { ...prev.user, email: "", onboardingCompleted: false }
    }));
    setScreen('auth');
  };

  const continueAsGuest = () => {
    triggerHaptic();
    updateState(prev => ({
      ...prev,
      user: { ...prev.user, onboardingCompleted: true }
    }));
    setScreen('app');
  };

  return (
    <AppContext.Provider
      value={{
        state,
        screen,
        setScreen,
        setActiveTab,
        toggleTask,
        addWater,
        addSteps,
        toggleExercise,
        takeSupplement,
        addSupplement,
        deleteSupplement,
        updateLockInDays,
        advanceDay,
        addCustomTask,
        deleteTask,
        joinSquad,
        leaveSquad,
        setActiveSquad,
        saveOnboardingProfile,
        handleLogin,
        handleSignup,
        handleGoogleAuth,
        handleLogout,
        continueAsGuest,
        activeModal,
        openModal,
        closeModal,
        modalPayload,
        isLoading,
        currentNotification,
        triggerNotification,
        dismissNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
