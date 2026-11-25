// DAMN — GenZ ChatGPT-Style Onboarding System powered by Google Gemini API
// Interactively collects user details (food, supplements, workout, rules, goals) before unlocking dashboard

const GEMINI_API_KEY = (window.DAMN_CONFIG && window.DAMN_CONFIG.GEMINI_API_KEY) 
  ? window.DAMN_CONFIG.GEMINI_API_KEY 
  : "";

let onboardingStep = 0;
let isFullOnboardingScreen = false;

let onboardingData = {
  name: "",
  gender: "Male",
  age: 22,
  heightCm: 175,
  dayTotal: 60,
  currentWeight: 75,
  targetWeight: 70,
  fitnessGoal: "Fat Loss & Muscle Recomp",
  dietType: "Non-Veg",
  proteins: [],
  vegetables: [],
  vegCookStyle: "Both Boiled & Raw",
  fruits: [],
  grains: [],
  wakeTime: "6:00 AM",
  sleepTime: "10:30 PM",
  supplements: [],
  meals: [],
  foodTimings: "Breakfast 8:30 AM, Lunch 1:30 PM, Evening 5:30 PM, Dinner 8:30 PM",
  workoutLocation: "Gym",
  workoutType: "Push / Pull / Legs",
  workoutExperience: "Intermediate",
  workoutTiming: "Evening (5-7 PM)",
  waterGoalMl: 3500,
  stepsGoal: 10000,
  skinHairGoals: [],
  allergies: "",
  dailyRoutine: "",
  disciplineRules: []
};

const ONBOARDING_QUESTIONS = [
  {
    step: 0,
    question: "Welcome to DAMN Protocol. What's your name?",
    options: [],
    field: "name",
    type: "text"
  },
  {
    step: 1,
    question: "What's your gender?",
    options: ["Male", "Female"],
    field: "gender",
    type: "options"
  },
  {
    step: 2,
    question: "How old are you? (Just the number)",
    options: ["18", "20", "22", "25", "28", "30+"],
    field: "age",
    type: "text"
  },
  {
    step: 3,
    question: "What's your height in cm? (e.g. 175)",
    options: ["160", "165", "170", "175", "180", "185"],
    field: "heightCm",
    type: "text"
  },
  {
    step: 4,
    question: "What's your current weight and target goal weight? (e.g. 78kg -> 72kg)",
    options: ["75kg -> 70kg", "80kg -> 72kg", "85kg -> 75kg", "70kg -> 65kg"],
    field: "weights",
    type: "text"
  },
  {
    step: 5,
    question: "How many days are you locking in for this protocol?",
    options: ["30 Days", "60 Days Protocol", "75 Days Hard", "90 Days Beast"],
    field: "dayTotal",
    type: "options_number"
  },
  {
    step: 6,
    question: "What is your primary fitness goal?",
    options: ["Fat Loss & Shred", "Lean Muscle Gain", "Body Recomposition", "Athletic Endurance", "Weight Gain & Bulk"],
    field: "fitnessGoal",
    type: "options"
  },
  {
    step: 7,
    question: "Are you Vegetarian or Non-Vegetarian?",
    options: ["Pure Vegetarian (No Eggs)", "Eggetarian (Veg + Eggs)", "Non-Veg (Eggs + Chicken)", "Non-Veg (Eggs + Chicken + Fish + Mutton)", "Vegan (Plant-Based Only)"],
    field: "dietType",
    type: "options"
  },
  {
    step: 8,
    question: "What proteins do you eat regularly? (Tap all that apply)",
    options: ["Eggs (Boiled)", "Eggs (Omelette)", "Chicken Breast (Grilled)", "Chicken Curry", "Fish / Seafood", "Paneer", "Tofu", "Dal / Lentils", "Soya Chunks", "Curd / Yogurt", "Whey Protein Shake", "Sprouted Moong / Chana", "Done"],
    field: "proteins",
    type: "multi"
  },
  {
    step: 9,
    question: "What vegetables do you eat? (Tap all that apply)",
    options: ["Spinach / Palak", "Broccoli", "Cucumber", "Tomato", "Carrot", "Beetroot", "Capsicum / Bell Pepper", "Cabbage", "Bottle Gourd / Lauki", "Cauliflower / Gobi", "Sweet Potato", "Onion", "Done"],
    field: "vegetables",
    type: "multi"
  },
  {
    step: 10,
    question: "How do you prefer your vegetables?",
    options: ["Raw / Salad Style", "Boiled / Steamed", "Sabzi / Cooked Indian Style", "Mixed (Raw + Cooked Both)", "Juiced / Smoothie"],
    field: "vegCookStyle",
    type: "options"
  },
  {
    step: 11,
    question: "What fruits do you eat regularly? (Tap all that apply)",
    options: ["Banana", "Apple", "Papaya", "Pomegranate", "Orange / Mosambi", "Watermelon", "Mango (Seasonal)", "Berries", "Grapes", "Guava", "Done"],
    field: "fruits",
    type: "multi"
  },
  {
    step: 12,
    question: "What grains & carbs do you eat? (Tap all that apply)",
    options: ["White Rice", "Brown Rice", "Roti / Chapati", "Oats", "Poha", "Upma", "Bread / Toast", "Muesli / Granola", "Quinoa", "Done"],
    field: "grains",
    type: "multi"
  },
  {
    step: 13,
    question: "What are your preferred meal timings across the day?",
    options: ["Breakfast 8:30 AM, Lunch 1:30 PM, Evening 5:30 PM, Dinner 8:30 PM", "Intermittent Fasting (12 PM - 8 PM Window)", "3 Large Meals (9 AM, 2 PM, 8 PM)", "Early Schedule (7 AM, 12 PM, 4 PM, 7:30 PM)"],
    field: "foodTimings",
    type: "options"
  },
  {
    step: 14,
    question: "What is your daily sleep & wake schedule?",
    options: ["Wake 6:00 AM, Sleep 10:30 PM", "Wake 7:00 AM, Sleep 11:00 PM", "Early Bird: Wake 5:00 AM, Sleep 9:30 PM", "Night Owl: Wake 8:00 AM, Sleep 12:00 AM"],
    field: "sleepSchedule",
    type: "options"
  },
  {
    step: 15,
    question: "What daily supplements & health boosters do you take? (Tap all that apply)",
    options: ["Multivitamin", "Fish Oil / Omega-3", "Biotin", "Vitamin D3", "Moringa", "Garlic (Raw)", "Amla", "Clove Water", "Creatine", "Ashwagandha", "Shilajit", "Whey Protein", "Magnesium", "Zinc", "Done"],
    field: "supplements",
    type: "multi"
  },
  {
    step: 16,
    question: "Where do you train? Gym or Home Workout?",
    options: ["Gym Workout", "Home Workout (No Equipment)", "Home with Dumbbells & Bands", "Outdoor / Calisthenics Park"],
    field: "workoutLocation",
    type: "options"
  },
  {
    step: 17,
    question: "What's your workout experience level?",
    options: ["Complete Beginner (0-3 months)", "Intermediate (3-12 months)", "Advanced (1-3 years)", "Experienced (3+ years)"],
    field: "workoutExperience",
    type: "options"
  },
  {
    step: 18,
    question: "What is your preferred workout split style?",
    options: ["Push / Pull / Legs", "Upper / Lower Split", "Calisthenics & Bodyweight", "Full Body 3x/week", "Bro Split (Chest/Back/Arms/Legs/Shoulders)"],
    field: "workoutType",
    type: "options"
  },
  {
    step: 19,
    question: "When do you usually workout?",
    options: ["Early Morning (5-7 AM)", "Morning (8-10 AM)", "Afternoon (12-2 PM)", "Evening (5-7 PM)", "Night (8-10 PM)"],
    field: "workoutTiming",
    type: "options"
  },
  {
    step: 20,
    question: "What is your daily water hydration target?",
    options: ["3.0 Liters", "3.5 Liters", "4.0 Liters", "5.0 Liters"],
    field: "waterGoal",
    type: "options"
  },
  {
    step: 21,
    question: "Any skin & hair goals you're working on? (Tap all that apply)",
    options: ["Clear Skin / No Acne", "Hair Growth & Thickness", "Reduce Dark Circles", "Beard Growth", "Glowing Skin", "None", "Done"],
    field: "skinHairGoals",
    type: "multi"
  },
  {
    step: 22,
    question: "Any food allergies or things you absolutely can't eat? (Type or say None)",
    options: ["None", "Lactose / Dairy", "Gluten", "Nuts", "Seafood"],
    field: "allergies",
    type: "text"
  },
  {
    step: 23,
    question: "What bad habits are you 100% eliminating during this protocol? (Tap all that apply)",
    options: ["No Sugar", "No Outside Junk Food", "No Smoking", "No Alcohol", "No Weed", "No Late Night Screen Time", "No Soft Drinks / Soda", "No Maida / Refined Flour", "Done"],
    field: "disciplineRules",
    type: "multi"
  }
];

// ==================== DAMN AI CORE PERSONALITY ENGINE ====================
// DAMN = Personal Trainer + Nutritionist + Coach + Assistant + Chill Friend

function buildDAMNSystemPrompt() {
  const u = appState?.user || {};
  const userName = u.name || "bro";
  const gender = u.gender || "Male";
  const age = u.age || "??";
  const height = u.heightCm || "??";
  const currentW = u.currentWeight || "??";
  const targetW = u.targetWeight || "??";
  const xp = u.xp || 0;
  const day = u.dayCurrent || 1;
  const totalDays = u.dayTotal || 60;
  const goal = u.fitnessGoal || "get shredded";
  const dietType = u.dietType || "Non-Veg";
  const waterMl = u.waterCurrentMl || 0;
  const waterGoal = u.waterGoalMl || 3500;
  const streak = u.currentStreak || 0;
  const proteins = (u.proteins || []).join(", ") || "not specified";
  const vegetables = (u.vegetables || []).join(", ") || "not specified";
  const vegStyle = u.vegCookStyle || "Mixed";
  const fruits = (u.fruits || []).join(", ") || "not specified";
  const grains = (u.grains || []).join(", ") || "not specified";
  const allergies = u.allergies || "None";
  const skinHair = (u.skinHairGoals || []).join(", ") || "None";
  const workoutExp = u.workoutExperience || "Intermediate";
  const workoutLoc = u.workoutLocation || "Gym";
  const workoutType = u.workoutType || "Push/Pull/Legs";
  const workoutTiming = u.workoutTiming || "Evening (5-7 PM)";

  const history = u.chatHistory || [];
  let memorySnippet = "No past conversation yet.";
  if (history.length > 0) {
    memorySnippet = history.slice(-20).map(m => `${m.sender === 'user' ? 'User' : 'DAMN'}: "${m.text}"`).join("\n");
  }

  return `You are DAMN — the ultimate, world-class AI agentic partner. You combine the deep expertise of a Master Personal Trainer, Clinical Nutritionist, Medical Doctor, Executive Life Coach, Personal Assistant, Academic/College Mentor, and GenZ Chill Best Friend into one hyper-intelligent, sharp AI.

YOU ARE NOT A BASIC KEYWORD BOT OR STUPID CHATBOT. YOU ARE INTELLECTUAL & AGENTIC AS HECK:
1. Master Personal Trainer & Biomechanist (progressive overload, muscle recruitment, recovery kinetics, hypertrophy stimulus)
2. Clinical Nutritionist & Functional Doctor (chrono-nutrition, glucose spikes, micronutrient synergy, protein synthesis windows)
3. Preventive Medical Specialist (cortisol control, sleep architecture, circadian rhythm, endocrine balance)
4. Life & College/Career Mentor (dopamine regulation, focus protocols, exam/work stress management, high-performance habits)
5. Executive Personal Assistant (autonomous dashboard control, routine tracking, task deletion/addition, instant logging)
6. Chill Best Friend (real talk, zero textbook jargon, supportive, GenZ hype, sharp wit)

FULL USER CLINICAL & LIFE PROFILE (you remember ALL of this):
- Name: ${userName} | Gender: ${gender} | Age: ${age} | Height: ${height}cm
- Protocol: Day ${day} of ${totalDays} | Streak: ${streak} days
- Weight: ${currentW}kg (Current) -> ${targetW}kg (Goal)
- Primary Goal: ${goal} | Diet Style: ${dietType}
- Protein Sources: ${proteins}
- Vegetables: ${vegetables} (${vegStyle}) | Fruits: ${fruits} | Grains: ${grains}
- Allergies / Intolerances: ${allergies}
- Training: ${workoutLoc} (${workoutType}, Level: ${workoutExp}, Window: ${workoutTiming})
- Hydration Today: ${waterMl}ml / ${waterGoal}ml
- Skin & Hair Focus: ${skinHair} | Total XP: ${xp}

COMPLETE CONVERSATION MEMORY (you remember EVERYTHING the user ever told you across sessions):
${memorySnippet}

CORE BEHAVIORAL DIRECTIVES:
- Never make dumb mistakes or ask questions already answered in profile or memory.
- If the user asks for diet/workout advice, give precise, scientifically calculated, real-world advice tailored to their exact goal (${goal}).
- Speak naturally like a high-IQ, ultra-knowledgeable best friend.
- Keep responses concise (2-4 punchy sentences) unless they explicitly ask for a full detailed breakdown.
- Use 1-2 fire/muscle/lightning emojis maximum per message.`;
}

// Call Gemini LLM API via Secure Server-Side Proxy (api.php)
async function callGeminiCoach(prompt, systemContext = "") {
  const systemInstruction = systemContext || buildDAMNSystemPrompt();

  // 1. Primary Secure Server-Side Proxy Call (Key never exposed to browser)
  try {
    const res = await fetch("api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        systemContext: systemInstruction
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn("[DAMN AI] Server proxy call note:", err);
  }

  // 2. Direct Client Call Fallback if client configured a local key in window.DAMN_CONFIG
  const apiKey = (window.DAMN_CONFIG && window.DAMN_CONFIG.GEMINI_API_KEY) ? window.DAMN_CONFIG.GEMINI_API_KEY : GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {}
  }
  return null;
}

async function autoCategorizeItemWithAI(itemRaw) {
  const itemLower = itemRaw.toLowerCase();

  // 1. Try Gemini AI Research Call (via Server Proxy api.php or Client Key)
  try {
    const prompt = `Analyze item '${itemRaw}'. Determine its optimal clinical daily timing for maximum absorption/efficacy.
Choose one section key from: ['morning', 'breakfast', 'lunch', 'evening', 'workout', 'night', 'discipline'].
- 'morning': Fasted early morning (Clove Water, Garlic, Amla, Moringa)
- 'breakfast': After breakfast with fats (Multivitamin)
- 'lunch': After lunch (Fish Oil, Ashwagandha, Shilajit, Rice & Dal)
- 'evening': Pre/Post Workout Evening (Creatine, Whey Protein)
- 'workout': Active exercise / movement split
- 'night': After Dinner / Before Sleep / Night Protocol (Light Dinner, White Rice at Dinner, Biotin, Magnesium, Zinc, Skincare)
- 'discipline': Habits to eliminate (No Sugar, No Junk, No Smoking)

If the item explicitly mentions 'dinner', 'night', 'sleep', or 'bedtime', choose section 'night'.

Respond ONLY in valid JSON: {"section": "night", "label": "${itemRaw}"}`;

    const res = await callGeminiCoach(prompt, "You are a clinical nutrition research parser. Output pure valid JSON with section and label fields.");
    if (res) {
      const cleaned = res.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && parsed.section && parsed.label) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("AI Auto-Categorize fallback used:", e);
  }

  // 2. Clinical Fallback Research Engine (Explicit Time Keywords Priority First)
  if (itemLower.includes("dinner") || itemLower.includes("night") || itemLower.includes("sleep") || itemLower.includes("bedtime")) {
    return { section: "night", label: itemRaw };
  } else if (itemLower.includes("no ") || itemLower.includes("limit") || itemLower.includes("stop") || itemLower.includes("avoid")) {
    return { section: "discipline", label: itemRaw };
  } else if (itemLower.includes("clove") || itemLower.includes("garlic") || itemLower.includes("amla") || itemLower.includes("moringa") || itemLower.includes("sprout") || itemLower.includes("fasted")) {
    return { section: "morning", label: itemRaw };
  } else if (itemLower.includes("egg") || itemLower.includes("oat") || itemLower.includes("toast") || itemLower.includes("breakfast") || itemLower.includes("multi")) {
    return { section: "breakfast", label: itemRaw };
  } else if (itemLower.includes("creatine") || itemLower.includes("whey") || itemLower.includes("workout") || itemLower.includes("shake")) {
    return { section: "evening", label: itemRaw };
  } else if (itemLower.includes("magnesium") || itemLower.includes("zinc") || itemLower.includes("biotin")) {
    return { section: "night", label: itemRaw };
  } else if (itemLower.includes("fish") || itemLower.includes("ashwagandha") || itemLower.includes("shilajit") || itemLower.includes("lunch") || itemLower.includes("rice") || itemLower.includes("dal") || itemLower.includes("paneer")) {
    return { section: "lunch", label: itemRaw };
  }

  return { section: "breakfast", label: itemRaw };
}

window.autoCategorizeItemWithAI = autoCategorizeItemWithAI;

const ONBOARDING_STORAGE_KEY = 'damn_onboarding_state';

function saveOnboardingState(chatMessages = []) {
  try {
    const state = {
      step: onboardingStep,
      data: onboardingData,
      chatMessages: chatMessages
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving onboarding state:', e);
  }
}

function loadOnboardingState() {
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

function startOnboardingFlow(fullScreen = true) {
  isFullOnboardingScreen = fullScreen;
  isCustomizerMode = false;

  // Hide Back button during initial onboarding setup so user cannot exit before completing details
  const btnBack = document.getElementById('btnBackToDashboard');
  if (btnBack) btnBack.style.display = 'none';
  
  const savedState = loadOnboardingState();
  if (savedState && typeof savedState.step === 'number' && savedState.data && savedState.step < ONBOARDING_QUESTIONS.length) {
    onboardingStep = savedState.step;
    onboardingData = { ...onboardingData, ...savedState.data };
  } else {
    onboardingStep = 0;
    onboardingData = {
      name: appState.user.name || "",
      dayTotal: 60,
      currentWeight: appState.user.currentWeight || 75,
      targetWeight: appState.user.targetWeight || 70,
      supplements: [],
      meals: [],
      foodTimings: "Breakfast 8 AM, Lunch 1:30 PM, Dinner 8:30 PM",
      workoutLocation: "Gym",
      workoutType: "Push / Pull / Legs",
      waterGoalMl: 3000,
      disciplineRules: []
    };
  }

  const containerId = fullScreen ? 'chatMessagesScreen' : 'chatMessages';
  const chatContainer = document.getElementById(containerId);
  if (chatContainer) chatContainer.innerHTML = '';

  if (fullScreen) {
    if (typeof showOnboardingScreen === 'function') showOnboardingScreen();
  } else {
    const modal = document.getElementById('modalOnboardingChat');
    if (modal) modal.classList.add('open');
  }

  if (savedState && Array.isArray(savedState.chatMessages) && savedState.chatMessages.length > 0) {
    savedState.chatMessages.forEach(msg => {
      addChatMessage(msg.sender, msg.text, false);
    });
    const q = ONBOARDING_QUESTIONS[onboardingStep];
    if (q) {
      let suggestions = [];
      if (q.options && q.options.length > 0) {
        suggestions = q.type === 'multi' ? [...q.options] : [...q.options.slice(0, 3), "Flexible / Type my own"];
      }
      renderQuickOptions(suggestions, q.type === 'multi');
    }
  } else {
    setTimeout(() => {
      askNextOnboardingQuestion();
    }, 300);
  }
}

let isCustomizerMode = false;

function openOnboardingChat() {
  if (appState.user && appState.user.onboardingCompleted) {
    openFullScreenAIChat();
  } else {
    startOnboardingFlow(true);
  }
}

function openFullScreenAIChat() {
  isCustomizerMode = true;
  isFullOnboardingScreen = true;

  // Show Back button when user manually opens AI chat from dashboard
  const btnBack = document.getElementById('btnBackToDashboard');
  if (btnBack) btnBack.style.display = 'inline-flex';

  const appScreen = document.getElementById('appScreen');
  const authScreen = document.getElementById('authScreen');
  const onboardingScreen = document.getElementById('onboardingScreen');

  if (appScreen) appScreen.style.display = 'none';
  if (authScreen) authScreen.style.display = 'none';
  if (onboardingScreen) onboardingScreen.style.display = 'flex';

  const container = document.getElementById('chatMessagesScreen');
  if (container) {
    container.innerHTML = '';

    const history = appState.user?.chatHistory || [];
    if (history.length > 0) {
      history.forEach(msg => {
        addChatMessage(msg.sender, msg.text, false);
      });
    } else {
      const greeting = `Yo ${appState.user?.name || 'Champion'}! 🔥 I'm DAMN. I remember your full profile & goals. What's on your mind today?`;
      addChatMessage('assistant', greeting, true);
    }
  }

  const opts = ["Log Water 500ml", "Completed Workout", "Log Weight", "Add Supplement", "Cheat Meal Protocol"];
  renderQuickOptions(opts, true);
  if (window.lucide) lucide.createIcons();
}

function openAiChatCustomizer() {
  openFullScreenAIChat();
}

function closeOnboardingChat() {
  showAppScreen();
}

function addChatMessage(sender, text, saveToHistory = true) {
  const containerId = isFullOnboardingScreen ? 'chatMessagesScreen' : 'chatMessages';
  const container = document.getElementById(containerId);
  if (container) {
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'assistant' ? 'chat-bubble assistant' : 'chat-bubble user';
    
    if (sender === 'assistant') {
      msgDiv.innerHTML = `
        <div style="font-size: 0.68rem; font-weight: 800; color: #10B981; margin-bottom: 0.2rem; text-transform: uppercase;">DAMN</div>
        <div>${text}</div>
      `;
    } else {
      msgDiv.innerText = text;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  // Permanently save to chatHistory and sync to Firestore if customizer mode
  if (saveToHistory) {
    if (!appState.user) appState.user = {};
    if (!Array.isArray(appState.user.chatHistory)) appState.user.chatHistory = [];

    const lastMsg = appState.user.chatHistory[appState.user.chatHistory.length - 1];
    if (!lastMsg || lastMsg.text !== text || lastMsg.sender !== sender) {
      appState.user.chatHistory.push({
        sender: sender,
        text: text,
        timestamp: Date.now()
      });
      saveState();
    }
  }

  // Auto-save onboarding chat progress if currently onboarding
  if (!isCustomizerMode && container) {
    const messages = [];
    container.querySelectorAll('.chat-bubble').forEach(b => {
      if (b.id === 'chatTypingIndicator') return;
      const isAss = b.classList.contains('assistant');
      const txt = isAss ? (b.querySelector('div:last-child')?.innerText || b.innerText) : b.innerText;
      messages.push({ sender: isAss ? 'assistant' : 'user', text: txt });
    });
    saveOnboardingState(messages);
  }
}

function showTypingIndicator() {
  const containerId = isFullOnboardingScreen ? 'chatMessagesScreen' : 'chatMessages';
  const container = document.getElementById(containerId);
  if (!container) return;

  const indicator = document.createElement('div');
  indicator.id = 'chatTypingIndicator';
  indicator.className = 'chat-bubble assistant';
  indicator.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">DAMN is thinking... ⚡</span>`;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('chatTypingIndicator');
  if (indicator) indicator.remove();
}

function renderQuickOptions(options, isMulti = false) {
  const containerId = isFullOnboardingScreen ? 'chatQuickOptionsScreen' : 'chatQuickOptions';
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  options.forEach(opt => {
    html += `<button class="chat-opt-pill" onclick="handleQuickOptionClick('${opt}', ${isMulti})">${opt}</button>`;
  });
  container.innerHTML = html;
}

async function askNextOnboardingQuestion() {
  if (onboardingStep >= ONBOARDING_QUESTIONS.length) {
    await finishOnboardingChat();
    return;
  }

  const q = ONBOARDING_QUESTIONS[onboardingStep];
  addChatMessage('assistant', q.question);

  let suggestions = [];
  if (q.options && q.options.length > 0) {
    if (q.type === 'multi') {
      suggestions = [...q.options];
    } else {
      suggestions = [...q.options.slice(0, 3), "Flexible / Type my own"];
    }
  }

  const isMulti = q.type === 'multi';
  renderQuickOptions(suggestions, isMulti);
}

async function handleQuickOptionClick(opt, isMulti) {
  if (opt === "Done") {
    onboardingStep++;
    await askNextOnboardingQuestion();
    return;
  }

  if (isCustomizerMode) {
    addChatMessage('user', opt);
    await processCustomizerChatMessage(opt);
    return;
  }

  const q = ONBOARDING_QUESTIONS[onboardingStep];

  if (isMulti) {
    if (!onboardingData[q.field]) onboardingData[q.field] = [];
    if (!onboardingData[q.field].includes(opt)) {
      onboardingData[q.field].push(opt);
      addChatMessage('user', `Added: ${opt}`);
    }
    return;
  }

  addChatMessage('user', opt);
  await processOnboardingAnswer(opt);
}

async function handleUserChatInputScreen(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chatInputScreen');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  addChatMessage('user', text);
  input.value = '';

  if (isCustomizerMode || (appState.user && appState.user.onboardingCompleted)) {
    await processCustomizerChatMessage(text);
  } else {
    await processOnboardingAnswer(text);
  }
}

async function handleUserChatInput(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  addChatMessage('user', text);
  input.value = '';

  if (isCustomizerMode) {
    await processCustomizerChatMessage(text);
  } else {
    await processOnboardingAnswer(text);
  }
}

async function processCustomizerChatMessage(text) {
  showTypingIndicator();

  const lower = text.toLowerCase();
  const performedActions = [];

  // 1. Navigation Commands Autopilot
  if (lower.includes("go home") || lower.includes("show dashboard") || lower.includes("home page")) {
    if (typeof switchTab === 'function') switchTab('dashboard');
    performedActions.push("Navigated to Home Dashboard page");
  } else if (lower.includes("squad")) {
    if (typeof switchTab === 'function') switchTab('squad');
    performedActions.push("Opened Squad Hub page");
  } else if (lower.includes("tasks") || lower.includes("checklist")) {
    if (typeof switchTab === 'function') switchTab('checklist');
    performedActions.push("Opened Daily Tasks page");
  } else if (lower.includes("workout") || lower.includes("exercise")) {
    if (typeof switchTab === 'function') switchTab('workout');
    performedActions.push("Opened Workout Protocol page");
  } else if (lower.includes("supplement")) {
    if (typeof switchTab === 'function') switchTab('supplements');
    performedActions.push("Opened Supplements Inventory page");
  } else if (lower.includes("stats") || lower.includes("analytics") || lower.includes("performance")) {
    if (typeof switchTab === 'function') switchTab('analytics');
    performedActions.push("Opened Performance Analytics page");
  }

  // 2. Autopilot Water Logging (e.g. "500ml water done", "drank 250ml water", "had water")
  if (lower.includes("water") || lower.includes("ml") || lower.includes("hydration") || lower.includes("drank")) {
    const numbers = text.match(/\d+/g);
    let amount = 500;
    if (numbers && numbers.length > 0) {
      const parsed = parseInt(numbers[0]);
      if (parsed > 0) amount = parsed;
    }
    if (typeof addWater === 'function') {
      addWater(amount);
      performedActions.push(`Logged +${amount}ml water on hydration tracker`);
    }
  }

  // 3. Autopilot Steps Logging (e.g. "3000 steps done", "walked 5000 steps", "hit 10k steps")
  if (lower.includes("step") || lower.includes("walked") || lower.includes("10k")) {
    const numbers = text.match(/\d+/g);
    let stepsAmount = 2500;
    if (numbers && numbers.length > 0) {
      const parsed = parseInt(numbers[0]);
      if (parsed > 0) stepsAmount = parsed;
    }
    if (typeof addSteps === 'function') {
      addSteps(stepsAmount);
      performedActions.push(`Logged +${stepsAmount.toLocaleString()} steps on steps tracker`);
    }
  }

  // 4. Weight Updates & History Autopilot
  if (lower.includes("weight") || lower.includes("kg")) {
    const matches = text.match(/\d+(\.\d+)?/g);
    if (matches && matches.length > 0) {
      const val = parseFloat(matches[0]);
      if (val > 20 && val < 250) {
        if (lower.includes("target") || lower.includes("goal")) {
          appState.user.targetWeight = val;
          performedActions.push(`Updated target weight goal to ${val}kg`);
        } else {
          appState.user.currentWeight = val;
          if (!appState.weightHistory) appState.weightHistory = [];
          appState.weightHistory.push({ date: new Date().toLocaleDateString(), weight: val });
          performedActions.push(`Logged current weight as ${val}kg in weight history`);
        }
      }
    }
  }

  // 5. Sleep & Recovery Autopilot
  if (lower.includes("sleep") || lower.includes("slept") || lower.includes("rest") || lower.includes("recovery")) {
    const numbers = text.match(/\d+/g);
    let hrs = 8;
    if (numbers && numbers.length > 0) {
      const parsed = parseInt(numbers[0]);
      if (parsed > 0 && parsed <= 16) hrs = parsed;
    }
    appState.user.sleepHours = hrs;
    performedActions.push(`Logged ${hrs} hours sleep & recalculated recovery score`);
  }

  // 6. Cheat Meal / Slip-up Recovery Autopilot
  if (lower.includes("cheat") || lower.includes("junk") || lower.includes("pizza") || lower.includes("burger") || lower.includes("ate bad") || lower.includes("fell off")) {
    if (!appState.dailyTasks.workout) appState.dailyTasks.workout = [];
    appState.dailyTasks.workout.push({
      id: `burn_${Date.now()}`,
      label: "Emergency 20-min HIIT Burn-off Walk/Cardio",
      completed: false,
      xp: 100
    });
    performedActions.push("Flagged slip-up & added Emergency 20-min HIIT Burn-off task to Workout Protocol");
  }

  // 7. Uncheck / Undo Task Autopilot
  if (lower.includes("uncheck") || lower.includes("undo") || lower.includes("not done")) {
    if (appState.dailyTasks) {
      Object.entries(appState.dailyTasks).forEach(([secKey, tasks]) => {
        tasks.forEach(t => {
          const taskLower = t.label.toLowerCase();
          const isMatch = lower.split(' ').some(word => word.length > 3 && taskLower.includes(word));
          if (isMatch && t.completed) {
            t.completed = false;
            appState.user.xp = Math.max(0, appState.user.xp - (t.xp || 50));
            performedActions.push(`Unchecked task '${t.label}'`);
          }
        });
      });
    }
  }

  // 8. Autopilot Task Deletion / Removal (e.g. "remove rice in lunch", "delete white rice", "remove task dal")
  if (lower.includes("remove") || lower.includes("delete") || lower.includes("get rid") || lower.includes("erase") || lower.includes("clear task")) {
    if (appState.dailyTasks) {
      const stopWords = ["remove", "delete", "from", "with", "this", "that", "its", "it's", "become", "twice", "bro", "please", "task", "item", "in", "for"];
      const keywords = lower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      
      Object.entries(appState.dailyTasks).forEach(([secKey, tasks]) => {
        for (let i = tasks.length - 1; i >= 0; i--) {
          const t = tasks[i];
          const taskLower = t.label.toLowerCase();
          
          const isMatch = keywords.some(w => taskLower.includes(w));
          const isSectionMatch = lower.includes(secKey.toLowerCase());
          
          if (isMatch && (!isSectionMatch || lower.includes(secKey.toLowerCase()))) {
            const removed = tasks.splice(i, 1)[0];
            performedActions.push(`Removed task '${removed.label}' from ${secKey.toUpperCase()} protocol`);
          }
        }
      });
    }
  }

  // 9. Autopilot Task & Meal Completion (e.g. "breakfast done", "multivitamin taken", "pushups completed")
  if (lower.includes("done") || lower.includes("completed") || lower.includes("took") || lower.includes("ate") || lower.includes("finished") || lower.includes("had")) {
    let completedCount = 0;
    
    // Check daily tasks across all sections
    if (appState.dailyTasks) {
      Object.entries(appState.dailyTasks).forEach(([secKey, tasks]) => {
        tasks.forEach(t => {
          const taskLower = t.label.toLowerCase();
          const isSectionMatch = lower.includes(secKey.toLowerCase()) && !t.completed;
          const isTaskMatch = lower.split(' ').some(word => word.length > 3 && taskLower.includes(word)) && !t.completed;
          
          if (isSectionMatch || isTaskMatch) {
            t.completed = true;
            completedCount++;
            appState.user.xp += (t.xp || 50);
            performedActions.push(`Checked off '${t.label}' (+${t.xp || 50} XP)`);
          }
        });
      });
    }

    // Check workout exercises for today
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const realToday = daysOfWeek[new Date().getDay()];
    const activeDay = appState.workoutSplit?.activeDay || realToday;
    const todayExercises = appState.workoutSplit?.days?.[activeDay]?.exercises;

    if (todayExercises) {
      todayExercises.forEach(ex => {
        const exLower = ex.name.toLowerCase();
        const isWorkoutDone = lower.includes("workout") || lower.includes("exercise") || lower.includes("gym") || lower.includes("training");
        const isExMatch = lower.split(' ').some(word => word.length > 3 && exLower.includes(word));

        if ((isWorkoutDone || isExMatch) && !ex.completed) {
          ex.completed = true;
          appState.user.xp += 100;
          performedActions.push(`Checked off exercise '${ex.name}' (+100 XP)`);
        }
      });
    }
  }

  // 9. Add Custom Task / Supplement / Rule Commands with AI Research Auto-Categorization
  if (lower.includes("add task") || lower.includes("i take") || lower.includes("i eat") || lower.includes("add food") || lower.includes("add rule")) {
    const rawLabel = text.replace(/add task|add food|add rule|i take|i eat|please/gi, '').trim() || "Custom Task";
    const res = await autoCategorizeItemWithAI(rawLabel);
    const targetSection = res.section || "breakfast";
    if (!appState.dailyTasks[targetSection]) appState.dailyTasks[targetSection] = [];
    appState.dailyTasks[targetSection].push({
      id: `custom_${Date.now()}`,
      label: res.label,
      completed: false,
      xp: 50
    });
    performedActions.push(`AI Researched & Auto-Categorized '${res.label}' into ${targetSection.toUpperCase()}`);
  } else if (lower.includes("add supplement") || lower.includes("take supplement")) {
    const suppName = text.replace(/add supplement|take supplement|pill/gi, '').trim() || "Daily Booster";
    const key = suppName.toLowerCase().replace(/[^a-z]/g, '');
    const res = await autoCategorizeItemWithAI(suppName);
    const targetSection = res.section || "breakfast";
    
    if (!appState.supplements) appState.supplements = [];
    appState.supplements.push({ key, name: suppName, quantity: 30, unit: "doses" });
    
    if (!appState.dailyTasks[targetSection]) appState.dailyTasks[targetSection] = [];
    appState.dailyTasks[targetSection].push({
      id: `supp_${Date.now()}`,
      label: res.label,
      completed: false,
      isSupp: true,
      suppKey: key,
      xp: 50
    });
    performedActions.push(`AI Researched & Auto-Categorized supplement '${res.label}' into ${targetSection.toUpperCase()}`);
  }

  saveState();

  // Proactive Agentic Audit Context
  const auditAlerts = runProactiveAgenticAudit() || [];
  const auditSummary = auditAlerts.length > 0 ? `PROACTIVE AGENTIC AUDIT ALERTS: [${auditAlerts.join('; ')}]` : "All schedules optimal";

  // Build rich context snapshot of user's current day for DAMN AI
  const actionSummary = performedActions.length > 0 ? performedActions.join("; ") : "No autopilot actions needed";
  
  // Calculate today's completion stats
  let totalTasks = 0, doneTasks = 0;
  if (appState.dailyTasks) {
    Object.values(appState.dailyTasks).forEach(sec => {
      if (Array.isArray(sec)) {
        sec.forEach(t => { totalTasks++; if (t.completed) doneTasks++; });
      }
    });
  }
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  // Get today's remaining tasks summary
  const pendingTasks = [];
  if (appState.dailyTasks) {
    Object.entries(appState.dailyTasks).forEach(([sec, tasks]) => {
      if (Array.isArray(tasks)) {
        tasks.filter(t => !t.completed).forEach(t => pendingTasks.push(t.label));
      }
    });
  }
  const pendingSummary = pendingTasks.length > 0 ? pendingTasks.slice(0, 5).join(", ") + (pendingTasks.length > 5 ? ` (+${pendingTasks.length - 5} more)` : "") : "All done for today!";

  const prompt = `${appState.user.name || "User"} said: "${text}"

DAMN AI AUTOPILOT ACTIONS PERFORMED: [${actionSummary}]
${auditSummary}

TODAY'S LIVE DASHBOARD:
- Day ${appState.user.dayCurrent || 1}/${appState.user.dayTotal || 60} | Streak: ${appState.user.currentStreak || 0} days
- Today's Progress: ${doneTasks}/${totalTasks} tasks done (${completionPct}%)
- Water: ${appState.user.waterCurrentMl || 0}ml / ${appState.user.waterGoalMl || 3500}ml
- XP: ${appState.user.xp || 0}
- Still Pending: ${pendingSummary}
- Weight: ${appState.user.currentWeight}kg -> ${appState.user.targetWeight}kg goal

Respond as their personal trainer, nutritionist, and chill friend. Confirm actions, provide proactive guidance if they are behind schedule, and keep them hyped!`;

  const aiReply = await callGeminiCoach(prompt) || (performedActions.length > 0 ? `Done! ${performedActions.join(', ')}. Keep going! 🔥` : "I got you bro, DAMN AI is always locked in 💪");

  hideTypingIndicator();
  addChatMessage('assistant', aiReply);
  renderApp();
}

// ==================== PROACTIVE AGENTIC AUDIT ENGINE ====================
function runProactiveAgenticAudit() {
  if (!appState || !appState.user || !appState.user.onboardingCompleted) return [];

  const now = new Date();
  const currentHour = now.getHours();
  const alerts = [];

  // Morning audit (after 10 AM)
  if (currentHour >= 10) {
    const morningPending = (appState.dailyTasks?.morning || []).filter(t => !t.completed);
    if (morningPending.length > 0) {
      alerts.push(`Early morning routine has ${morningPending.length} pending items (Hydrate, Walk, Fasted Boosters)`);
    }
  }

  // Afternoon audit (after 2 PM)
  if (currentHour >= 14) {
    const bPending = (appState.dailyTasks?.breakfast || []).filter(t => !t.completed);
    if (bPending.length > 0) {
      alerts.push(`Breakfast & Multivitamin doses are still unchecked!`);
    }
  }

  // Hydration audit (after 5 PM)
  if (currentHour >= 17) {
    const target = appState.user.waterGoalMl || 3500;
    const current = appState.user.waterCurrentMl || 0;
    if (current < target * 0.5) {
      alerts.push(`Hydration Alert: Only ${current}ml / ${target}ml drank so far today!`);
    }
  }

  // Workout audit (after 7 PM)
  if (currentHour >= 19) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const realToday = daysOfWeek[now.getDay()];
    const activeDay = appState.workoutSplit?.activeDay || realToday;
    const exercises = appState.workoutSplit?.days?.[activeDay]?.exercises || [];
    const pendingEx = exercises.filter(e => !e.completed);
    if (pendingEx.length > 0) {
      alerts.push(`Workout Alert: ${pendingEx.length} exercises remaining for today's ${activeDay} session!`);
    }
  }

  return alerts;
}

window.runProactiveAgenticAudit = runProactiveAgenticAudit;

function evaluateAnswerIntelligent(q, answer) {
  const cleanLower = answer.trim().toLowerCase();

  // Detect if user is asking a question back or chatting
  const isQuestionOrChat = cleanLower.includes("wts") || cleanLower.includes("what") || cleanLower.includes("who") ||
                          cleanLower.includes("why") || cleanLower.includes("how") || cleanLower.includes("?") ||
                          cleanLower.includes("ur name") || cleanLower.includes("your name") || cleanLower.includes("urs") ||
                          cleanLower.includes("you") || cleanLower.includes("bro");

  // A. Name Field
  if (q.field === 'name') {
    const nonNameTokens = [
      "hi", "hello", "hey", "sup", "yo", "hola", "namaste", "good morning", "good evening", 
      "wtf", "no", "yes", "none", "test", "j", "a", "b", "c", "x", "y", "z", "ok", "okay",
      "wts", "wt", "wats", "wassup", "urs", "ur", "yours", "u", "urself", "yourself",
      "saying", "just", "chatting", "idk", "nothing", "whatever", "guess", "secret", "who", "what", "why", "how"
    ];

    const isNonName = nonNameTokens.some(t => cleanLower.includes(t)) ||
                      cleanLower.length < 2 || 
                      /^\d+$/.test(cleanLower);

    if (isNonName) {
      if (cleanLower.includes("wts") || cleanLower.includes("urs") || cleanLower.includes("ur name") || cleanLower.includes("who") || cleanLower.includes("what")) {
        return {
          isValid: false,
          aiReply: `I'm DAMN — your personal AI coach & trainer! 🔥 What should I call YOU bro?`
        };
      }
      if (cleanLower.includes("hello") || cleanLower.includes("saying") || cleanLower.includes("hi") || cleanLower.includes("hey")) {
        return {
          isValid: false,
          aiReply: `Haha gotcha! 👋 Hello to you too bro! But what's your actual name so I know who I'm coaching?`
        };
      }
      return {
        isValid: false,
        aiReply: `Yo bro! '${answer}'? Is that actually your name or are you just chatting? 😂 Tell me your real name so we can lock in!`
      };
    }

    let clean = answer.replace(/my name is|i am|i'm|call me|this is/gi, '').trim();
    if (!clean) clean = answer.trim();
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return {
      isValid: true,
      parsedValue: clean,
      aiReply: `Awesome to meet you, ${clean}! Let me build your custom protocol 💪`
    };
  }

  // B. Gender Field
  if (q.field === 'gender') {
    if (cleanLower.includes("male") || cleanLower.includes("man") || cleanLower.includes("boy") || cleanLower === "m") {
      return { isValid: true, parsedValue: "Male", aiReply: "Locked in, brother! 💪" };
    }
    if (cleanLower.includes("female") || cleanLower.includes("woman") || cleanLower.includes("girl") || cleanLower === "f") {
      return { isValid: true, parsedValue: "Female", aiReply: "Locked in, sister! Let me tailor this for your goals! 🔥" };
    }
    if (isQuestionOrChat) {
      return {
        isValid: false,
        aiReply: `Haha bro I'm a digital AI coach living in the cloud so gender doesn't apply to me! 😂 Are you Male or Female?`
      };
    }
    return {
      isValid: false,
      aiReply: `Bro '${answer}' isn't a valid gender selection 😂 Tap Male or Female or type it out!`
    };
  }

  // C. Age Field
  if (q.field === 'age') {
    const num = parseInt(answer.replace(/\D/g, ''));
    if (!isNaN(num) && num >= 10 && num <= 100) {
      return { isValid: true, parsedValue: num, aiReply: `Locked in! ${num} is a prime age to transform your physique 🔥` };
    }
    if (isQuestionOrChat) {
      return {
        isValid: false,
        aiReply: `Haha bro I'm an AI living in the cloud so I don't age! 😂 How old are YOU? Give me a real number (e.g. 22)!`
      };
    }
    return {
      isValid: false,
      aiReply: `Bro '${answer}' isn't a valid age 😂 Give me your real age in years (e.g. 22)!`
    };
  }

  // D. Height Field
  if (q.field === 'heightCm') {
    const num = parseInt(answer.replace(/\D/g, ''));
    if (!isNaN(num) && num >= 100 && num <= 250) {
      return { isValid: true, parsedValue: num, aiReply: `Got it! ${num}cm height locked into your profile.` };
    }
    if (isQuestionOrChat) {
      return {
        isValid: false,
        aiReply: `Haha bro I'm an AI living in the cloud, so height doesn't apply to me! 😂 What's YOUR height in cm (e.g. 175cm)?`
      };
    }
    return {
      isValid: false,
      aiReply: `Bro '${answer}' isn't a valid height 😂 Give me your height in cm (e.g. 175cm)!`
    };
  }

  // E. Weight Field
  if (q.field === 'weights') {
    const parts = answer.split(/->|,| /).map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (parts.length > 0) {
      return { isValid: true, parsedValue: answer, aiReply: `Weight target saved! We are going to crush this goal 💪` };
    }
    if (isQuestionOrChat) {
      return {
        isValid: false,
        aiReply: `Haha I don't weigh anything bro! 😂 What's your current & target weight in kg (e.g. 75kg -> 70kg)?`
      };
    }
    return {
      isValid: false,
      aiReply: `Bro '${answer}' isn't a valid weight 😂 Give me your current & goal weight in kg (e.g. 75kg -> 70kg)!`
    };
  }

  // Default fallback for options / text steps
  return {
    isValid: true,
    parsedValue: answer,
    aiReply: `Got it! Recorded '${answer}' for your protocol 💪`
  };
}

async function processOnboardingAnswer(answer) {
  const q = ONBOARDING_QUESTIONS[onboardingStep];
  showTypingIndicator();

  // Send question context + user answer directly to Gemini LLM for 100% real LLM intent analysis & generation
  const prompt = `You are DAMN — a super chill, world-class GenZ AI fitness coach & personal trainer.
You are running setup for your user.
Current Question asked to user: "${q.question}" (Field: '${q.field}').
User responded: "${answer}"

Analyze the user's input with full LLM conversational intelligence:
1. Did the user answer the question validly? (e.g. for name: a real name like "John" or "Alex"; for height: a number in cm; for age: a number; for gender: Male/Female).
2. If they chatted, asked a question back (e.g. 'wts urs bro', 'who are you', 'im just saying hello to u', 'banana', 'j'), or gave non-answers:
   - Answer their question or chat like a real chill homie AI coach! (e.g. if they ask 'wts urs bro' for height: "Haha bro I'm a digital AI coach living in the cloud so I don't have a height! 😂 What's YOUR height in cm?")
   - Set "isValid": false and "aiReply": "your custom natural conversational response".
3. If they gave a valid answer:
   - Extract "parsedValue": "clean value"
   - Set "isValid": true and "aiReply": "your 1-sentence hype response".

Respond ONLY in valid JSON format:
{"isValid": true, "parsedValue": "extracted value", "aiReply": "your natural response"}`;

  let parsedRes = null;
  try {
    const rawAi = await callGeminiCoach(prompt, "You are an intelligent conversational intent parser. Output pure valid JSON.");
    if (rawAi) {
      const cleaned = rawAi.replace(/```json|```/g, '').trim();
      parsedRes = JSON.parse(cleaned);
    }
  } catch (e) {
    console.warn("AI intent parse error:", e);
  }

  // Fallback to intelligent local evaluator ONLY if LLM API is completely unreachable
  if (!parsedRes || typeof parsedRes.isValid !== 'boolean') {
    parsedRes = evaluateAnswerIntelligent(q, answer);
  }

  hideTypingIndicator();

  if (parsedRes) {
    addChatMessage('assistant', parsedRes.aiReply);
    
    if (parsedRes.isValid) {
      // Save parsed value to onboardingData
      const val = parsedRes.parsedValue || answer;
      if (q.field === 'name') onboardingData.name = val;
      else if (q.field === 'gender') onboardingData.gender = val;
      else if (q.field === 'age') onboardingData.age = parseInt(val) || 22;
      else if (q.field === 'heightCm') onboardingData.heightCm = parseInt(val) || 175;
      else if (q.field === 'dayTotal') onboardingData.dayTotal = parseInt(val) || 60;
      else if (q.field === 'weights') {
        const parts = String(val).split(/->|,| /).map(s => parseFloat(s)).filter(n => !isNaN(n));
        if (parts.length >= 2) { onboardingData.currentWeight = parts[0]; onboardingData.targetWeight = parts[1]; }
        else if (parts.length === 1) { onboardingData.currentWeight = parts[0]; }
      }
      else if (q.field === 'fitnessGoal') onboardingData.fitnessGoal = val;
      else if (q.field === 'dietType') onboardingData.dietType = val;
      else if (q.field === 'vegCookStyle') onboardingData.vegCookStyle = val;
      else if (q.field === 'sleepSchedule') onboardingData.sleepSchedule = val;
      else if (q.field === 'foodTimings') onboardingData.foodTimings = val;
      else if (q.field === 'workoutLocation') onboardingData.workoutLocation = String(val).includes("Home") ? "Home" : "Gym";
      else if (q.field === 'workoutExperience') onboardingData.workoutExperience = val;
      else if (q.field === 'workoutType') onboardingData.workoutType = val;
      else if (q.field === 'workoutTiming') onboardingData.workoutTiming = val;
      else if (q.field === 'waterGoal') onboardingData.waterGoalMl = Math.round((parseFloat(val) || 3.5) * 1000);
      else if (q.field === 'allergies') onboardingData.allergies = val;

      onboardingStep++;
      setTimeout(() => { askNextOnboardingQuestion(); }, 400);
    }
  }
}

async function finishOnboardingChat() {
  showTypingIndicator();

  const prompt = `Summarize and hype up this protocol lock-in for ${onboardingData.name || 'Champion'}. 
Gender: ${onboardingData.gender}, Age: ${onboardingData.age}, Height: ${onboardingData.heightCm}cm.
Duration: ${onboardingData.dayTotal} days, Current: ${onboardingData.currentWeight}kg, Target: ${onboardingData.targetWeight}kg.
Goal: ${onboardingData.fitnessGoal}. Diet: ${onboardingData.dietType}.
Proteins: ${onboardingData.proteins.join(', ')}. Vegetables: ${onboardingData.vegetables.join(', ')} (${onboardingData.vegCookStyle}).
Fruits: ${onboardingData.fruits.join(', ')}. Grains: ${onboardingData.grains.join(', ')}.
Supplements: ${onboardingData.supplements.join(', ')}. Timings: ${onboardingData.foodTimings}.
Workout: ${onboardingData.workoutLocation} - ${onboardingData.workoutType} (${onboardingData.workoutExperience}).
Hydration: ${onboardingData.waterGoalMl}ml. Skin/Hair: ${onboardingData.skinHairGoals.join(', ')}.
Allergies: ${onboardingData.allergies || 'None'}. Eliminating: ${onboardingData.disciplineRules.join(', ')}.
Give a 2-sentence genuine friend hype message!`;

  const finalHype = await callGeminiCoach(prompt) || "BOOM! 🔥 Your protocol is locked in. Let's dominate every single day!";
  hideTypingIndicator();

  addChatMessage('assistant', finalHype);

  // Apply ALL collected profile info to appState (DAMN remembers everything)
  appState.user.name = onboardingData.name || appState.user.name;
  appState.user.gender = onboardingData.gender;
  appState.user.age = onboardingData.age;
  appState.user.heightCm = onboardingData.heightCm;
  appState.user.dayTotal = onboardingData.dayTotal || 60;
  appState.user.currentWeight = onboardingData.currentWeight;
  appState.user.targetWeight = onboardingData.targetWeight;
  appState.user.fitnessGoal = onboardingData.fitnessGoal;
  appState.user.dietType = onboardingData.dietType;
  appState.user.proteins = onboardingData.proteins;
  appState.user.vegetables = onboardingData.vegetables;
  appState.user.vegCookStyle = onboardingData.vegCookStyle;
  appState.user.fruits = onboardingData.fruits;
  appState.user.grains = onboardingData.grains;
  appState.user.foodTimings = onboardingData.foodTimings;
  appState.user.sleepSchedule = onboardingData.sleepSchedule;
  appState.user.workoutLocation = onboardingData.workoutLocation;
  appState.user.workoutType = onboardingData.workoutType;
  appState.user.workoutExperience = onboardingData.workoutExperience;
  appState.user.workoutTiming = onboardingData.workoutTiming;
  appState.user.waterGoalMl = onboardingData.waterGoalMl;
  appState.user.skinHairGoals = onboardingData.skinHairGoals;
  appState.user.allergies = onboardingData.allergies;
  appState.user.disciplineRules = onboardingData.disciplineRules;

  // Build custom daily tasks categorized cleanly by time blocks
  const workoutTimeLabel = onboardingData.workoutTiming || "Evening (5-7 PM)";
  const customTasks = {
    morning: [
      { id: "m1", label: "Wake Up & Hydrate (500ml Water)", completed: false, xp: 50 },
      { id: "m2", label: "Sunlight Walk & Start 10k Steps", completed: false, xp: 50 }
    ],
    breakfast: [],
    lunch: [],
    evening: [],
    workout: [
      { id: "w1", label: `${onboardingData.workoutLocation} Workout - ${onboardingData.workoutType} (${workoutTimeLabel})`, completed: false, xp: 100 },
      { id: "w2", label: "Post-Workout Mobility & Stretching", completed: false, xp: 50 }
    ],
    discipline: [],
    night: [
      { id: "n1", label: "Brush Teeth & Skincare Routine", completed: false, xp: 50 },
      { id: "n2", label: "Sleep Before Goal Time (Rest & Recovery)", completed: false, xp: 100 }
    ]
  };

  // ---- BREAKFAST TASKS from proteins, grains, fruits ----
  let bIdx = 0;
  // Add breakfast proteins (eggs, oats, etc.)
  onboardingData.proteins.forEach(p => {
    const pl = p.toLowerCase();
    if (pl.includes("egg") || pl.includes("curd") || pl.includes("yogurt") || pl.includes("sprouted")) {
      customTasks.breakfast.push({ id: `bp_${bIdx++}`, label: `${p} (Breakfast)`, completed: false, xp: 50 });
    }
  });
  // Add breakfast grains
  onboardingData.grains.forEach(g => {
    const gl = g.toLowerCase();
    if (gl.includes("oat") || gl.includes("bread") || gl.includes("toast") || gl.includes("poha") || gl.includes("upma") || gl.includes("muesli")) {
      customTasks.breakfast.push({ id: `bg_${bIdx++}`, label: `${g} (Breakfast)`, completed: false, xp: 50 });
    }
  });
  // Add a fruit to breakfast
  if (onboardingData.fruits.length > 0) {
    customTasks.breakfast.push({ id: `bf_0`, label: `${onboardingData.fruits[0]} (Breakfast Fruit)`, completed: false, xp: 50 });
  }
  // Fallback if breakfast is empty
  if (customTasks.breakfast.length === 0) {
    customTasks.breakfast.push({ id: "b_def", label: "Nutritious Breakfast (8:30 AM)", completed: false, xp: 50 });
  }

  // ---- LUNCH TASKS from proteins, grains, vegetables ----
  let lIdx = 0;
  onboardingData.proteins.forEach(p => {
    const pl = p.toLowerCase();
    if (pl.includes("chicken") || pl.includes("fish") || pl.includes("paneer") || pl.includes("dal") || pl.includes("tofu") || pl.includes("soya")) {
      customTasks.lunch.push({ id: `lp_${lIdx++}`, label: `${p} (Lunch)`, completed: false, xp: 50 });
    }
  });
  onboardingData.grains.forEach(g => {
    const gl = g.toLowerCase();
    if (gl.includes("rice") || gl.includes("roti") || gl.includes("chapati") || gl.includes("quinoa")) {
      customTasks.lunch.push({ id: `lg_${lIdx++}`, label: `${g} (Lunch)`, completed: false, xp: 50 });
    }
  });
  // Add vegetables as salad or sabzi to lunch
  if (onboardingData.vegetables.length > 0) {
    const vegStyle = onboardingData.vegCookStyle || "Mixed";
    const vegList = onboardingData.vegetables.slice(0, 4).join(", ");
    customTasks.lunch.push({ id: `lv_0`, label: `Vegetables - ${vegList} (${vegStyle})`, completed: false, xp: 50 });
  }
  if (customTasks.lunch.length === 0) {
    customTasks.lunch.push({ id: "l_def", label: "Healthy Lunch (1:30 PM)", completed: false, xp: 50 });
  }

  // ---- EVENING SNACK TASKS from fruits, protein shake ----
  let eIdx = 0;
  onboardingData.proteins.forEach(p => {
    const pl = p.toLowerCase();
    if (pl.includes("whey") || pl.includes("shake")) {
      customTasks.evening.push({ id: `ep_${eIdx++}`, label: `${p} (Pre/Post Workout)`, completed: false, xp: 50 });
    }
  });
  if (onboardingData.fruits.length > 1) {
    customTasks.evening.push({ id: `ef_0`, label: `${onboardingData.fruits[1]} (Evening Snack)`, completed: false, xp: 50 });
  }
  if (customTasks.evening.length === 0) {
    customTasks.evening.push({ id: "e_def", label: "Evening Snack & Fruit", completed: false, xp: 50 });
  }

  // ---- DINNER / NIGHT — actual food items from user profile ----
  let dIdx = 0;
  // Add a dinner protein (pick one that's not already breakfast-specific)
  const dinnerProteins = onboardingData.proteins.filter(p => {
    const pl = p.toLowerCase();
    return pl.includes("chicken") || pl.includes("fish") || pl.includes("paneer") || pl.includes("dal") || pl.includes("tofu") || pl.includes("soya") || pl.includes("egg");
  });
  if (dinnerProteins.length > 0) {
    // Pick a different protein than lunch if possible
    const dinnerPick = dinnerProteins.length > 1 ? dinnerProteins[dinnerProteins.length - 1] : dinnerProteins[0];
    customTasks.night.unshift({ id: `dp_${dIdx++}`, label: `${dinnerPick} (Dinner Protein)`, completed: false, xp: 50 });
  } else {
    customTasks.night.unshift({ id: `dp_def`, label: "Dinner Protein (Light)", completed: false, xp: 50 });
  }
  // Add a dinner grain (roti/rice - light portion)
  const dinnerGrains = onboardingData.grains.filter(g => {
    const gl = g.toLowerCase();
    return gl.includes("roti") || gl.includes("chapati") || gl.includes("rice") || gl.includes("quinoa");
  });
  if (dinnerGrains.length > 0) {
    customTasks.night.unshift({ id: `dg_${dIdx++}`, label: `${dinnerGrains[0]} (Dinner - Light Portion)`, completed: false, xp: 50 });
  }
  // Add dinner vegetables
  if (onboardingData.vegetables.length > 0) {
    const dinnerVegs = onboardingData.vegetables.slice(0, 3).join(", ");
    customTasks.night.unshift({ id: `dv_0`, label: `Veggies - ${dinnerVegs} (Dinner Sabzi/Salad)`, completed: false, xp: 50 });
  }

  // ---- SKIN/HAIR GOALS to Night Protocol ----
  if (onboardingData.skinHairGoals.length > 0 && !onboardingData.skinHairGoals.includes("None")) {
    onboardingData.skinHairGoals.forEach((goal, i) => {
      if (goal !== "Done") {
        customTasks.night.push({ id: `sh_${i}`, label: `${goal} (Night Care)`, completed: false, xp: 50 });
      }
    });
  }

  // ---- SUPPLEMENT CATEGORIZATION (AI-researched clinical timing) ----
  const suppList = [];
  if (onboardingData.supplements.length > 0) {
    onboardingData.supplements.forEach((s, idx) => {
      const key = s.toLowerCase().replace(/[^a-z]/g, '');
      suppList.push({ key, name: s, quantity: 30, unit: "doses" });

      const sLower = s.toLowerCase();
      if (sLower.includes("fish") || sLower.includes("omega")) {
        customTasks.lunch.push({ id: `supp_${idx}`, label: `${s} Dose (After Lunch)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("biotin")) {
        customTasks.night.push({ id: `supp_${idx}`, label: `${s} Dose (After Dinner)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("multi")) {
        customTasks.breakfast.push({ id: `supp_${idx}`, label: `${s} Dose (After Breakfast)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("d3") || sLower.includes("vitamin d")) {
        customTasks.breakfast.push({ id: `supp_${idx}`, label: `${s} Dose (With Breakfast Fats)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("ashwagandha") || sLower.includes("shilajit")) {
        customTasks.lunch.push({ id: `supp_${idx}`, label: `${s} Dose (With Lunch)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("creatine") || sLower.includes("protein") || sLower.includes("whey")) {
        customTasks.evening.push({ id: `supp_${idx}`, label: `${s} Dose (Pre/Post Workout)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else if (sLower.includes("magnesium") || sLower.includes("zinc")) {
        customTasks.night.push({ id: `supp_${idx}`, label: `${s} Dose (Before Sleep)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      } else {
        customTasks.morning.push({ id: `supp_${idx}`, label: `${s} Dose (Before Breakfast)`, completed: false, isSupp: true, suppKey: key, xp: 50 });
      }
    });
  }

  // Add discipline rules
  if (onboardingData.disciplineRules.length > 0) {
    onboardingData.disciplineRules.forEach((rule, idx) => {
      if (rule !== "Done") {
        customTasks.discipline.push({ id: `d_${idx}`, label: rule, completed: false, xp: 150 });
      }
    });
  } else {
    customTasks.discipline.push({ id: "d1", label: "No Sugar", completed: false, xp: 150 });
    customTasks.discipline.push({ id: "d2", label: "No Junk Food", completed: false, xp: 150 });
  }

  appState.dailyTasks = customTasks;
  if (suppList.length > 0) appState.supplements = suppList;

  // Build custom workout split based on workoutLocation (Gym vs Home) & workoutType
  if (onboardingData.workoutLocation === "Home") {
    // Dedicated Clean Home Workout Routines
    appState.workoutSplit = {
      activeDay: "Monday",
      days: {
        Monday: { focus: "Home Push (Chest, Shoulders & Triceps)", exercises: [
          { id: "he1", name: "Standard Push-ups", reps: "3 sets x 15 reps", completed: false },
          { id: "he2", name: "Diamond Push-ups", reps: "3 sets x 12 reps", completed: false },
          { id: "he3", name: "Chair / Bed Tricep Dips", reps: "3 sets x 15 reps", completed: false },
          { id: "he4", name: "Pike Push-ups (Shoulders)", reps: "3 sets x 10 reps", completed: false }
        ]},
        Tuesday: { focus: "Home Pull & Core (Back, Biceps & Abs)", exercises: [
          { id: "he5", name: "Doorframe / Table Inverted Rows", reps: "3 sets x 12 reps", completed: false },
          { id: "he6", name: "Superman Holds", reps: "3 sets x 45s hold", completed: false },
          { id: "he7", name: "Doorway Bicep Squeeze Curls", reps: "3 sets x 15 reps", completed: false },
          { id: "he8", name: "Plank Hold", reps: "60s hold", completed: false }
        ]},
        Wednesday: { focus: "Home Lower Body & Legs", exercises: [
          { id: "he9", name: "Bodyweight Squats", reps: "4 sets x 20 reps", completed: false },
          { id: "he10", name: "Walking Lunges", reps: "3 sets x 16 reps", completed: false },
          { id: "he11", name: "Single-Leg Calf Raises", reps: "3 sets x 20 reps", completed: false },
          { id: "he12", name: "Wall Sit Hold", reps: "45s hold", completed: false }
        ]},
        Thursday: { focus: "Home Upper Body Focus", exercises: [
          { id: "he13", name: "Decline Push-ups (Feet Elevated)", reps: "3 sets x 12 reps", completed: false },
          { id: "he14", name: "Push-up Isometric Hold", reps: "3 sets x 25s", completed: false },
          { id: "he15", name: "Chair Dips", reps: "3 sets x 15 reps", completed: false }
        ]},
        Friday: { focus: "Home Abs & HIIT Cardio", exercises: [
          { id: "he16", name: "Mountain Climbers", reps: "3 sets x 30s", completed: false },
          { id: "he17", name: "High Knees", reps: "3 sets x 45s", completed: false },
          { id: "he18", name: "Lying Leg Raises", reps: "3 sets x 15 reps", completed: false },
          { id: "he19", name: "Russian Twists", reps: "3 sets x 20 reps", completed: false }
        ]},
        Saturday: { focus: "Home Lower & Outdoor Cardio", exercises: [
          { id: "he20", name: "Jump Squats", reps: "3 sets x 15 reps", completed: false },
          { id: "he21", name: "Glute Bridges", reps: "3 sets x 20 reps", completed: false },
          { id: "he22", name: "30-min Outdoor Brisk Walk / Run", reps: "30 mins", completed: false }
        ]},
        Sunday: { focus: "Active Recovery & Flexibility", exercises: [
          { id: "he23", name: "Full Body Hamstring & Shoulder Stretch", reps: "20 mins", completed: false }
        ]}
      }
    };
  } else {
    // Gym Workout Routines
    appState.workoutSplit = {
      activeDay: "Monday",
      days: {
        Monday: { focus: "Chest, Shoulders & Triceps (Gym Push)", exercises: [
          { id: "ge1", name: "Barbell Bench Press", reps: "4 sets x 10 reps", completed: false },
          { id: "ge2", name: "Dumbbell Overhead Shoulder Press", reps: "3 sets x 12 reps", completed: false },
          { id: "ge3", name: "Cable Tricep Pushdowns", reps: "3 sets x 15 reps", completed: false },
          { id: "ge4", name: "Incline Dumbbell Press", reps: "3 sets x 12 reps", completed: false }
        ]},
        Tuesday: { focus: "Back & Biceps (Gym Pull)", exercises: [
          { id: "ge5", name: "Lat Pulldown / Pull-ups", reps: "4 sets x 10 reps", completed: false },
          { id: "ge6", name: "Barbell / Cable Rows", reps: "3 sets x 12 reps", completed: false },
          { id: "ge7", name: "Dumbbell Bicep Curls", reps: "3 sets x 12 reps", completed: false },
          { id: "ge8", name: "Face Pulls (Rear Delts)", reps: "3 sets x 15 reps", completed: false }
        ]},
        Wednesday: { focus: "Legs & Core (Gym Legs)", exercises: [
          { id: "ge9", name: "Barbell Squats", reps: "4 sets x 10 reps", completed: false },
          { id: "ge10", name: "Leg Press", reps: "3 sets x 12 reps", completed: false },
          { id: "ge11", name: "Hamstring Lying Leg Curls", reps: "3 sets x 15 reps", completed: false },
          { id: "ge12", name: "Hanging Leg Raises", reps: "3 sets x 15 reps", completed: false }
        ]},
        Thursday: { focus: "Push Hypertrophy", exercises: [
          { id: "ge13", name: "Dumbbell Chest Flyes", reps: "3 sets x 15 reps", completed: false },
          { id: "ge14", name: "Lateral Raises", reps: "4 sets x 15 reps", completed: false }
        ]},
        Friday: { focus: "Pull Hypertrophy", exercises: [
          { id: "ge15", name: "Seated Cable Rows", reps: "3 sets x 12 reps", completed: false },
          { id: "ge16", name: "Hammer Curls", reps: "3 sets x 12 reps", completed: false }
        ]},
        Saturday: { focus: "Legs & Abs Heavy", exercises: [
          { id: "ge17", name: "Romanian Deadlifts", reps: "3 sets x 10 reps", completed: false },
          { id: "ge18", name: "Standing Calf Raises", reps: "4 sets x 20 reps", completed: false }
        ]},
        Sunday: { focus: "Active Recovery", exercises: [
          { id: "ge19", name: "Sauna / Light Cardio & Stretch", reps: "20 mins", completed: false }
        ]}
      }
    };
  }

  // Mark onboarding as completed
  appState.user.onboardingCompleted = true;
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (e) {}

  // Save state to Firestore & Local
  saveState();

  setTimeout(() => {
    if (isFullOnboardingScreen) {
      if (typeof showAppScreen === 'function') showAppScreen();
    } else {
      closeOnboardingChat();
    }
    renderApp();
    if (window.confetti) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }
  }, 1600);
}

// ==================== WEB SPEECH VOICE COMMAND ENGINE ====================
let activeSpeechRecognition = null;

function toggleVoiceRecognition(inputId, micBtnId) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice Speech Recognition is not supported in this browser. Please type your message.");
    return;
  }

  const micBtn = document.getElementById(micBtnId);
  const inputEl = document.getElementById(inputId);

  if (activeSpeechRecognition) {
    activeSpeechRecognition.stop();
    activeSpeechRecognition = null;
    if (micBtn) micBtn.classList.remove('mic-listening');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  activeSpeechRecognition = recognition;
  if (micBtn) micBtn.classList.add('mic-listening');

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (inputEl) inputEl.value = transcript;
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (micBtn) micBtn.classList.remove('mic-listening');
    activeSpeechRecognition = null;
  };

  recognition.onend = () => {
    if (micBtn) micBtn.classList.remove('mic-listening');
    activeSpeechRecognition = null;

    // Auto-execute voice command if transcript captured!
    if (inputEl && inputEl.value.trim().length > 0) {
      if (inputId === 'chatInputScreen') {
        handleUserChatInputScreen();
      } else {
        handleUserChatInput();
      }
    }
  };

  recognition.start();
}

window.openFullScreenAIChat = openFullScreenAIChat;

window.toggleVoiceRecognition = toggleVoiceRecognition;
