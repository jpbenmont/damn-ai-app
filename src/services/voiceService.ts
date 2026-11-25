import { Platform, NativeModules } from 'react-native';
import * as Haptics from 'expo-haptics';
import { wisprFlowService } from './wisprFlowService';

const { DamnWakeModule } = NativeModules;

let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (err) {
  console.warn('ExpoSpeech module not linked in current APK:', err);
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  isWakeWordActive?: boolean;
  activeModel?: string;
}

export type VoiceListener = (state: VoiceState) => void;

class VoiceService {
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentTranscript: string = '';
  private listeners: Set<VoiceListener> = new Set();
  private nativeModule: any = null;
  private webRecognition: any = null;
  private speechSubscription: any = null;
  private isWakeWordActive: boolean = false;
  private wakeWordCallback: ((command: string) => void) | null = null;
  private restartTimeout: any = null;

  constructor() {
    this.initNativeSpeech();
  }

  private async initNativeSpeech() {
    if (Platform.OS !== 'web') {
      try {
        const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
        this.nativeModule = ExpoSpeechRecognitionModule;
      } catch (err) {
        console.warn('ExpoSpeechRecognitionModule not loaded:', err);
      }
    }
  }

  public subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(error: string | null = null) {
    const state: VoiceState = {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      transcript: this.currentTranscript,
      error,
      isWakeWordActive: this.isWakeWordActive,
      activeModel: wisprFlowService.getModelName(),
    };
    this.listeners.forEach((l) => l(state));
  }

  public getState(): VoiceState {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      transcript: this.currentTranscript,
      error: null,
      isWakeWordActive: this.isWakeWordActive,
      activeModel: wisprFlowService.getModelName(),
    };
  }

  /**
   * Request microphone & speech recognition permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          return true;
        }
        return true;
      }

      if (this.nativeModule?.requestPermissionsAsync) {
        const res = await this.nativeModule.requestPermissionsAsync();
        return res?.granted || res?.status === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('Permission request error:', e);
      return false;
    }
  }

  /**
   * Start listening for user's voice command
   */
  public async startListening(
    onResultCallback?: (transcript: string, isFinal: boolean) => void
  ): Promise<boolean> {
    try {
      if (this.isSpeaking) {
        await this.stopSpeaking();
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      this.currentTranscript = '';
      this.isListening = true;
      this.notify();

      // 1. Mobile Native recognition via ExpoSpeechRecognitionModule
      if (Platform.OS !== 'web' && this.nativeModule) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          this.isListening = false;
          this.notify('Microphone permission required');
          return false;
        }

        if (this.speechSubscription) {
          this.speechSubscription.remove?.();
          this.speechSubscription = null;
        }

        this.nativeModule.start({
          lang: 'en-US',
          interimResults: true,
          maxAlternatives: 1,
          continuous: this.isWakeWordActive,
        });

        if (this.nativeModule.addListener) {
          const subResult = this.nativeModule.addListener(
            'result',
            async (event: { results?: Array<{ transcript: string }>; isFinal?: boolean }) => {
              const rawText = event?.results?.[0]?.transcript || '';
              if (rawText) {
                // Apply real-time Wispr Flow local cleaning (strips fillers, stutters, formats numbers)
                const text = wisprFlowService.cleanLocally(rawText);
                this.currentTranscript = text;
                this.notify();

                // Check wake word in continuous mode
                if (this.isWakeWordActive && this.checkWakeWord(text)) {
                  return;
                }

                if (event?.isFinal) {
                  // Final result: apply deep Wispr Flow neural polishing
                  const polished = await wisprFlowService.polishTranscript(rawText);
                  this.currentTranscript = polished;
                  this.notify();
                  onResultCallback?.(polished, true);
                } else {
                  onResultCallback?.(text, false);
                }
              }
            }
          );
          const subEnd = this.nativeModule.addListener('end', () => {
            this.isListening = false;
            this.notify();
            // In wake word mode, auto restart listening
            if (this.isWakeWordActive && !this.isSpeaking) {
              this.scheduleWakeWordRestart();
            }
          });
          const subError = (err: any) => {
            console.warn('Native speech error:', err);
            this.isListening = false;
            this.notify(err?.message || 'Speech recognition error');
            if (this.isWakeWordActive && !this.isSpeaking) {
              this.scheduleWakeWordRestart();
            }
          };

          const subErrListener = this.nativeModule.addListener('error', subError);

          this.speechSubscription = {
            remove: () => {
              subResult?.remove?.();
              subEnd?.remove?.();
              subErrListener?.remove?.();
            },
          };
        }

        return true;
      }

      // 2. Web Speech Recognition fallback
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          if (this.webRecognition) {
            try {
              this.webRecognition.abort();
            } catch {}
          }

          const recognizer = new SpeechRec();
          recognizer.continuous = this.isWakeWordActive;
          recognizer.interimResults = true;
          recognizer.lang = 'en-US';

          recognizer.onresult = (event: any) => {
            let transcript = '';
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
              if (event.results[i].isFinal) isFinal = true;
            }
            if (transcript) {
              this.currentTranscript = transcript;
              this.notify();

              if (this.isWakeWordActive && this.checkWakeWord(transcript)) {
                return;
              }

              onResultCallback?.(transcript, isFinal);
            }
          };

          recognizer.onerror = (event: any) => {
            console.warn('Web speech error:', event?.error);
            this.isListening = false;
            this.notify(event?.error || 'Speech error');
            if (this.isWakeWordActive && !this.isSpeaking) {
              this.scheduleWakeWordRestart();
            }
          };

          recognizer.onend = () => {
            this.isListening = false;
            this.notify();
            if (this.isWakeWordActive && !this.isSpeaking) {
              this.scheduleWakeWordRestart();
            }
          };

          recognizer.start();
          this.webRecognition = recognizer;
          return true;
        }
      }

      this.isListening = false;
      this.notify('Speech recognition not available on this device');
      return false;
    } catch (err: any) {
      console.warn('Failed to start listening:', err);
      this.isListening = false;
      this.notify(err?.message || 'Failed to start listening');
      return false;
    }
  }

  /**
   * Check if transcript contains Wake Word ("Hey DAMN", "OK DAMN", "DAMN")
   */
  private checkWakeWord(text: string): boolean {
    const clean = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const wakeWords = ['hey damn', 'ok damn', 'yo damn', 'hi damn', 'hello damn', 'damn'];

    let matched = false;
    let remainingCommand = '';

    for (const ww of wakeWords) {
      if (clean === ww || clean.startsWith(ww + ' ') || clean.includes(' ' + ww)) {
        matched = true;
        // strip the wake word out
        remainingCommand = clean.replace(new RegExp(`^${ww}|\\b${ww}\\b`, 'i'), '').trim();
        break;
      }
    }

    if (!matched) return false;

    // 1. Turn on screen & bring DAMN over lockscreen if device was asleep/locked
    if (Platform.OS === 'android' && DamnWakeModule?.wakeUpScreen) {
      try {
        DamnWakeModule.wakeUpScreen();
      } catch (e) {
        console.warn('DamnWakeModule.wakeUpScreen error:', e);
      }
    }

    // 2. Trigger wake-up haptic
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // 3. Spoken command vs wake-up acknowledgement
    if (remainingCommand.length > 2) {
      // Command was spoken in the same breath! e.g. "Hey DAMN remind me this after 2 hours"
      this.wakeWordCallback?.(remainingCommand);
    } else {
      // Wake word only spoken e.g. "Hey DAMN" -> speak acknowledgement and listen for command
      this.speak("Yo bro! I'm listening. What do you need?", {
        personality: 'hype',
        onDone: () => {
          this.startListening((cmd, isFinal) => {
            if (isFinal && cmd.trim().length > 1) {
              this.stopListening();
              this.wakeWordCallback?.(cmd);
            }
          });
        },
      });
    }
    return true;
  }

  private scheduleWakeWordRestart() {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.isWakeWordActive && !this.isSpeaking && !this.isListening) {
        this.startListening();
      }
    }, 350);
  }

  /**
   * Enable hands-free "Hey DAMN" wake word detection (works with screen turned off & locked)
   */
  public async enableWakeWord(onCommand: (command: string) => void): Promise<boolean> {
    this.isWakeWordActive = true;
    this.wakeWordCallback = onCommand;
    this.notify();

    if (Platform.OS === 'android' && DamnWakeModule?.startForegroundWakeService) {
      try {
        await DamnWakeModule.startForegroundWakeService();
      } catch (err) {
        console.warn('startForegroundWakeService error:', err);
      }
    }

    return await this.startListening();
  }

  /**
   * Disable wake word mode
   */
  public async disableWakeWord() {
    this.isWakeWordActive = false;
    this.wakeWordCallback = null;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    if (Platform.OS === 'android' && DamnWakeModule?.stopForegroundWakeService) {
      try {
        await DamnWakeModule.stopForegroundWakeService();
      } catch (err) {
        console.warn('stopForegroundWakeService error:', err);
      }
    }

    await this.stopListening();
    this.notify();
  }

  /**
   * Stop listening for voice command
   */
  public async stopListening() {
    this.isListening = false;
    try {
      if (Platform.OS !== 'web' && this.nativeModule) {
        this.nativeModule.stop();
      } else if (this.webRecognition) {
        this.webRecognition.stop();
      }
    } catch {}
    this.notify();
  }

  /**
   * Speak text out loud with Gen-Z voice styling
   */
  public async speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      personality?: 'hype' | 'chill' | 'savage' | 'zen';
      onDone?: () => void;
    }
  ): Promise<void> {
    if (!text || text.trim().length === 0) return;

    const cleanSpeechText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    try {
      this.isSpeaking = true;
      this.notify();

      let rate = options?.rate || 1.05;
      let pitch = options?.pitch || 1.0;

      if (options?.personality === 'hype') {
        rate = 1.12;
        pitch = 1.05;
      } else if (options?.personality === 'chill') {
        rate = 0.98;
        pitch = 0.95;
      } else if (options?.personality === 'savage') {
        rate = 1.08;
        pitch = 0.98;
      }

      // If on Native (Android / iOS)
      if (Platform.OS !== 'web' && Speech?.speak) {
        try {
          await Speech.stop();
        } catch {}
        Speech.speak(cleanSpeechText, {
          rate,
          pitch,
          language: 'en-US',
          onDone: () => {
            this.isSpeaking = false;
            this.notify();
            options?.onDone?.();
            if (this.isWakeWordActive) {
              this.scheduleWakeWordRestart();
            }
          },
          onError: () => {
            this.isSpeaking = false;
            this.notify();
            options?.onDone?.();
            if (this.isWakeWordActive) {
              this.scheduleWakeWordRestart();
            }
          },
        });
        return;
      }

      // Web Speech Synthesis fallback
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.rate = rate;
        utterance.pitch = pitch;

        const voices = window.speechSynthesis.getVoices();
        const naturalVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Alex'))
        );
        if (naturalVoice) utterance.voice = naturalVoice;

        utterance.onend = () => {
          this.isSpeaking = false;
          this.notify();
          options?.onDone?.();
          if (this.isWakeWordActive) {
            this.scheduleWakeWordRestart();
          }
        };
        utterance.onerror = () => {
          this.isSpeaking = false;
          this.notify();
          options?.onDone?.();
          if (this.isWakeWordActive) {
            this.scheduleWakeWordRestart();
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.notify();
      options?.onDone?.();
      if (this.isWakeWordActive) {
        this.scheduleWakeWordRestart();
      }
    }
  }

  /**
   * Stop speaking
   */
  public async stopSpeaking() {
    this.isSpeaking = false;
    try {
      if (Platform.OS !== 'web' && Speech?.stop) {
        await Speech.stop();
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    this.notify();
  }
}

export const voiceService = new VoiceService();
