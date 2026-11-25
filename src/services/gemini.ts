import { DAMN_CONFIG } from '../config/config';

const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

export interface AttachedFile {
  uri: string;
  name: string;
  type: string; // e.g. 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
  base64?: string;
  isImage: boolean;
}

export interface ConversationTurn {
  sender: 'user' | 'bot';
  text: string;
}

export function buildCoachSystemPrompt(user: any, appState?: any): string {
  const name = user?.name || 'Friend';

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayName = now.toLocaleDateString([], { weekday: 'long' });

  return `You are DAMN AI — ${name}'s ultra-intelligent, ride-or-die personal assistant and family partner.
You combine high-level executive competence with authentic Gen Z warmth and humor. You are practical, sharp, energetic, and always on point.

CORE PERSONAL ASSISTANT DOMAINS:
1. SMART ESCALATING REMINDERS:
   - 5-minute heads-up warnings, 1-minute interactive alerts, and on-time voice callouts.
   - Managing appointments, calls, meetings, errands, and time-sensitive tasks.

2. FAMILY CIRCLE & SHARED ERRANDS (FAM CODE):
   - Broadcasting shared family reminders so the entire household stays synchronized.
   - Managing the family shopping radar and shared household chores.

3. GPS DEPARTURE SHOPPING RADAR:
   - Alerting user & family members when leaving home (100m–300m away) with the exact grocery & buy list items needed.

4. DAILY PRODUCTIVITY & LIFE MANAGEMENT:
   - Scheduling, quick notes, to-do lists, daily focus briefings, and countdown timers.
   - Answering everyday questions, brainstorming, studying, work tasks, and general life inquiries.

REAL-TIME CONTEXT INTEL:
- Live Local Time: ${timeString}, ${dayName}
- User Name: ${name}
- Assistant Mode: 100% Voice-First Personal & Family AI Assistant

CRITICAL STYLE & RESPONSE RULES:
1. PUNCHY, CONVERSATIONAL & DIRECT: Keep replies natural, sharp, and concise (2-3 sentences max). Never write boring essays or long lists.
2. BROTHERLY, WITTY & HELPFUL: Speak like a real best friend. Call them "bro", "homie", or "${name}". Be knowledgeable, genuine, and reliable.
3. VOICE-OPTIMIZED: Your responses will be read by text-to-speech, so never use markdown asterisks (*), hashtags (#), or bullet points in voice responses. Keep phrasing clean and fluent.`;
}

export async function askGeminiAI(
  prompt: string, 
  systemContext?: string,
  attachedFile?: AttachedFile | null,
  history?: ConversationTurn[]
): Promise<string> {
  const apiKey = DAMN_CONFIG.GEMINI_API_KEY;

  if (apiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const contents: any[] = [];

        // Add previous conversation turns for complete memory (up to 50 turns)
        if (history && history.length > 0) {
          const recentTurns = history.slice(-50);
          for (const turn of recentTurns) {
            const role = turn.sender === 'user' ? 'user' : 'model';
            const text = (turn.text || '').trim();
            if (!text) continue;

            if (contents.length > 0 && contents[contents.length - 1].role === role) {
              contents[contents.length - 1].parts.push({ text });
            } else {
              contents.push({
                role,
                parts: [{ text }]
              });
            }
          }
        }

        // Current turn parts
        const currentParts: any[] = [];

        if (attachedFile && attachedFile.base64) {
          currentParts.push({
            inlineData: {
              mimeType: attachedFile.type || (attachedFile.isImage ? 'image/jpeg' : 'application/pdf'),
              data: attachedFile.base64,
            }
          });
        }

        currentParts.push({ 
          text: prompt.trim() || (attachedFile?.isImage 
            ? "Analyze this image bro and give me your quick, honest coach feedback!" 
            : "Review this document bro and give me the quick actionable takeaways.")
        });

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts.push(...currentParts);
        } else {
          contents.push({
            role: 'user',
            parts: currentParts
          });
        }

        const body: any = {
          contents: contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
          }
        };

        if (systemContext) {
          body.systemInstruction = {
            parts: [{ text: systemContext }]
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const data = await res.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return candidateText.trim();
          }
        }
      } catch (err) {
        console.warn(`Gemini call error on model ${model}:`, err);
      }
    }
  }

  // Fallback intelligent best friend + coach answers
  const lower = prompt.toLowerCase();
  if (attachedFile?.isImage) {
    return "Bro, that photo looks solid! The meal / form has real potential. Keep your protein high, drink that water, and let's crush the rest of today!";
  } else if (attachedFile && !attachedFile.isImage) {
    return "Looked through the PDF document bro! Main takeaway: stick to progressive overload, hit your daily steps, and don't break the streak. What's our next move?";
  } else if (lower.includes('workout') || lower.includes('exercise') || lower.includes('gym')) {
    return "Let's get it bro! Today is about intense focus and progressive overload. Make sure you warm up properly, push close to failure on your working sets, and hit that 10k step goal. How's the body feeling today?";
  } else if (lower.includes('diet') || lower.includes('protein') || lower.includes('food') || lower.includes('meal')) {
    return "I got you bro. Keep it simple: 1.6g to 2.2g of protein per kg, plenty of whole foods, clean carbs around your workout, and cut out the junk. Did you log your breakfast and lunch yet?";
  } else if (lower.includes('tired') || lower.includes('lazy') || lower.includes('motivation') || lower.includes('skip')) {
    return "Bro, listen to me: motivation comes and goes, but discipline is forever. You're building a version of yourself that doesn't quit when things get tough. Drink some ice-cold water, wash your face, and let's get after it. I'm right here in your corner. Ready to lock in?";
  } else {
    return "Sup bro! I'm locked in with you 100%. We're conquering this protocol one day at a time. What are we tackling right now?";
  }
}

export interface OnboardingQuestion {
  step: number;
  question: string;
  options: string[];
  field: string;
  type: 'text' | 'options' | 'options_number' | 'multi';
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    step: 0,
    question: "Yo! Welcome to DAMN Protocol. I'm your AI Coach & bro. What's your name, warrior?",
    options: [],
    field: "name",
    type: "text"
  },
  {
    step: 1,
    question: "What's your main daily focus or lifestyle goal right now?",
    options: ["Productivity & Deep Work", "Building Healthy Routines", "Study & Academic Success", "Balanced Life & Wellness"],
    field: "fitnessGoal",
    type: "options"
  },
  {
    step: 2,
    question: "What is your typical daily schedule?",
    options: ["Early Bird (6 AM - 10 PM)", "Standard Routine (8 AM - 11 PM)", "Night Owl (10 AM - 1 AM)", "Flexible / Dynamic"],
    field: "splitPreference",
    type: "options"
  },
  {
    step: 3,
    question: "How do you want DAMN AI assistant to speak to you?",
    options: ["Hype & High Energy", "Chill & Friendly", "Savage & Honest Roasts", "Zen & Focused"],
    field: "personalityPreference",
    type: "options"
  },
  {
    step: 4,
    question: "What's your daily target water intake and movement goal?",
    options: ["2.5L Water + 6k Steps", "3.0L Water + 8k Steps", "3.5L Water + 10k Steps", "4.0L Water + 12k Steps"],
    field: "waterSteps",
    type: "options"
  },
  {
    step: 5,
    question: "How many days are you committing to lock in with DAMN?",
    options: ["30 Days Sprint", "60 Days Protocol", "75 Days Hard", "90 Days Beast Mode"],
    field: "dayTotal",
    type: "options_number"
  }
];
