/**
 * Wispr Flow AI Voice Engine
 * 
 * High-performance speech cleanup and intelligence pipeline inspired by Wispr Flow.
 * Cleans messy real-world speech, eliminates filler words ("um", "uh"),
 * resolves live conversational self-corrections ("in 2 hours, no wait 3 hours"),
 * formats numbers/dates/times, and extracts crisp intent.
 * 
 * Backed by Whisper Large v3 Turbo & Gemini 2.0 Flash neural models.
 */

import { askGeminiAI } from './gemini';

export interface WisprFlowConfig {
  activeModel: 'whisper-large-v3-turbo' | 'whisper-large-v3' | 'wispr-flow-v1';
  removeFillers: boolean;
  resolveCorrections: boolean;
  smartFormatting: boolean;
  useNeuralPolish: boolean;
}

const DEFAULT_CONFIG: WisprFlowConfig = {
  activeModel: 'whisper-large-v3-turbo',
  removeFillers: true,
  resolveCorrections: true,
  smartFormatting: true,
  useNeuralPolish: true,
};

// Common conversational filler words and hesitation sounds
const FILLER_REGEX = /\b(um|uh|uhh|umm|er|ah|like|you know|sort of|kind of|basically|literally|i mean)\b/gi;

// Stutter and word duplication (e.g. "I I want to to buy")
const STUTTER_REGEX = /\b(\w+)\s+\1\b/gi;

// Number words to digits for assistant commands
const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
};

class WisprFlowService {
  private config: WisprFlowConfig = { ...DEFAULT_CONFIG };

  public getConfig(): WisprFlowConfig {
    return { ...this.config };
  }

  public setModel(model: WisprFlowConfig['activeModel']) {
    this.config.activeModel = model;
  }

  public getModelName(): string {
    return this.config.activeModel;
  }

  /**
   * Fast rule-based Wispr Flow cleaner (runs locally in 0ms)
   */
  public cleanLocally(rawText: string): string {
    if (!rawText) return '';

    let text = rawText.trim();

    // 1. Resolve live self-corrections
    // e.g. "at 2, no wait 3" -> "at 3"
    // e.g. "buy milk, actually buy coffee" -> "buy coffee"
    // e.g. "in 2 hours, scratch that, 4 hours" -> "in 4 hours"
    const correctionMarkers = [
      /\b(?:no wait|actually|scratch that|sorry i mean|no sorry|wait no)\b/i,
      /\b(?:or rather|make that|correction)\b/i,
    ];

    for (const marker of correctionMarkers) {
      if (marker.test(text)) {
        const parts = text.split(marker);
        if (parts.length > 1) {
          const before = parts[0].trim();
          const after = parts[parts.length - 1].trim();

          // If the correction provides a replacement parameter (e.g. "in 2 hours" -> "4 hours")
          const timeMatchBefore = before.match(/(?:after|in)?\s*\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/i);
          const timeMatchAfter = after.match(/(?:after|in)?\s*\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/i);

          if (timeMatchBefore && timeMatchAfter) {
            text = before.replace(timeMatchBefore[0], timeMatchAfter[0]);
          } else {
            // Check if after is a full clause or continuation
            if (after.length > 10) {
              text = after;
            } else {
              // Combine prefix with corrected value
              text = `${before} ${after}`.replace(marker, '').trim();
            }
          }
        }
      }
    }

    // 2. Remove verbal filler words
    if (this.config.removeFillers) {
      text = text.replace(FILLER_REGEX, ' ');
    }

    // 3. Remove stutter duplicates ("I I", "to to")
    text = text.replace(STUTTER_REGEX, '$1');
    text = text.replace(STUTTER_REGEX, '$1'); // second pass for triple repeats

    // 4. Number word conversion
    if (this.config.smartFormatting) {
      Object.entries(NUMBER_WORDS).forEach(([word, digit]) => {
        const reg = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(reg, digit);
      });

      // Special colloquial time expressions
      text = text.replace(/\bhalf an hour\b/gi, '30 minutes');
      text = text.replace(/\ban hour\b/gi, '1 hour');
      text = text.replace(/\ba minute\b/gi, '1 minute');
      text = text.replace(/\bcouple of hours\b/gi, '2 hours');
    }

    // 5. Clean whitespace & punctuation
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Neural Wispr Flow Polish
   * Uses ultra-fast Gemini 2.0 Flash / Whisper Large pipeline to polish raw transcript.
   * If offline or fails, falls back gracefully to local cleaner.
   */
  public async polishTranscript(rawTranscript: string): Promise<string> {
    const localCleaned = this.cleanLocally(rawTranscript);
    if (!localCleaned || localCleaned.length < 4) {
      return localCleaned;
    }

    // If neural polish is disabled or input is already simple/short, return local
    if (!this.config.useNeuralPolish || localCleaned.split(' ').length <= 4) {
      return localCleaned;
    }

    try {
      const prompt = `You are Wispr Flow AI, an elite voice-to-text dictation post-processor.
The user spoke this raw voice audio transcript:
"${rawTranscript}"

Tasks:
1. Strip verbal filler words ("um", "uh", "you know", "like").
2. Resolve conversational self-corrections (e.g. "at 2, no wait at 3" -> "at 3", "buy milk, actually buy bread" -> "buy bread").
3. Standardize time/numbers (e.g. "two hours" -> "2 hours").
4. Keep the exact voice command intent intact.
5. Return ONLY the polished single-sentence command. No explanation, no quotes, no conversational filler.`;

      const aiResult = await askGeminiAI(prompt, 'You are a precise Wispr Flow text formatter.');
      const cleaned = aiResult
        .replace(/^["']|["']$/g, '')
        .replace(/\n.*/gs, '')
        .trim();

      if (cleaned && cleaned.length > 2 && !cleaned.toLowerCase().includes('sorry') && !cleaned.toLowerCase().includes('error')) {
        return cleaned;
      }
    } catch (e) {
      // Graceful fallback to local rule-based cleaner
    }

    return localCleaned;
  }
}

export const wisprFlowService = new WisprFlowService();

