// DAMN — Firebase Auth + Firestore Engine
// Handles signup, login, logout, user data sync, and squad management

const FIREBASE_CONFIG = (window.DAMN_CONFIG && window.DAMN_CONFIG.FIREBASE) 
  ? window.DAMN_CONFIG.FIREBASE 
  : {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      databaseId: "damn"
    };

const FIRESTORE_DATABASE_ID = FIREBASE_CONFIG.databaseId || "damn";

// Initialize Firebase (only if config is set)
let db = null;
let auth = null;
let currentUser = null;

function initFirebase() {
  if (FIREBASE_CONFIG.apiKey && !firebase.apps.length) {
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    try {
      // Use custom named database 'damn'
      db = firebase.app().firestore(FIRESTORE_DATABASE_ID);
    } catch (e) {
      console.warn("Named Firestore database 'damn' not found, falling back to default database:", e);
      db = firebase.firestore();
    }
    auth = firebase.auth();
    try {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch(pe) {}
    return true;
  } else if (firebase.apps.length > 0) {
    try {
      db = firebase.app().firestore(FIRESTORE_DATABASE_ID);
    } catch (e) {
      db = firebase.firestore();
    }
    auth = firebase.auth();
    try {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch(pe) {}
    return true;
  }
  return false;
}

// ==================== AUTH ====================

function showAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  const obScreen = document.getElementById('onboardingScreen');
  if (obScreen) obScreen.style.display = 'none';
  document.getElementById('appScreen').style.display = 'none';
  document.querySelector('.liquid-dock-nav').style.display = 'none';
  document.querySelector('.app-header').style.display = 'none';
}

function showOnboardingScreen() {
  document.getElementById('authScreen').style.display = 'none';
  const obScreen = document.getElementById('onboardingScreen');
  if (obScreen) obScreen.style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.querySelector('.liquid-dock-nav').style.display = 'none';
  document.querySelector('.app-header').style.display = 'none';
}

function showAppScreen() {
  document.getElementById('authScreen').style.display = 'none';
  const obScreen = document.getElementById('onboardingScreen');
  if (obScreen) obScreen.style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  document.querySelector('.liquid-dock-nav').style.display = 'flex';
  document.querySelector('.app-header').style.display = 'block';
}

function toggleAuthMode() {
  const form = document.getElementById('authForm');
  const isLogin = form.dataset.mode === 'login';
  form.dataset.mode = isLogin ? 'signup' : 'login';
  
  document.getElementById('authTitle').innerText = isLogin ? 'Create Account' : 'Welcome Back';
  document.getElementById('authSubtitle').innerText = isLogin ? 'Build your discipline protocol' : 'Continue your lock-in';
  document.getElementById('authSubmitBtn').innerText = isLogin ? 'Sign Up' : 'Log In';
  document.getElementById('authToggleText').innerHTML = isLogin 
    ? 'Already have an account? <a href="#" onclick="toggleAuthMode(); return false;">Log In</a>'
    : 'No account? <a href="#" onclick="toggleAuthMode(); return false;">Sign Up</a>';
  document.getElementById('authNameField').style.display = isLogin ? 'block' : 'none';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('authForm');
  const mode = form.dataset.mode || 'login';
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  
  errEl.innerText = '';
  btn.disabled = true;
  btn.innerText = mode === 'login' ? 'Logging in...' : 'Creating...';

  if (!initFirebase()) {
    errEl.innerText = 'Firebase not configured. Check FIREBASE_CONFIG in auth.js';
    btn.disabled = false;
    btn.innerText = mode === 'login' ? 'Log In' : 'Sign Up';
    return;
  }

  try {
    if (mode === 'signup') {
      if (!name) { errEl.innerText = 'Enter your name'; btn.disabled = false; btn.innerText = 'Sign Up'; return; }
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      currentUser = cred.user;
      
      // Create user document with default routine template
      await createUserDoc(currentUser.uid, name, email);
      await loadUserData(currentUser.uid);
      return;
    } else {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      currentUser = cred.user;
      await loadUserData(currentUser.uid);
    }
  } catch (err) {
    const msgs = {
      'auth/email-already-in-use': 'Email already registered. Log in instead.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found. Sign up first.',
      'auth/wrong-password': 'Wrong password. Try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Try later.'
    };
    errEl.innerText = msgs[err.code] || err.message;
  }
  
  btn.disabled = false;
  btn.innerText = mode === 'login' ? 'Log In' : 'Sign Up';
}

async function handleGoogleSignIn() {
  const errEl = document.getElementById('authError');
  if (errEl) errEl.innerText = '';

  if (!initFirebase()) {
    if (errEl) errEl.innerText = 'Firebase not initialized.';
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const cred = await auth.signInWithPopup(provider);
    currentUser = cred.user;
    
    // Check if user doc exists, create if first time
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) {
      await createUserDoc(currentUser.uid, currentUser.displayName || 'User', currentUser.email || '');
    }
    
    await loadUserData(currentUser.uid);
    showAppScreen();
    renderApp();
  } catch (err) {
    console.error("Google Sign-In Error:", err);
    if (errEl) {
      const msgs = {
        'auth/popup-closed-by-user': 'Sign-in popup closed before completing.',
        'auth/cancelled-popup-request': 'Popup cancelled.',
        'auth/operation-not-allowed': 'Google Sign-In is not enabled in Firebase Console.'
      };
      errEl.innerText = msgs[err.code] || err.message;
    }
  }
}

async function handleLogout() {
  if (auth) {
    await auth.signOut();
  }
  currentUser = null;
  localStorage.removeItem(STORAGE_KEY);
  showAuthScreen();
}

// ==================== FIRESTORE USER DATA ====================

const DEFAULT_ROUTINE = {
  morning: [
    { id: "m1", label: "Wake Up", xp: 50 },
    { id: "m2", label: "Brush Teeth", xp: 50 },
    { id: "m3", label: "Drink Water", xp: 50 },
    { id: "m4", label: "Sunlight", xp: 50 },
    { id: "m5", label: "Meditation", xp: 50 },
  ],
  breakfast: [
    { id: "b1", label: "Breakfast", xp: 50 },
  ],
  lunch: [
    { id: "l1", label: "Lunch", xp: 50 },
  ],
  workout: [
    { id: "w1", label: "Workout", xp: 100 },
    { id: "w2", label: "Walking", xp: 100 },
  ],
  evening: [
    { id: "e1", label: "Dinner", xp: 50 },
  ],
  discipline: [
    { id: "d1", label: "No Sugar", xp: 150 },
    { id: "d2", label: "No Junk Food", xp: 150 },
  ],
  night: [
    { id: "n1", label: "Brush Teeth", xp: 50 },
    { id: "n2", label: "Sleep Before Goal", xp: 100 },
  ]
};

async function createUserDoc(uid, name, email) {
  if (!db) return;
  
  const myCode = generateSquadCode();
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    profile: {
      name: name,
      email: email,
      mySquadCode: myCode,
      squadCode: myCode,
      joinedSquads: [myCode],
      onboardingCompleted: false,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      streak: 0,
      xp: 0,
      level: 1,
      rank: 'LOCK-IN NOVICE',
      dayCurrent: 1,
      dayTotal: 60,
      currentWeight: 0,
      targetWeight: 0,
      waterGoalMl: 3000,
      waterCurrentMl: 0
    },
    routines: DEFAULT_ROUTINE,
    workoutSplit: {
      activeDay: "Monday",
      days: {
        Monday: { focus: "Push", exercises: [] },
        Tuesday: { focus: "Pull", exercises: [] },
        Wednesday: { focus: "Legs", exercises: [] },
        Thursday: { focus: "Push", exercises: [] },
        Friday: { focus: "Pull", exercises: [] },
        Saturday: { focus: "Legs", exercises: [] },
        Sunday: { focus: "Rest", exercises: [] }
      }
    },
    supplements: [],
    historicalLogs: [],
    todayCompleted: {}
  });

  // Create personal squad doc for user's unique code
  await db.collection('squads').doc(myCode).set({
    info: {
      name: `${name}'s Squad`,
      createdBy: uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }
  });

  await db.collection('squads').doc(myCode).collection('members').doc(uid).set({
    name: name,
    streak: 0,
    xp: 0,
    level: 1,
    completionPct: 0,
    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'Active Now'
  });
}

async function loadUserData(uid) {
  if (!db) return;
  
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data();
      const profile = data.profile || {};
      
      const myCode = profile.mySquadCode || profile.squadCode || generateSquadCode();
      const joined = profile.joinedSquads || [myCode];

      // Build complete appState from Firestore data
      appState.user = {
        name: profile.name || currentUser.displayName || 'User',
        email: profile.email || currentUser.email || '',
        mySquadCode: myCode,
        squadCode: myCode,
        joinedSquads: joined,
        gender: profile.gender || 'Male',
        age: profile.age || 22,
        heightCm: profile.heightCm || 175,
        dayCurrent: profile.dayCurrent || 1,
        dayTotal: profile.dayTotal || 60,
        currentStreak: profile.streak || 0,
        currentWeight: profile.currentWeight || 0,
        targetWeight: profile.targetWeight || 0,
        fitnessGoal: profile.fitnessGoal || 'Fat Loss & Shred',
        dietType: profile.dietType || 'Non-Veg',
        proteins: profile.proteins || [],
        vegetables: profile.vegetables || [],
        vegCookStyle: profile.vegCookStyle || 'Mixed',
        fruits: profile.fruits || [],
        grains: profile.grains || [],
        foodTimings: profile.foodTimings || '',
        sleepSchedule: profile.sleepSchedule || '',
        workoutLocation: profile.workoutLocation || 'Gym',
        workoutType: profile.workoutType || 'Push / Pull / Legs',
        workoutExperience: profile.workoutExperience || 'Intermediate',
        workoutTiming: profile.workoutTiming || 'Evening (5-7 PM)',
        waterGoalMl: profile.waterGoalMl || 3500,
        waterCurrentMl: profile.waterCurrentMl || 0,
        skinHairGoals: profile.skinHairGoals || [],
        allergies: profile.allergies || 'None',
        disciplineRules: profile.disciplineRules || [],
        xp: profile.xp || 0,
        level: profile.level || 1,
        rank: profile.rank || 'LOCK-IN NOVICE',
        onboardingCompleted: profile.onboardingCompleted || false,
        chatHistory: data.chatHistory || profile.chatHistory || []
      };
      
      // Load routines — mark all as uncompleted for today
      const routines = data.routines || DEFAULT_ROUTINE;
      const todayKey = new Date().toISOString().split('T')[0];
      const todayCompleted = data.todayCompleted || {};
      const todayData = todayCompleted[todayKey] || [];
      
      appState.dailyTasks = {};
      Object.entries(routines).forEach(([section, tasks]) => {
        appState.dailyTasks[section] = tasks.map(t => ({
          ...t,
          completed: todayData.includes(t.id)
        }));
      });
      
      appState.workoutSplit = data.workoutSplit || appState.workoutSplit;
      appState.supplements = data.supplements || [];
      appState.weightHistory = data.weightHistory || [];
      appState.historicalLogs = data.historicalLogs || [];
      appState.squadMembers = [];
      
      // Save to localStorage as cache
      saveStateLocal();
      
      // Load all joined squads
      await loadAllJoinedSquads();

      // ROUTE AUTOMATICALLY: If new user or onboarding not done, go straight to DAMN Setup screen
      if (!profile.onboardingCompleted) {
        showOnboardingScreen();
        if (typeof startOnboardingFlow === 'function') {
          startOnboardingFlow(true);
        }
      } else {
        showAppScreen();
        renderApp();
      }
    }
  } catch (e) {
    console.error('Error loading user data:', e);
  }
}

async function saveUserData() {
  if (!db || !currentUser) return;
  
  try {
    const todayKey = new Date().toISOString().split('T')[0];
    const completedIds = [];
    Object.values(appState.dailyTasks).forEach(sec => {
      sec.forEach(t => { if (t.completed) completedIds.push(t.id); });
    });
    
    // Build clean routines (without completed state)
    const cleanRoutines = {};
    Object.entries(appState.dailyTasks).forEach(([section, tasks]) => {
      cleanRoutines[section] = tasks.map(t => {
        const clean = { id: t.id, label: t.label, xp: t.xp || 50 };
        if (t.isSupp) clean.isSupp = true;
        if (t.suppKey) clean.suppKey = t.suppKey;
        return clean;
      });
    });
    
    await db.collection('users').doc(currentUser.uid).set({
      profile: {
        name: appState.user.name || '',
        email: appState.user.email || currentUser.email || '',
        mySquadCode: appState.user.mySquadCode || '',
        joinedSquads: appState.user.joinedSquads || [],
        gender: appState.user.gender || 'Male',
        age: appState.user.age || 22,
        heightCm: appState.user.heightCm || 175,
        streak: appState.user.currentStreak || 0,
        xp: appState.user.xp || 0,
        level: appState.user.level || 1,
        rank: appState.user.rank || 'LOCK-IN NOVICE',
        dayCurrent: appState.user.dayCurrent || 1,
        dayTotal: appState.user.dayTotal || 60,
        currentWeight: appState.user.currentWeight || 0,
        targetWeight: appState.user.targetWeight || 0,
        fitnessGoal: appState.user.fitnessGoal || '',
        dietType: appState.user.dietType || '',
        proteins: appState.user.proteins || [],
        vegetables: appState.user.vegetables || [],
        vegCookStyle: appState.user.vegCookStyle || '',
        fruits: appState.user.fruits || [],
        grains: appState.user.grains || [],
        foodTimings: appState.user.foodTimings || '',
        sleepSchedule: appState.user.sleepSchedule || '',
        workoutLocation: appState.user.workoutLocation || 'Gym',
        workoutType: appState.user.workoutType || 'Push / Pull / Legs',
        workoutExperience: appState.user.workoutExperience || 'Intermediate',
        workoutTiming: appState.user.workoutTiming || 'Evening (5-7 PM)',
        waterGoalMl: appState.user.waterGoalMl || 3500,
        waterCurrentMl: appState.user.waterCurrentMl || 0,
        skinHairGoals: appState.user.skinHairGoals || [],
        allergies: appState.user.allergies || 'None',
        disciplineRules: appState.user.disciplineRules || [],
        onboardingCompleted: appState.user.onboardingCompleted || false,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      },
      routines: cleanRoutines,
      workoutSplit: appState.workoutSplit || {},
      supplements: appState.supplements || [],
      weightHistory: appState.weightHistory || [],
      historicalLogs: appState.historicalLogs || [],
      chatHistory: (appState.user.chatHistory || []).slice(-100),
      [`todayCompleted.${todayKey}`]: completedIds
    }, { merge: true });
    
    // Sync to squad if joined
    if (appState.user.joinedSquads && appState.user.joinedSquads.length > 0) {
      syncProgressToSquad();
    }
  } catch (e) {
    console.error('Error saving user data:', e);
  }
}

function saveStateLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

// ==================== SQUAD SYSTEM ====================

function generateSquadCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DAMN-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

async function joinSquad(code) {
  if (!db || !currentUser) return false;
  
  code = code.trim().toUpperCase();
  if (!code) return false;

  const joined = appState.user.joinedSquads || [appState.user.mySquadCode || ''];
  if (joined.length >= 5) {
    alert("You can join a maximum of 5 squads!");
    return false;
  }

  if (joined.includes(code)) {
    alert("You are already a member of this squad!");
    return false;
  }
  
  // Check if squad exists
  const squadDoc = await db.collection('squads').doc(code).get();
  if (!squadDoc.exists) {
    alert("Squad Code not found! Please verify the code.");
    return false;
  }
  
  // Add self as member
  await db.collection('squads').doc(code).collection('members').doc(currentUser.uid).set({
    name: appState.user.name,
    streak: appState.user.currentStreak || 0,
    xp: appState.user.xp || 0,
    level: appState.user.level || 1,
    completionPct: getTodayPct(),
    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'Active Now'
  });
  
  // Update user joinedSquads array
  joined.push(code);
  appState.user.joinedSquads = joined;
  await db.collection('users').doc(currentUser.uid).update({
    'profile.joinedSquads': joined
  });
  
  await loadAllJoinedSquads();
  saveStateLocal();
  renderApp();
  alert(`Joined Squad ${code}! 🔥`);
  return true;
}

async function loadAllJoinedSquads() {
  if (!db || !currentUser) return;
  const joined = appState.user.joinedSquads || [appState.user.mySquadCode];
  appState.squadMembers = [];

  for (const code of joined) {
    if (!code) continue;
    try {
      const snapshot = await db.collection('squads').doc(code).collection('members').get();
      snapshot.forEach(doc => {
        const data = doc.data();
        // Prevent duplicate member entries across squads
        if (!appState.squadMembers.some(m => m.uid === doc.id)) {
          appState.squadMembers.push({
            uid: doc.id,
            squadCode: code,
            name: doc.id === currentUser?.uid ? `${data.name} (You)` : data.name,
            completionPct: data.completionPct || 0,
            streak: data.streak || 0,
            xp: data.xp || 0,
            level: data.level || 1,
            status: data.status || 'Active',
            isUser: doc.id === currentUser?.uid
          });
        }
      });
    } catch (e) {
      console.error('Error loading squad:', code, e);
    }
  }

  // Sort: User first, then highest completion %
  appState.squadMembers.sort((a, b) => {
    if (a.isUser) return -1;
    if (b.isUser) return 1;
    return b.completionPct - a.completionPct;
  });
}

async function leaveSquad() {
  if (!db || !currentUser || !appState.user.squadCode) return;
  
  const code = appState.user.squadCode;
  
  // Remove self from squad members
  await db.collection('squads').doc(code).collection('members').doc(currentUser.uid).delete();
  
  // Clear squad code
  appState.user.squadCode = '';
  await db.collection('users').doc(currentUser.uid).update({
    'profile.squadCode': ''
  });
  
  appState.squadMembers = [];
  saveStateLocal();
  renderApp();
}

async function loadSquadMembers(code) {
  if (!db) return;
  
  try {
    const snapshot = await db.collection('squads').doc(code).collection('members').get();
    appState.squadMembers = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      appState.squadMembers.push({
        uid: doc.id,
        name: doc.id === currentUser?.uid ? `${data.name} (You)` : data.name,
        completionPct: data.completionPct || 0,
        streak: data.streak || 0,
        xp: data.xp || 0,
        level: data.level || 1,
        status: data.status || 'Offline',
        isUser: doc.id === currentUser?.uid
      });
    });
    
    // Sort: current user first, then by completion %
    appState.squadMembers.sort((a, b) => {
      if (a.isUser) return -1;
      if (b.isUser) return 1;
      return b.completionPct - a.completionPct;
    });
  } catch (e) {
    console.error('Error loading squad:', e);
  }
}

async function syncProgressToSquad() {
  if (!db || !currentUser) return;
  const joined = appState.user.joinedSquads || [appState.user.mySquadCode];
  
  for (const code of joined) {
    if (!code) continue;
    try {
      await db.collection('squads').doc(code)
        .collection('members').doc(currentUser.uid).set({
          name: appState.user.name,
          streak: appState.user.currentStreak || 0,
          xp: appState.user.xp || 0,
          level: appState.user.level || 1,
          completionPct: getTodayPct(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'Active Now'
        }, { merge: true });
    } catch (e) {
      console.error('Squad sync error:', code, e);
    }
  }
}

// Live listener for squad updates
let squadUnsubscribe = null;

function listenToSquad(code) {
  if (squadUnsubscribe) squadUnsubscribe();
  if (!db || !code) return;
  
  squadUnsubscribe = db.collection('squads').doc(code)
    .collection('members').onSnapshot(snapshot => {
      appState.squadMembers = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        appState.squadMembers.push({
          uid: doc.id,
          name: doc.id === currentUser?.uid ? `${data.name} (You)` : data.name,
          completionPct: data.completionPct || 0,
          streak: data.streak || 0,
          xp: data.xp || 0,
          level: data.level || 1,
          status: data.status || 'Offline',
          isUser: doc.id === currentUser?.uid
        });
      });
      
      appState.squadMembers.sort((a, b) => {
        if (a.isUser) return -1;
        if (b.isUser) return 1;
        return b.completionPct - a.completionPct;
      });
      
      renderSquadList();
    });
}

// ==================== ROUTINE EDITOR ====================

let editingSection = null;

function openRoutineEditor(section) {
  editingSection = section;
  const modal = document.getElementById('modalRoutineEditor');
  if (!modal) return;
  
  const sectionTitles = {
    morning: "Morning Routine",
    breakfast: "Breakfast",
    lunch: "Lunch",
    workout: "Workout",
    evening: "Evening",
    discipline: "Discipline Rules",
    night: "Night Routine"
  };
  
  document.getElementById('editorSectionTitle').innerText = sectionTitles[section] || section;
  
  renderEditorTasks();
  modal.classList.add('open');
}

function closeRoutineEditor() {
  const modal = document.getElementById('modalRoutineEditor');
  if (modal) modal.classList.remove('open');
  editingSection = null;
}

function renderEditorTasks() {
  const container = document.getElementById('editorTasksList');
  if (!container || !editingSection) return;
  
  const tasks = appState.dailyTasks[editingSection] || [];
  let html = '';
  
  tasks.forEach((task, idx) => {
    html += `
      <div class="task-item" style="cursor: default;">
        <div class="task-left">
          <span class="task-title">${task.label}</span>
        </div>
        <button class="btn-close" style="font-size: 1rem; color: var(--apple-pink);" onclick="removeRoutineTask('${editingSection}', ${idx})">&times;</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function addRoutineTask() {
  if (!editingSection) return;
  const input = document.getElementById('editorNewTaskInput');
  const label = input.value.trim();
  if (!label) return;
  
  const tasks = appState.dailyTasks[editingSection] || [];
  const id = editingSection.charAt(0) + (Date.now() % 100000);
  tasks.push({ id, label, completed: false, xp: editingSection === 'discipline' ? 150 : 50 });
  appState.dailyTasks[editingSection] = tasks;
  
  input.value = '';
  renderEditorTasks();
  saveState();
}

function removeRoutineTask(section, idx) {
  const tasks = appState.dailyTasks[section];
  if (tasks && idx >= 0 && idx < tasks.length) {
    tasks.splice(idx, 1);
    renderEditorTasks();
    saveState();
  }
}

// ==================== BOOT ====================

function dismissLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 600);
  }
}

function bootApp() {
  // Show loading screen with DAMN AI mascot
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) loadingScreen.style.display = 'flex';

  if (!initFirebase()) {
    // No Firebase config — run in offline/demo mode after splash
    setTimeout(() => {
      dismissLoadingScreen();
      showAppScreen();
      renderApp();
    }, 2500);
    return;
  }
  
  // Listen for auth state changes
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await loadUserData(user.uid);
      
      // Dismiss loading screen then show app
      setTimeout(() => {
        dismissLoadingScreen();
        
        // Check if onboarding is needed
        if (!appState.user.onboardingCompleted) {
          showOnboardingScreen();
          if (typeof startOnboardingFlow === 'function') startOnboardingFlow(true);
        } else {
          showAppScreen();
        }
        renderApp();
        
        // Start listening to squad updates
        if (appState.user.squadCode) {
          listenToSquad(appState.user.squadCode);
        }
      }, 2200);
    } else {
      currentUser = null;
      setTimeout(() => {
        dismissLoadingScreen();
        const hasSavedOnboarding = localStorage.getItem('damn_onboarding_state');
        if (appState && appState.user && appState.user.onboardingCompleted) {
          // User already completed setup in local/guest session — keep them on app screen!
          showAppScreen();
          renderApp();
        } else if (hasSavedOnboarding) {
          // Resume onboarding where user left off!
          showOnboardingScreen();
          if (typeof startOnboardingFlow === 'function') startOnboardingFlow(true);
        } else {
          showAuthScreen();
        }
      }, 2200);
    }
  });
}

function continueAsGuest() {
  dismissLoadingScreen();
  if (appState && appState.user && appState.user.onboardingCompleted) {
    showAppScreen();
  } else {
    showOnboardingScreen();
    if (typeof startOnboardingFlow === 'function') startOnboardingFlow(true);
  }
  renderApp();
}

window.continueAsGuest = continueAsGuest;
