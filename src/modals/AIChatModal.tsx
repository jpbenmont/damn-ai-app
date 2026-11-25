import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Image,
  Animated
} from 'react-native';
import {
  ChevronLeft,
  ArrowUp,
  Plus,
  Mic,
  MicOff,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  Image as ImageIcon,
  Sparkles,
  X
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { askGeminiAI, AttachedFile, buildCoachSystemPrompt } from '../services/gemini';
import { loadChatHistory, persistChatHistory } from '../services/storage';
import { voiceService } from '../services/voiceService';
import { processVoiceCommand, AssistantContext } from '../services/assistantCommands';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  attachment?: AttachedFile | null;
}

export const AIChatModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    state,
    addWater,
    addSteps,
    toggleTask,
    addCustomTask,
    takeSupplement,
    setActiveTab,
    openModal
  } = useApp();
  const isOpen = activeModal === 'ai_chat';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  // Load continuous chat history from persistent storage on mount and when opened
  useEffect(() => {
    if (isOpen) {
      loadChatHistory().then(saved => {
        if (saved && Array.isArray(saved) && saved.length > 1) {
          setMessages(saved);
        } else {
          // Reconstruct complete onboarding chat memory from user's locked-in profile
          const name = state.user.name || 'Friend';
          const goal = state.user.fitnessGoal || 'Productivity & Daily Routine';
          const days = state.user.dayTotal || 60;
          const water = state.user.waterGoalMl || 3000;
          const steps = state.user.stepsGoal || 8000;

          const restoredMemory: ChatMessage[] = [
            { id: 'ob_1', sender: 'bot', text: "Welcome to DAMN AI! What should I call you?" },
            { id: 'ob_2', sender: 'user', text: name },
            { id: 'ob_3', sender: 'bot', text: `Got it, ${name}! What's your primary life or productivity goal?` },
            { id: 'ob_4', sender: 'user', text: goal },
            { id: 'ob_5', sender: 'bot', text: "What are your daily hydration and movement targets?" },
            { id: 'ob_6', sender: 'user', text: `${water}ml water, ${steps} steps daily` },
            { id: 'ob_7', sender: 'bot', text: `🔥 That's everything I need, ${name}! Locking in your custom ${days}-day routine, smart escalating reminders, shopping radar, and daily checklist. Let's conquer this together!` }
          ];

          setMessages(restoredMemory);
          persistChatHistory(restoredMemory);
        }
      });
    }
  }, [isOpen, state.user.name, state.user.onboardingCompleted]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      persistChatHistory(messages);
    }
  }, [messages]);

  // Speech-to-Text (STT) setup
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      await voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const ok = await voiceService.startListening((text, isFinal) => {
        setInputText(text);
        if (isFinal && text.trim().length > 1) {
          voiceService.stopListening();
          setIsListening(false);
          handleSend(text);
        }
      });
      if (!ok) {
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech (TTS) handler via VoiceService
  const toggleSpeech = async (id: string, text: string) => {
    if (speakingId === id) {
      await voiceService.stopSpeaking();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    await voiceService.speak(text, {
      onDone: () => setSpeakingId(null),
    });
  };

  const handleCopy = (id: string, text: string) => {
    try {
      Clipboard.setString(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { }
  };

  const handleClearHistory = () => {
    const initialGreeting: ChatMessage = {
      id: `init_${Date.now()}`,
      sender: 'bot',
      text: `Chat reset! Let's lock in fresh, ${state.user.name || 'bro'}. What's the plan?`,
    };
    setMessages([initialGreeting]);
    persistChatHistory([initialGreeting]);
  };

  // Web file picker handler for all image formats and PDF
  const pickFile = (acceptType: 'image' | 'pdf') => {
    setShowAttachMenu(false);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptType === 'image'
        ? 'image/*, .png, .jpg, .jpeg, .webp, .gif, .heic, .svg'
        : 'application/pdf, .pdf';

      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            const base64 = result ? result.split(',')[1] : undefined;
            setAttachedFile({
              uri: result,
              name: file.name,
              type: file.type || (acceptType === 'image' ? 'image/jpeg' : 'application/pdf'),
              base64: base64,
              isImage: acceptType === 'image',
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const assistantContext: AssistantContext = {
    state,
    addWater,
    addSteps,
    toggleTask,
    addCustomTask,
    takeSupplement,
    setActiveTab,
    openModal,
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if ((!query && !attachedFile) || isLoading) return;

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    }

    const currentFile = attachedFile;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      attachment: currentFile,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedFile(null);
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // If no file is attached, try checking if it's an actionable command first!
      if (!currentFile) {
        const cmdResult = await processVoiceCommand(query, assistantContext);
        if (cmdResult.actionType !== 'ai_chat') {
          // Direct command executed!
          const botMsg: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: `⚡ [${cmdResult.title}]\n${cmdResult.spokenResponse}`,
          };
          setMessages(prev => [...prev, botMsg]);
          // Automatically speak response
          toggleSpeech(botMsg.id, cmdResult.spokenResponse);
          setIsLoading(false);
          return;
        }
      }

      const systemPrompt = buildCoachSystemPrompt(state.user);
      const reply = await askGeminiAI(query, systemPrompt, currentFile, messages);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: reply,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: "I got your back bro! Let's lock in and crush today's protocol with zero excuses.",
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent={false} animationType="slide" onRequestClose={closeModal}>
      <View style={styles.fullScreenContainer}>
        {/* Full Screen Header Bar matching Screenshot */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.backBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={24} color={COLORS.textMain} strokeWidth={2.6} />
            </TouchableOpacity>

            <View style={styles.brandLogoRow}>
              <View style={styles.squircleLogo}>
                <Image
                  source={require('../../assets/Damn_App_Icon.png')}
                  style={styles.logoImg}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.brandTitle}>DAMN</Text>
            </View>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>AI ASSISTANT</Text>
          </View>
        </View>

        {/* Real-Time Smart Quick Intel Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => handleSend("⚡ Roast my execution and discipline today bro, give it to me straight!")}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>⚡ Roast My Day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => handleSend("🥗 Based on my goals, what should I eat for my next meal today?")}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>🥗 Next Meal Strategy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => handleSend("⏰ Review my scheduled reminders and top priorities for today")}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>⏰ Reminders & Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => handleSend("💧 Check my hydration deficit and water intake timing for today")}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>💧 Hydration Audit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => handleSend("📊 Give me a deep analysis of my protocol progress and weight trajectory")}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>📊 Progress Audit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Chat Messages Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                <View key={msg.id} style={styles.userMsgRow}>
                  <View style={styles.userBubble}>
                    {/* Render uploaded image preview */}
                    {msg.attachment?.isImage && (
                      <Image
                        source={{ uri: msg.attachment.uri }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                      />
                    )}
                    {/* Render uploaded PDF badge */}
                    {msg.attachment && !msg.attachment.isImage && (
                      <View style={styles.pdfAttachmentBadge}>
                        <FileText size={16} color="#FFFFFF" />
                        <Text style={styles.pdfBadgeText} numberOfLines={1}>
                          {msg.attachment.name}
                        </Text>
                      </View>
                    )}
                    {msg.text.trim().length > 0 && (
                      <Text style={styles.userMsgText}>{msg.text}</Text>
                    )}
                  </View>
                </View>
              );
            }

            // DAMN AI Pastel Mint Green Bubble matching screenshot
            return (
              <View key={msg.id} style={styles.botMsgRow}>
                <View style={styles.botBubble}>
                  <Text style={styles.botTagText}>DAMN</Text>
                  <Text style={styles.botMsgText}>{msg.text}</Text>

                  {/* Micro Action Buttons: TTS & Copy */}
                  <View style={styles.botActionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleSpeech(msg.id, msg.text)}
                      activeOpacity={0.7}
                    >
                      {speakingId === msg.id ? (
                        <VolumeX size={14} color={COLORS.accentPink} strokeWidth={2.2} />
                      ) : (
                        <Volume2 size={14} color="#059669" strokeWidth={2.2} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleCopy(msg.id, msg.text)}
                      activeOpacity={0.7}
                    >
                      {copiedId === msg.id ? (
                        <Check size={14} color={COLORS.accentGreen} strokeWidth={2.5} />
                      ) : (
                        <Copy size={13} color="#059669" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Typing Loading State */}
          {isLoading && (
            <View style={styles.botMsgRow}>
              <View style={[styles.botBubble, styles.loadingBubble]}>
                <Text style={styles.botTagText}>DAMN</Text>
                <View style={styles.typingRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.typingText}>DAMN AI is thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Attachment Preview Chip above input bar */}
        {attachedFile && (
          <View style={styles.attachedPreviewRow}>
            <View style={styles.attachedChip}>
              {attachedFile.isImage ? (
                <Image source={{ uri: attachedFile.uri }} style={styles.previewThumb} />
              ) : (
                <FileText size={16} color={COLORS.textMain} />
              )}
              <Text style={styles.previewFileName} numberOfLines={1}>
                {attachedFile.name}
              </Text>
              <TouchableOpacity onPress={() => setAttachedFile(null)} style={styles.removeFileBtn}>
                <X size={12} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Plus Menu Popup (Upload Image / Upload PDF) */}
        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <TouchableOpacity
              style={styles.attachMenuItem}
              onPress={() => pickFile('image')}
              activeOpacity={0.75}
            >
              <View style={styles.menuIconCircle}>
                <ImageIcon size={18} color={COLORS.textMain} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Upload Image</Text>
                <Text style={styles.menuItemSub}>All formats (PNG, JPG, WEBP, HEIC, GIF)</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.attachMenuItem}
              onPress={() => pickFile('pdf')}
              activeOpacity={0.75}
            >
              <View style={styles.menuIconCircle}>
                <FileText size={18} color={COLORS.textMain} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Upload Document / PDF</Text>
                <Text style={styles.menuItemSub}>Protocol sheets, diet plans & reports</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomBarWrapper}
        >
          <View style={styles.inputPill}>
            {/* Plus attachment icon */}
            <TouchableOpacity
              style={styles.sidePillBtn}
              onPress={() => setShowAttachMenu(!showAttachMenu)}
              activeOpacity={0.7}
            >
              <Plus size={20} color={COLORS.textSub} strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Main Text Input */}
            <TextInput
              style={styles.inputField}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isListening ? "Listening... Speak now..." : "Message DAMN..."}
              placeholderTextColor={isListening ? COLORS.accentGreen : COLORS.textMuted}
              multiline={true}
              onSubmitEditing={() => handleSend()}
            />

            {/* STT Microphone button & Send Arrow */}
            <TouchableOpacity
              style={[
                styles.sidePillBtn,
                isListening && styles.listeningActiveBtn
              ]}
              onPress={toggleListening}
              activeOpacity={0.7}
            >
              {isListening ? (
                <MicOff size={19} color="#DC2626" strokeWidth={2.5} />
              ) : (
                <Mic size={19} color={COLORS.textSub} strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            {(inputText.trim().length > 0 || attachedFile) && (
              <TouchableOpacity
                style={styles.sendBlackBtn}
                onPress={() => handleSend()}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <ArrowUp size={18} color={COLORS.textInverse} strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F6F4EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  squircleLogo: {
    width: 32,
    height: 32,
    borderRadius: 7,
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
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  chipsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 10,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipBtn: {
    backgroundColor: '#FAF4E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  chipText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11.5,
    color: '#141416',
    letterSpacing: 0.2,
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
    gap: 14,
  },
  userMsgRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: '#141416',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    ...SHADOWS.card,
  },
  userMsgText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bubbleImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  pdfAttachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  pdfBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    maxWidth: 160,
  },
  botMsgRow: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
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
  botTagText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  botMsgText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#141416',
    fontWeight: '600',
  },
  botActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
    paddingTop: 2,
  },
  actionBtn: {
    padding: 3,
  },
  loadingBubble: {
    paddingVertical: 14,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  typingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.5,
    color: '#059669',
    fontWeight: '600',
  },
  attachedPreviewRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  attachedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  previewThumb: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  previewFileName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.textMain,
    maxWidth: 200,
  },
  removeFileBtn: {
    padding: 2,
  },
  attachMenu: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...SHADOWS.card,
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  menuItemSub: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 8,
  },
  bottomBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F0',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 6,
  },
  sidePillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningActiveBtn: {
    backgroundColor: '#FEE2E2',
  },
  inputField: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: 15,
    color: COLORS.textMain,
    paddingHorizontal: 6,
    paddingVertical: 6,
    maxHeight: 100,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  sendBlackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
