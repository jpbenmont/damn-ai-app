import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { ArrowUp, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { ONBOARDING_QUESTIONS } from '../services/gemini';
import { persistChatHistory } from '../services/storage';

interface OnboardingMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export const OnboardingScreen: React.FC = () => {
  const { saveOnboardingProfile, state } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    name: state.user.name || 'Warrior',
    gender: 'Male',
    age: '22',
    fitnessGoal: 'Fat Loss & Shred',
    currentWeight: 75,
    targetWeight: 70,
    dayTotal: 60,
    dietType: 'Non-Veg',
    workoutLocation: 'Commercial Gym',
    splitPreference: '5-6 Days (Push / Pull / Legs)',
    injuries: 'None',
    waterGoal: 3500,
    stepsGoal: 10000,
  });

  const [messages, setMessages] = useState<OnboardingMessage[]>([
    {
      id: '0',
      sender: 'ai',
      text: ONBOARDING_QUESTIONS[0].question,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  const currentQ = ONBOARDING_QUESTIONS[currentStep];

  // Speech-to-Text (STT) setup
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {}
    }
  };

  // Text-to-Speech (TTS)
  const toggleSpeech = (id: string, text: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const handleSelectOption = (option: string) => {
    handleAnswer(option);
  };

  const handleAnswer = (answer: string) => {
    if (!answer.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const raw = answer.trim();

    const userMsg: OnboardingMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: raw,
    };

    const nextFormData = { ...formData };
    if (currentQ) {
      if (currentQ.field === 'name') {
        nextFormData.name = raw;
      } else if (currentQ.field === 'ageGender') {
        const match = raw.match(/\d+/);
        if (match) nextFormData.age = match[0];
        if (raw.toLowerCase().includes('female') || raw.toLowerCase().includes('woman') || raw.toLowerCase().includes('girl')) {
          nextFormData.gender = 'Female';
        } else {
          nextFormData.gender = 'Male';
        }
      } else if (currentQ.field === 'weights') {
        const numbers = raw.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          nextFormData.currentWeight = parseInt(numbers[0], 10);
          nextFormData.targetWeight = parseInt(numbers[1], 10);
        } else if (numbers && numbers.length === 1) {
          nextFormData.currentWeight = parseInt(numbers[0], 10);
        }
      } else if (currentQ.field === 'waterSteps') {
        const matchWater = raw.match(/(\d+(\.\d+)?)\s*l/i) || raw.match(/(\d{3,4})\s*ml/i);
        if (matchWater) {
          const val = parseFloat(matchWater[1]);
          nextFormData.waterGoal = val < 10 ? Math.round(val * 1000) : Math.round(val);
        } else {
          nextFormData.waterGoal = 3500;
        }
        const matchSteps = raw.match(/(\d+)\s*k/i) || raw.match(/(\d{4,5})\s*steps/i);
        if (matchSteps) {
          const val = parseInt(matchSteps[1], 10);
          nextFormData.stepsGoal = val < 100 ? val * 1000 : val;
        } else {
          nextFormData.stepsGoal = 10000;
        }
      } else if (currentQ.field === 'supplements') {
        nextFormData.supplements = raw;
      } else if (currentQ.field === 'dayTotal') {
        const match = raw.match(/\d+/);
        nextFormData.dayTotal = match ? parseInt(match[0], 10) : 60;
      } else {
        nextFormData[currentQ.field] = raw;
      }
    }

    setFormData(nextFormData);
    setInputText('');

    const nextStep = currentStep + 1;

    if (nextStep < ONBOARDING_QUESTIONS.length) {
      const nextQ = ONBOARDING_QUESTIONS[nextStep];
      const aiMsg: OnboardingMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: nextQ.question,
      };

      setMessages(prev => [...prev, userMsg, aiMsg]);
      setCurrentStep(nextStep);
    } else {
      const finishMsg: OnboardingMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: `🔥 That's everything I need, ${nextFormData.name || 'bro'}! Locking in your custom ${nextFormData.dayTotal}-day routine, daily focus tasks, smart reminders, and water target. Let's conquer this together!`,
      };
      const finalMsgs = [...messages, userMsg, finishMsg];
      setMessages(finalMsgs);

      // Save complete dialogue into persistent AI chat memory
      const chatMemory = finalMsgs.map(m => ({
        id: m.id,
        sender: (m.sender === 'ai' ? 'bot' : 'user') as 'bot' | 'user',
        text: m.text,
      }));
      persistChatHistory(chatMemory);

      setTimeout(() => {
        saveOnboardingProfile(nextFormData);
      }, 1500);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Header Bar (NO BACK BUTTON) */}
      <View style={styles.header}>
        <View style={styles.brandLogoRow}>
          <View style={styles.squircleLogo}>
            <Image 
              source={require('../../Damn.png')} 
              style={styles.logoImg} 
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>DAMN</Text>
            <Text style={styles.brandSub}>AI PROTOCOL SETUP</Text>
          </View>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {Math.min(currentStep + 1, ONBOARDING_QUESTIONS.length)} / {ONBOARDING_QUESTIONS.length}
          </Text>
        </View>
      </View>

      {/* Messages Feed matching Screenshot */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              msg.sender === 'user' ? styles.userMsgRow : styles.botMsgRow,
            ]}
          >
            <View
              style={[
                msg.sender === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.botHeaderRow}>
                  <Text style={styles.botTagText}>DAMN</Text>
                  <TouchableOpacity 
                    onPress={() => toggleSpeech(msg.id, msg.text)}
                    style={styles.speakerBtn}
                  >
                    {speakingId === msg.id ? (
                      <VolumeX size={13} color={COLORS.accentPink} />
                    ) : (
                      <Volume2 size={13} color="#059669" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
              <Text
                style={[
                  msg.sender === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Interactive Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomBar}
      >
        {/* Quick Option Pills ONLY for questions that benefit from quick selection */}
        {currentQ && currentQ.options && currentQ.options.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {currentQ.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.optionChip}
                onPress={() => handleSelectOption(opt)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Text Input Row with STT Mic */}
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isListening ? "Listening... Speak now..." : "Type or speak your answer..."}
              placeholderTextColor={isListening ? COLORS.accentGreen : COLORS.textMuted}
              onSubmitEditing={() => handleAnswer(inputText)}
            />

            {/* Mic STT Button */}
            <TouchableOpacity
              style={[styles.micBtn, isListening && styles.micActiveBtn]}
              onPress={toggleListening}
              activeOpacity={0.7}
            >
              {isListening ? (
                <MicOff size={18} color="#DC2626" />
              ) : (
                <Mic size={18} color={COLORS.textSub} />
              )}
            </TouchableOpacity>

            {/* Send Arrow Button */}
            {inputText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleAnswer(inputText)}
                activeOpacity={0.8}
              >
                <ArrowUp size={18} color={COLORS.textInverse} strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#FFFFFF',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  squircleLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#0B0C0E',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COLORS.textMain,
  },
  brandSub: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  stepBadge: {
    backgroundColor: '#E2F5E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  stepBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 18,
    gap: 14,
  },
  userMsgRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  botMsgRow: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
  },
  userBubble: {
    backgroundColor: '#141416',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    ...SHADOWS.card,
  },
  botBubble: {
    backgroundColor: '#E2F5E8', // Light pastel mint green matching screenshot
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.15)',
  },
  botHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  botTagText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  speakerBtn: {
    padding: 2,
  },
  userText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  botText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#141416',
    fontWeight: '600',
  },
  bottomBar: {
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  optionChip: {
    backgroundColor: COLORS.cardCream,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  inputRow: {
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F0',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMain,
    fontSize: 14,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActiveBtn: {
    backgroundColor: '#FEE2E2',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accentBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
