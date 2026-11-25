import { AppState, TabType, TaskItem } from '../types';
import { askGeminiAI, buildCoachSystemPrompt } from './gemini';
import { calculateExecutionPct } from './storage';
import { reminderService, SmartReminder } from './reminderService';
import { shoppingLocationService, ShoppingItem } from './shoppingLocationService';
import { familyService } from './familyService';
import { wisprFlowService } from './wisprFlowService';

export interface CommandResult {
  actionType:
    | 'task_add'
    | 'task_complete'
    | 'task_query'
    | 'smart_reminder'
    | 'shopping_list'
    | 'navigation'
    | 'status_check'
    | 'timer'
    | 'hype'
    | 'roast'
    | 'joke'
    | 'tool'
    | 'ai_chat';
  title: string;
  detail: string;
  spokenResponse: string;
  targetTab?: TabType;
  timerSeconds?: number;
  data?: any;
}

export interface AssistantContext {
  state: AppState;
  addWater?: (amountMl: number) => void;
  addSteps?: (amountSteps: number) => void;
  toggleTask: (section: string, taskId: string) => void;
  addCustomTask: (section: string, label: string, xp?: number) => void;
  takeSupplement?: (supplementId: string) => void;
  setActiveTab: (tab: TabType) => void;
  openModal: (modalName: string, payload?: any) => void;
}

// Gen Z Personality quotes
const HYPE_QUOTES = [
  "We don't do average here, bro! You woke up to win today. Lock in and execute with zero excuses!",
  "Main character energy right now! The future version of you is thanking you for staying sharp today. Let's get it!",
  "Unstoppable momentum! Every single reminder cleared and every task handled puts you in the top 1%. Let's keep winning!",
  "Absolute mastery! You're building pure consistency and peace of mind that cannot be shaken. Keep crushing your day!",
];

const ROAST_QUOTES = [
  "Bro, stop staring at your phone like a frozen NPC and actually do what you planned! Your goals aren't going to execute themselves.",
  "You told me you wanted peak productivity, but your screen time today is whispering 'maybe tomorrow'. Close the apps and get to work!",
  "Excuses don't pay bills or build freedom, homie! Either knock out that reminder right now or stay average.",
  "Bro thinks thinking about working counts as working! Finish those pending tasks before the day closes.",
];

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why did the smartphone need glasses? Because it lost all its contacts!",
  "What is an AI's favorite snack? Microchips with a bit of data dip!",
  "Why was the computer cold? Because it left its Windows open!",
  "Why did the scarecrow become a CEO? Because he was outstanding in his field!",
  "Why did the Wi-Fi router break up with the phone? There was just no connection anymore!",
];

export async function processVoiceCommand(
  rawTranscript: string,
  context: AssistantContext,
  personality: 'hype' | 'chill' | 'savage' | 'zen' = 'hype'
): Promise<CommandResult> {
  // Apply Wispr Flow intelligent speech polishing (removes fillers, resolves self-corrections, normalizes numbers)
  const query = wisprFlowService.cleanLocally(rawTranscript);
  const lower = query.toLowerCase();
  const { state, toggleTask, addCustomTask, setActiveTab } = context;
  const user = state.user;

  // 0.0 FAMILY SHARED REMINDERS
  // e.g. "remind family dinner at 8pm", "remind family to pay electricity bill after 2 hours", "tell family tomorrow"
  if (
    lower.includes('remind family') ||
    lower.includes('family reminder') ||
    lower.includes('tell family') ||
    lower.includes('for family') && lower.includes('remind')
  ) {
    const hrMatch = lower.match(/(?:after|in)?\s*(\d+(\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
    const minMatch = lower.match(/(?:after|in)?\s*(\d+)\s*(?:minutes?|mins?|m)\b/);
    const dayMatch = lower.match(/(?:after|in)?\s*(\d+)\s*(?:days?|d)\b/);

    let delayMinutes = 120; // 2 hours default
    if (hrMatch && hrMatch[1]) delayMinutes = parseFloat(hrMatch[1]) * 60;
    else if (minMatch && minMatch[1]) delayMinutes = parseInt(minMatch[1], 10);
    else if (dayMatch && dayMatch[1]) delayMinutes = parseInt(dayMatch[1], 10) * 1440;
    else if (lower.includes('tomorrow')) delayMinutes = 1440;
    else if (lower.includes('tonight')) delayMinutes = 300;

    let reminderTitle = query
      .replace(/remind family/i, '')
      .replace(/family reminder/i, '')
      .replace(/tell family/i, '')
      .replace(/(?:after|in)?\s*\d+(\.\d+)?\s*(hours?|hrs?|minutes?|mins?|days?|d|h|m)\b/gi, '')
      .replace(/\b(to|that|about|for family)\b/gi, '')
      .trim();

    if (!reminderTitle || reminderTitle.toLowerCase() === 'this') {
      reminderTitle = 'Family Shared Reminder';
    }

    const reminder = familyService.addFamilyReminder(reminderTitle, delayMinutes, user.name || 'You');
    const spoken = `Locked in for the family! Scheduled "${reminderTitle}" for everyone with 5-minute and 1-minute alert escalation.`;

    return {
      actionType: 'smart_reminder',
      title: `👨‍👩‍👧 Family Reminder: ${reminder.title}`,
      detail: `Broadcast to Family Circle • 5m & 1m warnings armed`,
      spokenResponse: spoken,
      targetTab: 'family',
      data: reminder,
    };
  }

  // 0.01 FAMILY SHARED SHOPPING & ERRANDS
  // e.g. "add milk to family shopping list", "family shopping: bread and eggs", "buy milk for family"
  if (
    lower.includes('family shopping') ||
    lower.includes('family list') ||
    lower.includes('family groceries') ||
    (lower.includes('for family') && (lower.includes('buy') || lower.includes('shopping'))) ||
    lower.includes('add to family')
  ) {
    let rawItems = query;
    const splitters = [
      'add to family shopping list',
      'add to family shopping',
      'add to family list',
      'add to family',
      'family shopping list:',
      'family shopping list',
      'family shopping:',
      'family shopping',
      'family list:',
      'family list',
      'family groceries:',
      'family groceries',
      'buy for family:',
      'buy for family',
    ];

    for (const sp of splitters) {
      if (lower.includes(sp)) {
        rawItems = query.substring(lower.indexOf(sp) + sp.length);
        break;
      }
    }

    const items = familyService.addFamilyShoppingItems(rawItems, user.name || 'You');
    const itemNames = items.map((i) => i.name).join(', ');
    const spoken = `Added ${itemNames} to the family shopping radar! When anyone leaves home, DAMN will alert them to pick these up.`;

    return {
      actionType: 'shopping_list',
      title: `🛒 Family Shopping Radar`,
      detail: `${itemNames} • GPS Departure Radar Armed`,
      spokenResponse: spoken,
      targetTab: 'family',
      data: items,
    };
  }

  // 0.02 FAMILY HUB & FAM CODE NAVIGATION
  if (
    lower.includes('family code') ||
    lower.includes('fam code') ||
    lower.includes('family hub') ||
    lower.includes('open family') ||
    lower.includes('show family') ||
    lower.includes('connect family')
  ) {
    setActiveTab('family');
    const code = familyService.getFamCode();
    return {
      actionType: 'navigation',
      title: 'Family Hub',
      detail: `FAM CODE: ${code}`,
      spokenResponse: `Opening Family Hub! Your FAM CODE is ${code}. Share it with your family to connect instantly.`,
      targetTab: 'family',
    };
  }

  // 0. SMART ESCALATING MULTI-STAGE REMINDERS
  // e.g. "remind me this after 2 hr", "remind me workout after 1 hour", "remind me after 30 minutes"
  if (lower.startsWith('remind me') || lower.includes('remind me')) {
    const hrMatch = lower.match(/(?:after|in)?\s*(\d+(\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
    const minMatch = lower.match(/(?:after|in)?\s*(\d+)\s*(?:minutes?|mins?|m)\b/);
    const secMatch = lower.match(/(?:after|in)?\s*(\d+)\s*(?:seconds?|secs?|s)\b/);

    let totalSeconds = 0;
    if (hrMatch && hrMatch[1]) totalSeconds += parseFloat(hrMatch[1]) * 3600;
    if (minMatch && minMatch[1]) totalSeconds += parseInt(minMatch[1], 10) * 60;
    if (secMatch && secMatch[1]) totalSeconds += parseInt(secMatch[1], 10);

    // If duration not explicitly specified, default to 2 hours (7200s)
    if (totalSeconds === 0) totalSeconds = 7200;

    let reminderTitle = query
      .replace(/remind me/i, '')
      .replace(/(?:after|in)?\s*\d+(\.\d+)?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?|h|m|s)\b/gi, '')
      .replace(/\bto\b/i, '')
      .trim();

    if (!reminderTitle || reminderTitle.toLowerCase() === 'this') {
      reminderTitle = 'Scheduled Protocol Reminder';
    }

    const { reminder, message } = await reminderService.scheduleSmartReminder(
      reminderTitle,
      totalSeconds
    );

    return {
      actionType: 'smart_reminder',
      title: `⚡ Smart Reminder: ${reminder.title}`,
      detail: `5m Heads-Up • 1m Reaction Warning • On-Time Voice Wake-Up`,
      spokenResponse: message,
      data: reminder,
    };
  }

  // 0.1 SMART GEOFENCED LOCATION SHOPPING & BUY LIST
  // e.g. "i wanna buy milk, eggs, creatine", "things i wanna buy: whey protein", "show my buy list"
  if (
    lower.includes('wanna buy') ||
    lower.includes('want to buy') ||
    lower.includes('need to buy') ||
    lower.includes('buy list') ||
    lower.includes('shopping list') ||
    lower.includes('things to buy')
  ) {
    if (lower.includes('show') || lower.includes('what') || lower.includes('list items')) {
      const unbought = shoppingLocationService.getUnpurchasedItems();
      const zone = shoppingLocationService.getDepartureZone();

      if (unbought.length === 0) {
        return {
          actionType: 'shopping_list',
          title: 'Buy List Clear',
          detail: 'No unpurchased items listed',
          spokenResponse: "Your buy list is completely empty right now, bro! Tell me what you wanna buy anytime.",
        };
      }

      const itemNames = unbought.map((i) => i.name).join(', ');
      const spoken = `You have ${unbought.length} items to buy: ${itemNames}. Location departure alert is locked in (100 to 300m away)!`;

      return {
        actionType: 'shopping_list',
        title: `🛒 ${unbought.length} Items To Buy`,
        detail: `${itemNames} • ${zone ? '📍 Geofence Active' : '📍 Location Ready'}`,
        spokenResponse: spoken,
        data: unbought,
      };
    }

    // Extract item tokens
    let rawItems = query;
    const splitters = [
      'wanna buy',
      'want to buy',
      'need to buy',
      'add to buy list',
      'things i wanna buy:',
      'things i wanna buy',
      'things to buy:',
      'things to buy',
      'buy list:',
      'buy list',
    ];

    for (const sp of splitters) {
      if (lower.includes(sp)) {
        rawItems = query.substring(lower.indexOf(sp) + sp.length);
        break;
      }
    }

    const itemTokens = rawItems
      .replace(/and/gi, ',')
      .split(/,|\n/)
      .map((s) => s.trim().replace(/^[-•*]/, '').trim())
      .filter((s) => s.length > 1 && !['this', 'these', 'items', 'stuff'].includes(s.toLowerCase()));

    if (itemTokens.length > 0) {
      const { added, message, locationLocked } = await shoppingLocationService.addItemsToBuy(itemTokens);

      return {
        actionType: 'shopping_list',
        title: `🛒 Buy List: ${added.length} Items Noted`,
        detail: `${added.join(', ')} • ${
          locationLocked ? '📍 Present Spot Locked (100m-300m departure alert active)' : 'Saved to Buy List'
        }`,
        spokenResponse: message,
        data: added,
      };
    }
  }

  // 1. EVERYDAY QUICK TO-DO / NOTES
  const addTaskPrefixes = [
    'add note',
    'take note',
    'new note',
    'todo',
    'to do',
    'remind me to',
  ];
  for (const prefix of addTaskPrefixes) {
    if (lower.startsWith(prefix) || lower.includes(` ${prefix} `)) {
      const parts = lower.split(prefix);
      const noteLabel = (parts[1] || '').trim();
      if (noteLabel.length > 1) {
        const cleanLabel = noteLabel.charAt(0).toUpperCase() + noteLabel.slice(1);
        addCustomTask('discipline', cleanLabel, 20);

        return {
          actionType: 'task_add',
          title: 'Note Created',
          detail: cleanLabel,
          spokenResponse: `Noted: "${cleanLabel}". I've recorded it in your personal to-do list.`,
        };
      }
    }
  }

  // 2. DAILY FOCUS & PRIORITY
  if (
    lower.includes('what should i do') ||
    lower.includes('what to focus') ||
    lower.includes('my focus') ||
    lower.includes('priorities')
  ) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const spoken = `Happy ${todayName}! Your top priority is checking your family reminders, tackling pending shopping errands, and staying ahead of your schedule. What would you like to tackle right now?`;

    return {
      actionType: 'status_check',
      title: `${todayName} Priority Focus`,
      detail: `Family reminders, errands & key tasks`,
      spokenResponse: spoken,
    };
  }

  // 8. NAVIGATION COMMANDS
  // e.g. "open squad", "open reminders", "open analytics", "go to checklist", "go home"
  if (lower.includes('open') || lower.includes('go to') || lower.includes('switch to') || lower.includes('show')) {
    if (lower.includes('reminder') || lower.includes('reminders') || lower.includes('errand') || lower.includes('errands') || lower.includes('shopping') || lower.includes('buy list')) {
      setActiveTab('reminders');
      return {
        actionType: 'navigation',
        title: 'Reminders & Errands Opened',
        detail: 'Viewing smart escalating alerts & shopping radar',
        spokenResponse: 'Opening Reminders and Errands! Check your escalating timers and shopping radar.',
        targetTab: 'reminders',
      };
    }
    if (lower.includes('family') || lower.includes('fam code') || lower.includes('squad') || lower.includes('leaderboard')) {
      setActiveTab('family');
      return {
        actionType: 'navigation',
        title: 'Family Hub',
        detail: `FAM CODE: ${familyService.getFamCode()}`,
        spokenResponse: 'Opening Family Hub! Check your shared reminders, family shopping list, and connected members.',
        targetTab: 'family',
      };
    }
    if (lower.includes('checklist') || lower.includes('tasks') || lower.includes('to do')) {
      setActiveTab('reminders');
      return {
        actionType: 'navigation',
        title: 'Reminders & Tasks Screen',
        detail: 'Viewing all daily tasks and alerts',
        spokenResponse: 'Opening your Reminders and Daily Schedule! Let’s tick off those items.',
        targetTab: 'reminders',
      };
    }
    if (lower.includes('analytics') || lower.includes('stats') || lower.includes('progress') || lower.includes('overview')) {
      setActiveTab('analytics');
      return {
        actionType: 'navigation',
        title: 'Overview Screen Opened',
        detail: 'Viewing assistant activity and family matrix',
        spokenResponse: 'Opening Overview! Check out your activity history and family circle matrix.',
        targetTab: 'analytics',
      };
    }
    if (lower.includes('home') || lower.includes('dashboard') || lower.includes('main')) {
      setActiveTab('dashboard');
      return {
        actionType: 'navigation',
        title: 'Dashboard Opened',
        detail: 'Main voice hub',
        spokenResponse: 'Back to the main Command Center!',
        targetTab: 'dashboard',
      };
    }
  }

  // 9. TIMER & QUICK TOOLS
  // e.g. "set a timer for 5 minutes", "timer 30 seconds", "timer 2 min"
  if (lower.includes('timer') || lower.includes('stopwatch')) {
    let seconds = 300; // default 5 mins
    const minMatch = lower.match(/(\d+)\s*(minute|minutes|min|mins)/);
    const secMatch = lower.match(/(\d+)\s*(second|seconds|sec|secs)/);

    if (minMatch && minMatch[1]) {
      seconds = parseInt(minMatch[1], 10) * 60;
    } else if (secMatch && secMatch[1]) {
      seconds = parseInt(secMatch[1], 10);
    }

    const minDisplay = Math.floor(seconds / 60);
    const secDisplay = seconds % 60;
    const timeLabel = minDisplay > 0 ? `${minDisplay} minute${minDisplay > 1 ? 's' : ''}` : `${secDisplay} seconds`;

    return {
      actionType: 'timer',
      title: `Timer Set: ${timeLabel}`,
      detail: 'Countdown running in assistant',
      spokenResponse: `Timer started for ${timeLabel}! Focus in, I'll alert you when time is up.`,
      timerSeconds: seconds,
    };
  }

  // Tool: Flip a Coin
  if (lower.includes('flip a coin') || lower.includes('coin flip')) {
    const isHeads = Math.random() > 0.5;
    const result = isHeads ? 'HEADS' : 'TAILS';
    return {
      actionType: 'tool',
      title: `Coin Flip: ${result}`,
      detail: `Result: ${result}`,
      spokenResponse: `Flipped a coin... It landed on ${result}!`,
    };
  }

  // Tool: Roll a Dice
  if (lower.includes('roll a dice') || lower.includes('roll a die')) {
    const dice = Math.floor(Math.random() * 6) + 1;
    return {
      actionType: 'tool',
      title: `Dice Rolled: ${dice}`,
      detail: `You rolled a ${dice}`,
      spokenResponse: `Rolling the dice... You rolled a ${dice}!`,
    };
  }

  // 10. DAILY STATUS & BRIEFING
  if (
    lower.includes('status') ||
    lower.includes('how am i doing') ||
    lower.includes('briefing') ||
    lower.includes('my summary')
  ) {
    const activeReminders = reminderService.getReminders().filter(r => !r.completed).length;
    const shoppingCount = familyService.getState().shoppingItems.filter(i => !i.purchased).length;
    const spoken = `Here's your live briefing, ${user.name || 'bro'}: You have ${activeReminders} active reminders and ${shoppingCount} items on the family shopping radar. Everything is running smoothly!`;

    return {
      actionType: 'status_check',
      title: `${activeReminders} Reminders • ${shoppingCount} Shopping`,
      detail: `All systems green • FAM: ${familyService.getFamCode()}`,
      spokenResponse: spoken,
    };
  }

  // 11. HYPE ME UP
  if (
    lower.includes('hype me up') ||
    lower.includes('motivate me') ||
    lower.includes('need motivation') ||
    lower.includes('give me energy')
  ) {
    const quote = HYPE_QUOTES[Math.floor(Math.random() * HYPE_QUOTES.length)];
    return {
      actionType: 'hype',
      title: '⚡ HYPE PROTOCOL ACTIVATED',
      detail: quote,
      spokenResponse: quote,
    };
  }

  // 12. ROAST ME
  if (lower.includes('roast me') || lower.includes('roast my discipline') || lower.includes('be harsh')) {
    const roast = ROAST_QUOTES[Math.floor(Math.random() * ROAST_QUOTES.length)];
    return {
      actionType: 'roast',
      title: '🔥 SAVAGE BRO ROAST',
      detail: roast,
      spokenResponse: roast,
    };
  }

  // 13. JOKES
  if (lower.includes('joke') || lower.includes('make me laugh') || lower.includes('funny')) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    return {
      actionType: 'joke',
      title: '😄 DAMN JOKE',
      detail: joke,
      spokenResponse: joke,
    };
  }

  // 14. GENERAL AI BRAIN (GEMINI AI FALLBACK)
  // For all other queries: questions, advice, fitness science, meal suggestions, homework, conversation
  try {
    const systemPrompt = `${buildCoachSystemPrompt(
      user,
      state
    )}\n\nCRITICAL VOICE ASSISTANT INSTRUCTION: You are speaking aloud directly to ${
      user?.name || 'the user'
    }. Keep your response punchy, natural, conversational, and direct (2-3 sentences max). Use Gen Z brotherhood energy. Never use markdown headers, asterisks, or bullet lists because your text is read directly by text-to-speech.`;

    const aiReply = await askGeminiAI(query, systemPrompt);
    const cleanSpeech = aiReply.replace(/[*#_`]/g, '').trim();

    return {
      actionType: 'ai_chat',
      title: 'DAMN',
      detail: cleanSpeech,
      spokenResponse: cleanSpeech,
    };
  } catch (err) {
    const fallback = `I hear you, ${user.name || 'bro'}. Let's stay locked in on today's protocol and execute relentlessly!`;
    return {
      actionType: 'ai_chat',
      title: 'DAMN',
      detail: fallback,
      spokenResponse: fallback,
    };
  }
}

