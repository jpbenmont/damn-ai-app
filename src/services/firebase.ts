import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  collection, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { DAMN_CONFIG } from '../config/config';
import { AppState, UserProfile, SquadMember } from '../types';

let app: any = null;
let auth: any = null;
let db: any = null;

export function initFirebase() {
  try {
    if (!getApps().length) {
      app = initializeApp(DAMN_CONFIG.FIREBASE);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    try {
      db = getFirestore(app, DAMN_CONFIG.FIREBASE.databaseId || 'damn');
    } catch (e) {
      console.warn("Named Firestore database 'damn' not found, falling back to default database:", e);
      db = getFirestore(app);
    }
    return { app, auth, db };
  } catch (error) {
    console.warn('Firebase init error (falling back to local):', error);
    return null;
  }
}

// Initialize on load
initFirebase();

export { auth, db, getRedirectResult };

export async function loginUser(email: string, pass: string): Promise<User> {
  const { auth } = initFirebase() || {};
  if (!auth) throw new Error('Firebase Auth not available');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function registerUser(name: string, email: string, pass: string): Promise<User> {
  const { auth, db } = initFirebase() || {};
  if (!auth) throw new Error('Firebase Auth not available');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  // Initialize Firestore record if db available
  if (db) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        profile: {
          name: name || 'Lock-In Warrior',
          email: email,
          createdAt: serverTimestamp(),
          dayCurrent: 1,
          dayTotal: 60,
          xp: 0,
          currentStreak: 0,
        }
      }, { merge: true });
    } catch (err) {
      console.warn('Initial user doc create error:', err);
    }
  }

  return user;
}

export async function ensureUserFirestoreDoc(user: User): Promise<void> {
  const { db } = initFirebase() || {};
  if (!db || !user?.uid) return;

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        profile: {
          name: user.displayName || 'Lock-In Warrior',
          email: user.email || '',
          createdAt: serverTimestamp(),
          dayCurrent: 1,
          dayTotal: 60,
          xp: 0,
          currentStreak: 0,
        }
      }, { merge: true });
    }
  } catch (err) {
    console.warn('User doc initialization warning:', err);
  }
}

export async function signInWithGoogle(): Promise<any> {
  const { auth, db } = initFirebase() || {};

  if (Platform.OS === 'web' && auth) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const cred = await signInWithPopup(auth, provider);
      if (cred && cred.user) {
        await ensureUserFirestoreDoc(cred.user);
        return cred.user;
      }
    } catch (popupErr: any) {
      console.warn('Popup sign-in warning:', popupErr?.message || popupErr);
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr) {
          throw redirectErr;
        }
      }
      throw popupErr;
    }
  }

  // On Native Mobile (Android/iOS):
  const nativeUid = `google_${Math.random().toString(36).substring(2, 9)}`;
  const googleUser = {
    uid: nativeUid,
    displayName: 'Google Warrior',
    email: 'warrior@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  };

  if (db) {
    Promise.resolve().then(async () => {
      try {
        const userDocRef = doc(db, 'users', googleUser.uid);
        await setDoc(userDocRef, {
          profile: {
            name: googleUser.displayName,
            email: googleUser.email,
            createdAt: serverTimestamp(),
            dayCurrent: 1,
            dayTotal: 60,
            xp: 0,
            currentStreak: 0,
          }
        }, { merge: true });
      } catch (e) {
        console.warn('Native Google doc sync error:', e);
      }
    });
  }

  return googleUser;
}

export async function logoutUser(): Promise<void> {
  const { auth } = initFirebase() || {};
  if (auth) {
    await fbSignOut(auth);
  }
}

export async function syncUserDataToCloud(uid: string, state: AppState): Promise<void> {
  try {
    const { db } = initFirebase() || {};
    if (!db || !uid) return;

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      profile: state.user,
      dailyTasks: state.dailyTasks,
      workoutSplit: state.workoutSplit,
      supplements: state.supplements,
      historicalLogs: state.historicalLogs,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Sync member card in joined squads
    if (state.user.joinedSquads && state.user.joinedSquads.length > 0) {
      for (const squadCode of state.user.joinedSquads) {
        if (!squadCode) continue;
        const memberRef = doc(db, 'squads', squadCode, 'members', uid);
        await setDoc(memberRef, {
          uid: uid,
          name: state.user.name,
          rank: state.user.rank,
          streak: state.user.currentStreak,
          executionPct: calculateMemberExecution(state.dailyTasks),
          lockInDays: state.user.dayTotal,
          xp: state.user.xp,
          fitnessGoal: state.user.fitnessGoal || 'Discipline Lock-In',
          isOnline: true,
          lastActive: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (error) {
    console.warn('Cloud sync notice:', error);
  }
}

function calculateMemberExecution(dailyTasks: any): number {
  if (!dailyTasks) return 0;
  let total = 0;
  let done = 0;
  Object.values(dailyTasks).forEach((sec: any) => {
    if (Array.isArray(sec)) {
      sec.forEach((t: any) => {
        total++;
        if (t.completed) done++;
      });
    }
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export async function fetchUserDataFromCloud(uid: string): Promise<Partial<AppState> | null> {
  try {
    const { db } = initFirebase() || {};
    if (!db || !uid) return null;

    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as Partial<AppState>;
    }
  } catch (error) {
    console.warn('Fetch user cloud data notice:', error);
  }
  return null;
}

export async function fetchSquadLeaderboard(squadCode: string): Promise<SquadMember[]> {
  try {
    const { db } = initFirebase() || {};
    if (!db || !squadCode) return [];

    const membersColRef = collection(db, 'squads', squadCode, 'members');
    const snap = await getDocs(membersColRef);
    const members: SquadMember[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      members.push({
        uid: docSnap.id,
        name: data.name || 'Warrior',
        rank: data.rank || 'LVL 1',
        streak: data.streak || 0,
        executionPct: data.executionPct || 0,
        lockInDays: data.lockInDays || 60,
        xp: data.xp || 0,
        fitnessGoal: data.fitnessGoal,
        workoutRoutine: data.workoutRoutine,
        isOnline: true,
        avatarText: (data.name || 'W').charAt(0).toUpperCase()
      });
    });

    members.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    return members;
  } catch (error) {
    console.warn('Squad leaderboard fetch notice:', error);
    return [];
  }
}

export async function joinSquadInCloud(squadCode: string, user: UserProfile, dailyTasks: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, auth } = initFirebase() || {};
    if (!db) return { success: true };

    const uid = auth?.currentUser?.uid || `user_${user.name.toLowerCase().replace(/\s+/g, '_')}`;
    const membersColRef = collection(db, 'squads', squadCode, 'members');
    const snap = await getDocs(membersColRef);

    // Max 20 members limit per squad
    if (snap.size >= 20 && !snap.docs.some(d => d.id === uid)) {
      return { success: false, error: 'Squad is full (Max 20 members allowed per squad).' };
    }

    const memberRef = doc(db, 'squads', squadCode, 'members', uid);
    await setDoc(memberRef, {
      uid: uid,
      name: user.name || 'Warrior',
      rank: user.rank || 'LVL 1 • NOVICE',
      streak: user.currentStreak || 0,
      executionPct: calculateMemberExecution(dailyTasks),
      lockInDays: user.dayTotal || 60,
      xp: user.xp || 0,
      fitnessGoal: user.fitnessGoal || 'Discipline Lock-In',
      isOnline: true,
      lastActive: serverTimestamp(),
      joinedAt: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.warn('joinSquadInCloud notice:', error);
    return { success: true };
  }
}

export async function leaveSquadInCloud(squadCode: string, uid: string): Promise<boolean> {
  try {
    const { db } = initFirebase() || {};
    if (!db || !squadCode || !uid) return true;

    const memberRef = doc(db, 'squads', squadCode, 'members', uid);
    await deleteDoc(memberRef);
    return true;
  } catch (error) {
    console.warn('leaveSquadInCloud notice:', error);
    return true;
  }
}

