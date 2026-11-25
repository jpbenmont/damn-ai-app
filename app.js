// DAMN — App Engine (works with auth.js for Firebase, or standalone offline)
const STORAGE_KEY = 'damn_app_state_v8';

const initialAppState = {
  activeTab: 'dashboard',
  user: {
    name: "User",
    email: "",
    squadCode: "",
    dayCurrent: 1,
    dayTotal: 60,
    currentStreak: 0,
    currentWeight: 0,
    targetWeight: 0,
    waterGoalMl: 3000,
    waterCurrentMl: 0,
    xp: 0,
    level: 1,
    rank: "LOCK-IN NOVICE"
  },
  selectedLockInDaysTemp: 60,
  squadMembers: [],
  dailyTasks: {
    morning: [
      { id: "m1", label: "Wake Up", completed: false, xp: 50 },
      { id: "m2", label: "Brush Teeth", completed: false, xp: 50 },
      { id: "m3", label: "Drink Water", completed: false, xp: 50 },
      { id: "m4", label: "Sunlight", completed: false, xp: 50 },
      { id: "m5", label: "Meditation", completed: false, xp: 50 },
    ],
    breakfast: [
      { id: "b1", label: "Breakfast", completed: false, xp: 50 },
    ],
    lunch: [
      { id: "l1", label: "Lunch", completed: false, xp: 50 },
    ],
    workout: [
      { id: "w1", label: "Workout", completed: false, xp: 100 },
      { id: "w2", label: "Walking", completed: false, xp: 100 },
    ],
    evening: [
      { id: "e1", label: "Dinner", completed: false, xp: 50 },
    ],
    discipline: [
      { id: "d1", label: "No Sugar", completed: false, xp: 150 },
      { id: "d2", label: "No Junk Food", completed: false, xp: 150 },
    ],
    night: [
      { id: "n1", label: "Brush Teeth", completed: false, xp: 50 },
      { id: "n2", label: "Sleep Before Goal", completed: false, xp: 100 },
    ],
  },
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
  historicalLogs: []
};

let appState = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('State load notice:', e);
  }
  return JSON.parse(JSON.stringify(initialAppState));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    // Sync to Firestore if authenticated
    if (typeof saveUserData === 'function' && typeof currentUser !== 'undefined' && currentUser) {
      saveUserData();
    }
  } catch (e) {
    console.error('State save notice:', e);
  }
  renderApp();
}

function getRankTitle(level) {
  if (level >= 15) return "LVL 15 • UNSTOPPABLE GOD";
  if (level >= 10) return "LVL 10 • DISCIPLINE WARRIOR";
  if (level >= 5) return "LVL 5 • DISCIPLINE MONK";
  return `LVL ${level} • LOCK-IN NOVICE`;
}

function getTodayPct() {
  let total = 0, done = 0;
  Object.values(appState.dailyTasks).forEach(sec => {
    sec.forEach(t => {
      total++;
      if (t.completed) done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function getRecoveryScore() {
  const pct = getTodayPct();
  const waterPct = Math.min(100, (appState.user.waterCurrentMl / appState.user.waterGoalMl) * 100);
  const score = Math.round((pct * 0.5) + (waterPct * 0.3) + 20);
  return Math.min(100, Math.max(10, score));
}

function getSectionPct(sectionKeys) {
  let total = 0, done = 0;
  sectionKeys.forEach(key => {
    const sec = appState.dailyTasks[key];
    if (sec) sec.forEach(t => { total++; if (t.completed) done++; });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

// ==================== RENDER ENGINE ====================
function renderApp() {
  checkMidnightAutoFinish();
  checkChronoSmartNotifications();

  const pct = getTodayPct();
  const recovery = getRecoveryScore();
  const userName = appState.user.name || "User";

  // XP & Level calculations
  const totalXp = appState.user.xp || 0;
  const currentLevel = Math.floor(totalXp / 250) + 1;
  const xpInCurrentLevel = totalXp % 250;
  const xpPct = Math.round((xpInCurrentLevel / 250) * 100);
  const rankTitle = getRankTitle(currentLevel);

  appState.user.level = currentLevel;
  appState.user.rank = rankTitle;

  // Motto Banner
  const lblUser = document.getElementById('lblUserName');
  if (lblUser) lblUser.innerText = userName;
  
  const lblLockIn = document.getElementById('lblLockInDaysText');
  if (lblLockIn) lblLockIn.innerText = `${appState.user.dayTotal} Days Protocol`;

  // XP Level Bar
  const badgeRank = document.getElementById('badgeUserRank');
  if (badgeRank) badgeRank.innerText = rankTitle;

  const xpBar = document.getElementById('xpProgressBar');
  if (xpBar) xpBar.style.width = `${xpPct}%`;

  const txtXp = document.getElementById('txtUserXp');
  if (txtXp) txtXp.innerText = `${totalXp.toLocaleString()} XP`;

  // Header UI
  const elDayCur = document.getElementById('headerDayCurrent');
  if (elDayCur) elDayCur.innerText = String(appState.user.dayCurrent).padStart(2, '0');

  const elDayTot = document.getElementById('headerDayTotal');
  if (elDayTot) elDayTot.innerText = appState.user.dayTotal;

  const elStreak = document.getElementById('headerStreak');
  if (elStreak) elStreak.innerText = `🔥${appState.user.currentStreak || 0}`;

  // Stats Grid
  const elValDayProg = document.getElementById('valDayProgress');
  if (elValDayProg) elValDayProg.innerText = `Day ${String(appState.user.dayCurrent).padStart(2, '0')}`;

  const elValDaysLeft = document.getElementById('valDaysLeft');
  if (elValDaysLeft) elValDaysLeft.innerText = `${appState.user.dayTotal - appState.user.dayCurrent} days left`;

  const elValTodayPct = document.getElementById('valTodayPct');
  if (elValTodayPct) elValTodayPct.innerText = `${pct}%`;

  const elValExecStatus = document.getElementById('valExecutionStatus');
  if (elValExecStatus) elValExecStatus.innerText = pct === 100 ? 'Day Won!' : 'In Progress';

  const ringExec = document.getElementById('ringFillExecution');
  if (ringExec) ringExec.setAttribute('stroke-dasharray', `${pct}, 100`);

  const elValRec = document.getElementById('valRecoveryScore');
  if (elValRec) elValRec.innerText = recovery;

  const ringRec = document.getElementById('ringFillRecovery');
  if (ringRec) ringRec.setAttribute('stroke-dasharray', `${recovery}, 100`);

  const elValWeight = document.getElementById('valCurrentWeight');
  if (elValWeight) elValWeight.innerText = appState.user.currentWeight || '—';

  if (appState.user.targetWeight > 0 && appState.user.currentWeight > 0) {
    const weightLeft = (appState.user.currentWeight - appState.user.targetWeight).toFixed(1);
    const elValTargetW = document.getElementById('valTargetWeight');
    if (elValTargetW) elValTargetW.innerText = `Target: ${appState.user.targetWeight} kg (${weightLeft > 0 ? '-' + weightLeft + 'kg left' : 'Reached!'})`;
  }

  // Hydration Card
  const goalL = (appState.user.waterGoalMl / 1000).toFixed(1);
  const waterL = (appState.user.waterCurrentMl / 1000).toFixed(2);
  const elValWaterL = document.getElementById('valWaterL');
  if (elValWaterL) elValWaterL.innerText = waterL;

  const waterGoalBadge = document.getElementById('waterGoalBadge');
  if (waterGoalBadge) waterGoalBadge.innerText = `${goalL}L Goal`;

  const waterPct = Math.min(100, Math.round((appState.user.waterCurrentMl / appState.user.waterGoalMl) * 100));
  const waterBar = document.getElementById('waterProgressBar');
  if (waterBar) waterBar.style.width = `${waterPct}%`;

  const elHydScore = document.getElementById('valHydrationScore');
  if (elHydScore) elHydScore.innerText = `${waterPct}%`;

  // Analytics section-level percentages
  const elNutr = document.getElementById('valNutritionPct');
  if (elNutr) elNutr.innerText = `${getSectionPct(['breakfast', 'lunch', 'evening'])}%`;

  const elWork = document.getElementById('valWorkoutPct');
  if (elWork) elWork.innerText = `${getSectionPct(['workout'])}%`;

  const elDisc = document.getElementById('valDisciplinePct');
  if (elDisc) elDisc.innerText = `${getSectionPct(['discipline'])}%`;

  // Squad UI toggle
  updateSquadUI();

  // Auto-sort supplements into their correct time slots & clean duplicate items
  reorganizeDailyTasksSupplements();
  cleanExistingDuplicateTasks();

  // Render Sub-Components
  renderHeatmapGrid();
  renderChecklist('checklistContainer');
  renderChecklist('checklistFocusContainer');
  renderSquadUI();
  renderWorkout();
  renderSupplements();
  renderHistoryTable();
  updateWaterUI();
  updateStepsUI();

  // Refresh Lucide Icons safely
  if (window.lucide) {
    lucide.createIcons();
  }
}

function reorganizeDailyTasksSupplements() {
  if (!appState || !appState.dailyTasks) return;

  const morningTasks = [];
  const breakfastTasks = [];
  const lunchTasks = [];
  const eveningTasks = [];
  const nightTasks = [];
  const workoutTasks = appState.dailyTasks.workout || [];
  const disciplineTasks = appState.dailyTasks.discipline || [];

  // Gather all tasks from morning, breakfast, lunch, evening, night
  const allTasks = [
    ...(appState.dailyTasks.morning || []),
    ...(appState.dailyTasks.breakfast || []),
    ...(appState.dailyTasks.lunch || []),
    ...(appState.dailyTasks.evening || []),
    ...(appState.dailyTasks.night || [])
  ];

  allTasks.forEach(task => {
    const lower = task.label.toLowerCase();

    if (task.isSupp || lower.includes("dose") || lower.includes("multi") || lower.includes("biotin") || lower.includes("fish")) {
      if (lower.includes("fish")) {
        // Fish Oil -> After Lunch
        task.label = task.label.split('(')[0].trim() + " (After Lunch)";
        lunchTasks.push(task);
      } else if (lower.includes("biotin")) {
        // Biotin -> After Dinner
        task.label = task.label.split('(')[0].trim() + " (After Dinner)";
        nightTasks.push(task);
      } else if (lower.includes("multi")) {
        // Multivitamin -> After Breakfast
        task.label = task.label.split('(')[0].trim() + " (After Breakfast)";
        breakfastTasks.push(task);
      } else if (lower.includes("ashwagandha") || lower.includes("shilajit")) {
        // Ashwagandha / Shilajit -> Lunch
        task.label = task.label.split('(')[0].trim() + " (With Lunch)";
        lunchTasks.push(task);
      } else if (lower.includes("creatine") || lower.includes("whey") || lower.includes("protein")) {
        // Creatine / Whey -> Evening
        task.label = task.label.split('(')[0].trim() + " (Pre/Post Workout)";
        eveningTasks.push(task);
      } else if (lower.includes("magnesium") || lower.includes("zinc")) {
        // Magnesium / Zinc -> Night
        task.label = task.label.split('(')[0].trim() + " (Before Sleep)";
        nightTasks.push(task);
      } else {
        // Clove Water, Garlic, Moringa, Amla -> Before Breakfast
        task.label = task.label.split('(')[0].trim() + " (Before Breakfast)";
        morningTasks.push(task);
      }
    } else {
      // Keep food / activities in their respective sections — ALWAYS CHECK TIME SLOTS FIRST!
      if (lower.includes("dinner") || lower.includes("night") || lower.includes("sleep") || lower.includes("bedtime") || lower.includes("skincare")) {
        nightTasks.push(task);
      } else if (lower.includes("evening") || lower.includes("snack") || lower.includes("pre/post")) {
        eveningTasks.push(task);
      } else if (lower.includes("lunch")) {
        lunchTasks.push(task);
      } else if (lower.includes("breakfast") || lower.includes("fasted") || lower.includes("morning")) {
        breakfastTasks.push(task);
      } else if (lower.includes("egg") || lower.includes("oat") || lower.includes("toast") || lower.includes("poha") || lower.includes("upma")) {
        breakfastTasks.push(task);
      } else if (lower.includes("rice") || lower.includes("dal") || lower.includes("paneer") || lower.includes("tofu") || lower.includes("soya") || lower.includes("roti") || lower.includes("chapati")) {
        lunchTasks.push(task);
      } else {
        morningTasks.push(task);
      }
    }
  });

  appState.dailyTasks.morning = morningTasks;
  appState.dailyTasks.breakfast = breakfastTasks;
  appState.dailyTasks.lunch = lunchTasks;
  appState.dailyTasks.evening = eveningTasks;
  appState.dailyTasks.night = nightTasks;
  appState.dailyTasks.workout = workoutTasks;
  appState.dailyTasks.discipline = disciplineTasks;
}

function cleanExistingDuplicateTasks() {
  if (!appState || !appState.dailyTasks) return;

  // 1. Move any item containing "dinner", "night", "sleep", "bedtime" out of lunch into nightTasks
  if (Array.isArray(appState.dailyTasks.lunch)) {
    for (let i = appState.dailyTasks.lunch.length - 1; i >= 0; i--) {
      const t = appState.dailyTasks.lunch[i];
      const lower = t.label.toLowerCase();
      if (lower.includes("dinner") || lower.includes("night") || lower.includes("sleep") || lower.includes("bedtime")) {
        const moved = appState.dailyTasks.lunch.splice(i, 1)[0];
        if (!appState.dailyTasks.night) appState.dailyTasks.night = [];
        const existsInNight = appState.dailyTasks.night.some(nt => nt.label.toLowerCase() === moved.label.toLowerCase());
        if (!existsInNight) {
          appState.dailyTasks.night.unshift(moved);
        }
      }
    }
  }

  // 2. Remove duplicate task labels within the same section
  Object.keys(appState.dailyTasks).forEach(secKey => {
    const tasks = appState.dailyTasks[secKey];
    if (Array.isArray(tasks)) {
      const seen = new Set();
      appState.dailyTasks[secKey] = tasks.filter(t => {
        const key = t.label.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  });
}

// ==================== HYDRATION & STEPS ====================
function updateWaterUI() {
  const current = appState.user.waterCurrentMl || 0;
  const target = appState.user.waterGoalMl || 3000;
  const pct = Math.min(100, Math.round((current / target) * 100));

  const fillEl = document.getElementById('waterProgressFill');
  const currentEl = document.getElementById('lblWaterCurrent');
  const targetEl = document.getElementById('lblWaterTarget');
  const pctEl = document.getElementById('lblWaterPct');

  if (fillEl) fillEl.style.width = `${pct}%`;
  if (currentEl) currentEl.innerText = current;
  if (targetEl) targetEl.innerText = `${target}ml`;
  if (pctEl) pctEl.innerText = `${pct}% of daily goal`;
}

function addWater(amount) {
  if (!appState.user.waterCurrentMl) appState.user.waterCurrentMl = 0;
  appState.user.waterCurrentMl += amount;
  saveState();
  updateWaterUI();
  
  if (window.confetti && appState.user.waterCurrentMl >= (appState.user.waterGoalMl || 3000)) {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  }
}

function updateStepsUI() {
  const current = appState.user.stepsCurrent || 0;
  const target = appState.user.stepsGoal || 10000;
  const pct = Math.min(100, Math.round((current / target) * 100));

  const fillEl = document.getElementById('stepsProgressFill');
  const currentEl = document.getElementById('lblStepsCurrent');
  const targetEl = document.getElementById('lblStepsTarget');
  const pctEl = document.getElementById('lblStepsPct');

  if (fillEl) fillEl.style.width = `${pct}%`;
  if (currentEl) currentEl.innerText = current.toLocaleString();
  if (targetEl) targetEl.innerText = `${target.toLocaleString()} steps`;
  if (pctEl) pctEl.innerText = `${pct}% of 10k goal`;
}

function addSteps(amount) {
  if (!appState.user.stepsCurrent) appState.user.stepsCurrent = 0;
  appState.user.stepsCurrent += amount;
  saveState();
  updateStepsUI();

  if (window.confetti && appState.user.stepsCurrent >= (appState.user.stepsGoal || 10000)) {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }
}

window.addWater = addWater;
window.updateWaterUI = updateWaterUI;
window.addSteps = addSteps;
window.updateStepsUI = updateStepsUI;

// ==================== SQUAD UI ====================
function updateSquadUI() {
  const joinSection = document.getElementById('squadJoinSection');
  const infoSection = document.getElementById('squadInfoSection');
  const codeBadge = document.getElementById('squadCodeBadge');
  
  if (appState.user.squadCode) {
    if (joinSection) joinSection.style.display = 'none';
    if (infoSection) infoSection.style.display = 'block';
    if (codeBadge) codeBadge.innerText = appState.user.squadCode;
  } else {
    if (joinSection) joinSection.style.display = 'block';
    if (infoSection) infoSection.style.display = 'none';
    if (codeBadge) codeBadge.innerText = 'No Squad';
  }
}

async function handleCreateSquad() {
  if (typeof createSquad === 'function') {
    const code = await createSquad();
    if (code) {
      alert(`Squad created! Share this code with friends:\n\n${code}`);
    }
  } else {
    alert('Firebase not configured. Set up auth.js first.');
  }
}

async function handleJoinSquad() {
  const input = document.getElementById('inpJoinSquadCode');
  const code = input ? input.value.trim() : '';
  if (!code) { alert('Enter a squad code'); return; }
  
  if (typeof joinSquad === 'function') {
    const ok = await joinSquad(code);
    if (ok) {
      alert('Joined squad!');
      if (input) input.value = '';
    } else {
      alert('Squad not found. Check the code.');
    }
  } else {
    alert('Firebase not configured.');
  }
}

async function handleLeaveSquad() {
  if (confirm('Leave this squad?')) {
    if (typeof leaveSquad === 'function') {
      await leaveSquad();
    }
  }
}

function copySquadCode() {
  if (appState.user.squadCode) {
    navigator.clipboard.writeText(appState.user.squadCode).then(() => {
      alert('Squad code copied!');
    }).catch(() => {});
  }
}

async function refreshSquad() {
  if (typeof loadSquadMembers === 'function' && appState.user.squadCode) {
    await loadSquadMembers(appState.user.squadCode);
    renderSquadList();
  }
}

// ==================== HEATMAP ====================
function renderHeatmapGrid() {
  const container = document.getElementById('heatmapGrid');
  if (!container) return;

  const totalDays = appState.user.dayTotal || 60;
  const currentDay = appState.user.dayCurrent || 1;
  const txtHeatmap = document.getElementById('txtHeatmapStatus');
  if (txtHeatmap) txtHeatmap.innerText = `Day ${String(currentDay).padStart(2, '0')} / ${totalDays} Active`;

  let html = '';
  for (let d = 1; d <= totalDays; d++) {
    const isPast = d < currentDay;
    const isCurrent = d === currentDay;
    
    let cls = 'heatmap-day';
    if (isPast) cls += ' past-done';
    if (isCurrent) cls += ' current';

    html += `<div class="${cls}">${String(d).padStart(2, '0')}</div>`;
  }
  container.innerHTML = html;
}

// ==================== CHECKLIST ====================
function renderChecklist(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const orderedSections = ["morning", "breakfast", "lunch", "evening", "workout", "night", "discipline"];

  const sectionTitles = {
    morning: "Before Breakfast (Early Morning)",
    breakfast: "Breakfast (8:30 AM)",
    lunch: "Lunch (1:30 PM)",
    evening: "Evening Snack (5:30 PM)",
    workout: "Workout Protocol & Movement",
    night: "Dinner & Night Protocol (8:30 PM)",
    discipline: "Discipline Rules & Eliminations"
  };

  let html = '';
  orderedSections.forEach(secKey => {
    const items = appState.dailyTasks[secKey];
    if (!items || items.length === 0) return;

    const title = sectionTitles[secKey] || secKey;
    const doneCount = items.filter(i => i.completed).length;

    html += `
      <div class="glass-card" style="padding: 1.1rem;">
        <div class="card-header" style="margin-bottom: 0.75rem;">
          <span style="font-weight: 700; font-size: 0.95rem;">${title}</span>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="glass-pill font-mono">${doneCount}/${items.length}</span>
            <button class="btn-close" style="font-size: 0.85rem; color: var(--text-muted); padding: 0.15rem;" onclick="openRoutineEditor('${secKey}')" title="Edit">
              <i data-lucide="pencil" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
        <div>
    `;

    items.forEach(item => {
      html += `
        <div class="task-item ${item.completed ? 'completed' : ''}" id="taskItem_${item.id}" onclick="toggleTask('${secKey}', '${item.id}', event)">
          <div class="task-left">
            <input type="checkbox" class="chk-custom" ${item.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTask('${secKey}', '${item.id}', event)">
            <span class="task-title">${item.label}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${item.isSupp ? `<span class="supp-tag">Supp</span>` : ''}
            <span class="font-mono text-muted" style="font-size: 0.68rem;">+${item.xp || 50}XP</span>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function toggleTask(secKey, taskId, event) {
  const list = appState.dailyTasks[secKey];
  if (!list) return;

  list.forEach(item => {
    if (item.id === taskId) {
      item.completed = !item.completed;
      const rewardXp = item.xp || 50;

      if (item.completed) {
        appState.user.xp += rewardXp;
        triggerFloatingXp(event, `+${rewardXp} XP`);
      } else {
        appState.user.xp = Math.max(0, appState.user.xp - rewardXp);
      }

      if (item.isSupp && item.suppKey) {
        const supp = appState.supplements.find(s => s.key === item.suppKey);
        if (supp) {
          supp.quantity = Math.max(0, supp.quantity + (item.completed ? -1 : 1));
        }
      }
    }
  });
  saveState();
}

function triggerFloatingXp(event, text) {
  let targetElement = null;
  if (event && event.currentTarget) {
    targetElement = event.currentTarget;
  } else if (event && event.target) {
    targetElement = event.target.closest('.task-item');
  }

  if (targetElement) {
    const tag = document.createElement('div');
    tag.className = 'xp-float-tag';
    tag.innerText = text;
    targetElement.appendChild(tag);
    setTimeout(() => tag.remove(), 750);
  }
}

function addWater(amountMl) {
  appState.user.waterCurrentMl += amountMl;
  appState.user.xp += 25;
  saveState();
}

function copyMySquadCode() {
  const code = appState.user.mySquadCode || appState.user.squadCode || 'DAMN-8K2P91';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      alert(`Copied Squad Code: ${code} to clipboard! Share with friends to build your squad! 🚀`);
    }).catch(() => {
      prompt("Your Squad Code:", code);
    });
  } else {
    prompt("Your Squad Code:", code);
  }
}

function handleJoinSquad() {
  const input = document.getElementById('inpJoinSquadCode');
  if (!input) return;
  const code = input.value.trim();
  if (!code) {
    alert("Please enter a squad code!");
    return;
  }
  if (typeof joinSquad === 'function') {
    joinSquad(code).then(success => {
      if (success) input.value = '';
    });
  }
}

function refreshSquad() {
  if (typeof loadAllJoinedSquads === 'function') {
    loadAllJoinedSquads().then(() => renderApp());
  }
}

// ==================== SQUAD LIST ====================
function renderSquadUI() {
  const codeEl = document.getElementById('mySquadCodeDisplay');
  if (codeEl) {
    codeEl.innerText = appState.user.mySquadCode || appState.user.squadCode || 'DAMN-8K2P91';
  }

  const countEl = document.getElementById('lblJoinedSquadsCount');
  if (countEl) {
    const joinedCount = (appState.user.joinedSquads || [appState.user.mySquadCode]).filter(Boolean).length;
    countEl.innerText = `Joined ${joinedCount}/5`;
  }

  renderSquadList();
}

function renderSquadList() {
  const container = document.getElementById('squadMembersList');
  if (!container) return;

  if (!appState.squadMembers || appState.squadMembers.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.85rem;">Join a squad to see live member progress</p>`;
    return;
  }

  let html = '';
  appState.squadMembers.forEach((member, idx) => {
    const rankNum = idx + 1;
    const rankColor = rankNum === 1 ? '#FF4757' : (rankNum === 2 ? '#141416' : '#FFA502');
    const rankBadge = `#${rankNum}`;
    
    html += `
      <div class="squad-user-row" onclick="openMemberProfileModal('${member.uid}')" style="cursor: pointer; transition: transform 0.2s ease;" title="Click to view ${member.name}'s profile">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="glass-pill" style="font-weight: 800; font-size: 0.85rem; padding: 0.25rem 0.6rem; background: ${rankColor}; color: #FFFFFF;">
            ${rankBadge}
          </div>
          <div class="avatar-badge" style="background: ${member.isUser ? '#10B981' : rankColor}">
            ${member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">${member.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-sub); font-weight: 600;">LVL ${member.level || 1} • Squad: ${member.squadCode || 'Active'}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="text-align: right;">
            <div class="font-mono" style="font-weight: 800; font-size: 1.15rem; color: var(--text-main);">${member.completionPct}%</div>
            <div style="font-size: 0.68rem; color: var(--text-sub); font-weight: 700; text-transform: uppercase;">Exec</div>
          </div>
          <div class="glass-pill font-mono" style="padding: 0.3rem 0.6rem; font-weight: 700;">
            🔥 ${member.streak}d
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openMemberProfileModal(memberUid) {
  const member = (appState.squadMembers || []).find(m => m.uid === memberUid);
  if (!member) return;

  // Find member rank position in squad
  const rankIdx = appState.squadMembers.findIndex(m => m.uid === memberUid);
  const squadRankText = rankIdx >= 0 ? `#${rankIdx + 1} in Squad` : `#1 in Squad`;

  const elAvatar = document.getElementById('memberModalAvatar');
  const elName = document.getElementById('memberModalName');
  const elRankTitle = document.getElementById('memberModalRankTitle');
  const elStreak = document.getElementById('memberModalStreak');
  const elExec = document.getElementById('memberModalExec');
  const elLockIn = document.getElementById('memberModalLockIn');
  const elXp = document.getElementById('memberModalXp');
  const elSquadRank = document.getElementById('memberModalSquadRank');
  const elGoal = document.getElementById('memberModalGoal');
  const elWorkout = document.getElementById('memberModalWorkout');
  const elStatus = document.getElementById('memberModalStatus');

  const cleanName = member.rawName || member.name.replace(' (You)', '');

  if (elAvatar) elAvatar.innerText = cleanName.charAt(0).toUpperCase();
  if (elName) elName.innerText = cleanName;
  if (elRankTitle) elRankTitle.innerText = `LVL ${member.level || 1} • SQUAD MEMBER`;
  if (elStreak) elStreak.innerText = `🔥 ${member.streak || 0}d`;
  if (elExec) elExec.innerText = `${member.completionPct || 0}%`;
  if (elLockIn) elLockIn.innerText = `${member.dayTotal || 60} Days`;
  if (elXp) elXp.innerText = `${(member.xp || 0).toLocaleString()} XP`;
  if (elSquadRank) elSquadRank.innerText = squadRankText;
  if (elGoal) elGoal.innerText = member.fitnessGoal || "Fat Loss & Shred";
  if (elWorkout) elWorkout.innerText = `${member.workoutLocation || 'Gym'} • ${member.workoutType || 'Push/Pull/Legs'}`;
  if (elStatus) elStatus.innerText = member.status || "Active Now";

  const modal = document.getElementById('modalMemberProfile');
  if (modal) modal.classList.add('open');
}

function closeMemberProfileModal() {
  const modal = document.getElementById('modalMemberProfile');
  if (modal) modal.classList.remove('open');
}

window.openMemberProfileModal = openMemberProfileModal;
window.closeMemberProfileModal = closeMemberProfileModal;

// ==================== WORKOUT ====================
function renderWorkout() {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const realToday = daysOfWeek[new Date().getDay()];

  if (!appState.workoutSplit) appState.workoutSplit = { activeDay: realToday, days: {} };

  if (!appState.workoutSplit.userSelectedDay) {
    appState.workoutSplit.activeDay = realToday;
  }

  const activeDay = appState.workoutSplit.activeDay || realToday;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  let navHtml = '';
  days.forEach(d => {
    const isActive = d === activeDay;
    const isRealToday = d === realToday;
    const badgeText = isRealToday ? `${d.slice(0,3)} 🔥` : d.slice(0,3);
    navHtml += `<button class="day-btn ${isActive ? 'active' : ''}" onclick="setActiveWorkoutDay('${d}')">${badgeText}</button>`;
  });
  const navContainer = document.getElementById('workoutDaysNav');
  if (navContainer) navContainer.innerHTML = navHtml;

  const dayData = appState.workoutSplit?.days?.[activeDay] || { focus: "Workout Protocol", exercises: [] };
  const titleContainer = document.getElementById('workoutDayTitle');
  if (titleContainer) {
    const rawFocus = dayData.focus || 'Workout';
    const cleanFocus = rawFocus.split('(')[0].trim();
    titleContainer.innerText = `${activeDay} • ${cleanFocus}`;
  }

  let exHtml = '';
  if (!dayData.exercises || dayData.exercises.length === 0) {
    exHtml = `<p style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.85rem;">No exercises scheduled for ${activeDay}</p>`;
  } else {
    dayData.exercises.forEach(ex => {
      exHtml += `
        <div class="task-item ${ex.completed ? 'completed' : ''}" onclick="toggleExercise('${activeDay}', '${ex.id}', event)">
          <div class="task-left">
            <input type="checkbox" class="chk-custom" ${ex.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleExercise('${activeDay}', '${ex.id}', event)">
            <span class="task-title">${ex.name}</span>
          </div>
          <span class="glass-pill font-mono">${ex.reps} (+100 XP)</span>
        </div>
      `;
    });
  }
  const listContainer = document.getElementById('exercisesList');
  if (listContainer) listContainer.innerHTML = exHtml;
}

function setActiveWorkoutDay(day) {
  if (!appState.workoutSplit) appState.workoutSplit = { days: {} };
  appState.workoutSplit.userSelectedDay = true;
  appState.workoutSplit.activeDay = day;
  saveState();
  renderWorkout();
}

function toggleExercise(day, exId, event) {
  const ex = appState.workoutSplit.days[day]?.exercises.find(e => e.id === exId);
  if (ex) {
    ex.completed = !ex.completed;
    if (ex.completed) {
      appState.user.xp += 100;
      triggerFloatingXp(event, '+100 XP');
    }
    saveState();
  }
}

// ==================== SUPPLEMENTS ====================
function renderSupplements() {
  const container = document.getElementById('supplementsGrid');
  if (!container) return;

  if (!appState.supplements || appState.supplements.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.85rem;">No supplements tracked</p>`;
    return;
  }

  let html = '';
  appState.supplements.forEach(supp => {
    html += `
      <div class="glass-card supp-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 0.9rem;">${supp.name}</span>
          <span class="glass-pill" style="font-size: 0.68rem;">Stock</span>
        </div>
        <div class="supp-qty">${supp.quantity} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${supp.unit}</span></div>
        <button class="btn btn-secondary" style="padding: 0.35rem; font-size: 0.75rem;" onclick="refillSupp('${supp.key}')">+30 Refill</button>
      </div>
    `;
  });
  container.innerHTML = html;
}

function refillSupp(key) {
  const supp = appState.supplements.find(s => s.key === key);
  if (supp) {
    supp.quantity += 30;
    saveState();
  }
}

// ==================== HISTORY ====================
function renderHistoryTable() {
  let html = '';
  (appState.historicalLogs || []).forEach(log => {
    html += `
      <tr>
        <td class="font-mono" style="font-weight: 700;">${log.day}</td>
        <td>${log.date}</td>
        <td class="text-emerald font-mono">${log.completionPct}%</td>
        <td class="text-violet font-mono">${log.recoveryScore}</td>
        <td class="font-mono">${log.weight} kg</td>
      </tr>
    `;
  });
  const container = document.getElementById('historyTableBody');
  if (container) container.innerHTML = html;
}

// ==================== LOCK-IN MODAL ====================
function openLockInModal() {
  const modal = document.getElementById('modalLockInSetup');
  if (modal) modal.classList.add('open');
  // Pre-fill current values
  const inpName = document.getElementById('inpLockInName');
  if (inpName) inpName.value = appState.user.name || '';
  const inpWeight = document.getElementById('inpLockInTargetWeight');
  if (inpWeight) inpWeight.value = appState.user.targetWeight || '';
}

function closeLockInModal() {
  const modal = document.getElementById('modalLockInSetup');
  if (modal) modal.classList.remove('open');
}

function selectLockInDays(days) {
  appState.selectedLockInDaysTemp = days;
  document.querySelectorAll('.btn-lockin-opt').forEach(opt => opt.classList.remove('selected'));
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('selected');
  }
}

function confirmLockInSetup() {
  const inpName = document.getElementById('inpLockInName');
  const inpTargetW = document.getElementById('inpLockInTargetWeight');

  const name = inpName ? inpName.value.trim() : '';
  const targetWeight = inpTargetW ? parseFloat(inpTargetW.value) : NaN;

  if (name) appState.user.name = name;
  if (!isNaN(targetWeight)) appState.user.targetWeight = targetWeight;
  if (appState.selectedLockInDaysTemp) appState.user.dayTotal = appState.selectedLockInDaysTemp;

  closeLockInModal();
  saveState();

  if (window.confetti) {
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
  }
}

// ==================== FINISH TODAY ====================
function openFinishModal() {
  const pct = getTodayPct();
  const recovery = getRecoveryScore();
  
  const elPct = document.getElementById('modalPct');
  if (elPct) elPct.innerText = `${pct}%`;

  const elRec = document.getElementById('modalRecovery');
  if (elRec) elRec.innerText = recovery;

  const missed = [];
  Object.values(appState.dailyTasks).forEach(sec => {
    sec.forEach(t => { if (!t.completed) missed.push(t.label); });
  });

  const elTitle = document.getElementById('modalMissedTitle');
  const elText = document.getElementById('modalMissedText');

  if (missed.length > 0) {
    if (elTitle) elTitle.innerText = `${missed.length} Missed`;
    if (elText) elText.innerText = missed.join(', ');
  } else {
    if (elTitle) elTitle.innerText = `Flawless!`;
    if (elText) elText.innerText = `All tasks completed.`;
  }

  const modal = document.getElementById('modalFinish');
  if (modal) modal.classList.add('open');
}

function closeFinishModal() {
  const modal = document.getElementById('modalFinish');
  if (modal) modal.classList.remove('open');
}

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function checkMidnightAutoFinish() {
  if (!appState || !appState.user) return;

  const todayStr = getLocalDateString();

  if (!appState.lastActiveDate) {
    appState.lastActiveDate = todayStr;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch (e) {}
    return;
  }

  // Check if date changed (new calendar day!)
  if (appState.lastActiveDate !== todayStr) {
    const prevDate = appState.lastActiveDate;
    const pct = getTodayPct();
    const recovery = getRecoveryScore();

    const autoLog = {
      day: `Day ${String(appState.user.dayCurrent).padStart(2, '0')}`,
      date: prevDate,
      completionPct: pct,
      recoveryScore: recovery,
      weight: appState.user.currentWeight,
      autoVerified: true
    };

    if (!Array.isArray(appState.historicalLogs)) appState.historicalLogs = [];
    appState.historicalLogs.unshift(autoLog);

    if (pct >= 50) {
      appState.user.currentStreak += 1;
      appState.user.xp += Math.round(300 * (pct / 100));
    } else if (pct > 0) {
      appState.user.xp += Math.round(150 * (pct / 100));
    }

    appState.user.dayCurrent += 1;
    appState.user.waterCurrentMl = 0;

    if (appState.dailyTasks) {
      Object.values(appState.dailyTasks).forEach(sec => {
        sec.forEach(t => { t.completed = false; });
      });
    }

    if (appState.workoutSplit && appState.workoutSplit.days) {
      Object.values(appState.workoutSplit.days).forEach(d => {
        if (d.exercises) d.exercises.forEach(e => { e.completed = false; });
      });
    }

    appState.lastActiveDate = todayStr;
    saveState();

    setTimeout(() => {
      if (typeof addChatMessage === 'function') {
        addChatMessage('assistant', `⚡ **DAMN Midnight Auto-Pilot Audit**: Yesterday (${prevDate}) was automatically verified and logged! Protocol is now on Day ${appState.user.dayCurrent}. Let's lock in today! 💪`, true);
      }
    }, 1500);
  }
}

function confirmFinishToday() {
  if (window.confetti) {
    confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
  }

  const todayStr = getLocalDateString();
  const todayLog = {
    day: `Day ${String(appState.user.dayCurrent).padStart(2, '0')}`,
    date: todayStr,
    completionPct: getTodayPct(),
    recoveryScore: getRecoveryScore(),
    weight: appState.user.currentWeight
  };

  Object.values(appState.dailyTasks).forEach(sec => {
    sec.forEach(t => { t.completed = false; });
  });

  appState.user.dayCurrent += 1;
  appState.user.currentStreak += 1;
  appState.user.waterCurrentMl = 0;
  appState.user.xp += 300;
  if (!Array.isArray(appState.historicalLogs)) appState.historicalLogs = [];
  appState.historicalLogs.unshift(todayLog);
  appState.lastActiveDate = todayStr;

  closeFinishModal();
  saveState();
}

// ==================== ZOMATO / BLINKIT STYLE SMART NOTIFICATIONS ====================

function showInAppNotificationToast(title, body) {
  let toastContainer = document.getElementById('damnSmartToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'damnSmartToastContainer';
    toastContainer.className = 'damn-smart-toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'damn-smart-toast';
  toast.innerHTML = `
    <div class="damn-toast-icon">
      <img src="Damn.png" alt="DAMN" style="width: 24px; height: 24px; border-radius: 6px;">
    </div>
    <div class="damn-toast-content">
      <div class="damn-toast-title">${title}</div>
      <div class="damn-toast-body">${body}</div>
    </div>
    <button class="damn-toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => { toast.remove(); }, 400);
  }, 6000);
}

function sendSmartNotification(title, body, tag = 'damn-alert') {
  showInAppNotificationToast(title, body);

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: body,
            icon: 'Damn.png',
            badge: 'Damn.png',
            tag: tag,
            vibrate: [200, 100, 200]
          });
        });
      } else {
        new Notification(title, {
          body: body,
          icon: 'Damn.png',
          tag: tag,
          vibrate: [200, 100, 200]
        });
      }
    } catch (e) {
      console.warn('Native notification notice:', e);
    }
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showInAppNotificationToast("DAMN AI Alerts", "Browser push notifications not supported, but in-app smart alerts are active! ⚡");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (appState) appState.notificationsEnabled = true;
      saveState();
      sendSmartNotification("DAMN AI • Smart Alerts Active 🔥", `Yo ${appState.user?.name || 'bro'}! I'll remind you when to eat, drink water & train like a close friend!`);
    } else {
      showInAppNotificationToast("DAMN AI Alerts", "Notifications blocked in browser. In-app alerts will still guide you! ⚡");
    }
  } catch (e) {
    console.warn("Notification permission error:", e);
  }
}

function checkChronoSmartNotifications() {
  if (!appState || !appState.user || !appState.user.onboardingCompleted) return;

  const now = new Date();
  const hours = now.getHours();
  const todayStr = getLocalDateString();
  const userName = appState.user.name || "bro";

  if (!appState.sentAlerts) appState.sentAlerts = {};
  if (!appState.sentAlerts[todayStr]) appState.sentAlerts[todayStr] = [];

  const sentToday = appState.sentAlerts[todayStr];

  const fireAlert = (slotTag, title, body) => {
    if (!sentToday.includes(slotTag)) {
      sentToday.push(slotTag);
      saveState();
      sendSmartNotification(title, body, slotTag);
    }
  };

  // 1. Morning Boosters & Sunlight Check (8:00 AM - 9:30 AM)
  if (hours >= 8 && hours < 10) {
    const morningPending = (appState.dailyTasks?.morning || []).filter(t => !t.completed);
    if (morningPending.length > 0) {
      fireAlert('morning', `DAMN • Morning Audit ☀️`, `Yo ${userName}! ☀️ Did you get sunlight & drink water yet or still in bed? Tap to check off!`);
    }
  }

  // 2. Breakfast & Multivitamin Check (10:00 AM - 11:30 AM)
  if (hours >= 10 && hours < 12) {
    const bPending = (appState.dailyTasks?.breakfast || []).filter(t => !t.completed);
    if (bPending.length > 0) {
      fireAlert('breakfast', `DAMN • Breakfast & Vitamins 🍳`, `Bro ${userName}! 🍳 Did you eat breakfast & take multivitamin or forgot to mark it? Don't skip!`);
    }
  }

  // 3. Lunch & Gainz Check (1:30 PM - 3:30 PM)
  if (hours >= 13 && hours < 16) {
    const lPending = (appState.dailyTasks?.lunch || []).filter(t => !t.completed);
    if (lPending.length > 0) {
      fireAlert('lunch', `DAMN • Lunch & Gainz Check 🍗`, `Bro it's 2 PM! 🍗 Don't let your gainz fade — did you finish lunch & fish oil or what?`);
    }
  }

  // 4. Hydration Warning (4:30 PM - 6:00 PM)
  if (hours >= 16 && hours < 18) {
    const target = appState.user.waterGoalMl || 3500;
    const current = appState.user.waterCurrentMl || 0;
    if (current < target * 0.5) {
      fireAlert('hydration', `DAMN • Hydration Alert 💧`, `Hydration alert! 💧 Bro you're at only ${current}ml / ${target}ml! Drink a big glass right now, don't dry up!`);
    }
  }

  // 5. Workout Hype Audit (6:30 PM - 8:30 PM)
  if (hours >= 18 && hours < 21) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const realToday = daysOfWeek[now.getDay()];
    const activeDay = appState.workoutSplit?.activeDay || realToday;
    const exercises = appState.workoutSplit?.days?.[activeDay]?.exercises || [];
    const pendingEx = exercises.filter(e => !e.completed);
    if (pendingEx.length > 0) {
      fireAlert('workout', `DAMN • Gym Time 💪`, `Yo ${userName}! Today's ${activeDay} session has ${pendingEx.length} exercises left! Get off the couch & lock in 🔥`);
    }
  }

  // 6. Dinner & Skincare Audit (9:00 PM - 10:30 PM)
  if (hours >= 21 && hours < 23) {
    const ePending = (appState.dailyTasks?.evening || []).concat(appState.dailyTasks?.night || []).filter(t => !t.completed);
    if (ePending.length > 0) {
      fireAlert('dinner', `DAMN • Dinner & Night Protocol 🌙`, `Night check ${userName}! 🌙 Mark your dinner & biotin so we can auto-lock today's score!`);
    }
  }

  // 7. Sleep Reminder (11:00 PM - 11:45 PM)
  if (hours === 23 && now.getMinutes() < 50) {
    fireAlert('sleep', `DAMN • Sleep Protocol 😴`, `Put the phone down bro! 😴 Sleep before 12 to recover like a god & keep that streak 🔥`);
  }
}

window.requestNotificationPermission = requestNotificationPermission;
window.sendSmartNotification = sendSmartNotification;

function switchTab(tabId, save = true) {
  if (!tabId) return;
  if (save && appState) {
    appState.activeTab = tabId;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {}
  }

  document.querySelectorAll('.dock-item, .nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  
  const targetId = (tabId === 'home' || tabId === 'dashboard') ? 'tab-dashboard' : `tab-${tabId}`;
  const targetPage = document.getElementById(targetId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  const activeBtns = document.querySelectorAll(`.dock-item[data-tab="${tabId}"], .nav-item[data-tab="${tabId}"]`);
  activeBtns.forEach(b => b.classList.add('active'));

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchTab = switchTab;

// ==================== NAVIGATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Tab navigation
  document.querySelectorAll('.dock-item, .nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  // Header Squad Button
  const btnHeaderSquad = document.getElementById('btnHeaderSquad');
  if (btnHeaderSquad) {
    btnHeaderSquad.addEventListener('click', () => switchTab('squad'));
  }

  // Finish Today Button
  const btnFinish = document.getElementById('btnFinishToday');
  if (btnFinish) {
    btnFinish.addEventListener('click', openFinishModal);
  }

  // Modal Overlay Backdrop Clicks & Escape Key
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('open'));
    }
  });

  // Restore saved active tab position if appState has one
  if (appState && appState.activeTab) {
    switchTab(appState.activeTab, false);
  }

  // Boot: use Firebase auth if available, else offline mode
  if (typeof bootApp === 'function') {
    bootApp();
  } else {
    renderApp();
  }

  // Register Service Worker for Chrome PWA Installation
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }

  // Periodic Midnight Auto-Pilot & Smart Notification Check (runs every 30 seconds)
  setInterval(() => {
    checkMidnightAutoFinish();
    checkChronoSmartNotifications();
  }, 30000);
});
