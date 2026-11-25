import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { handleLogin, handleSignup, handleGoogleAuth, continueAsGuest } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    if (!isLogin && !name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await handleLogin(email.trim(), password);
      } else {
        await handleSignup(name.trim(), email.trim(), password);
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Email already registered. Log in instead.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Wrong password. Try again or reset.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/operation-not-allowed': 'Email/Password auth is not enabled in Firebase Console. Try Continue with Google!',
      };
      setErrorMsg(msgs[err.code] || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await handleGoogleAuth();
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/popup-closed-by-user': 'Google sign-in popup was closed.',
        'auth/cancelled-popup-request': 'Popup request cancelled.',
        'auth/operation-not-allowed': 'Google Sign-In is not enabled in Firebase Console.',
      };
      setErrorMsg(msgs[err.code] || err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo and Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../Damn.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>DAMN</Text>
          <Text style={styles.brandSubtitle}>Discipline & Lock-In Protocol</Text>
        </View>

        {/* Auth White Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.cardSub}>
            {isLogin ? 'Continue your lock-in progress' : 'Build your personalized protocol'}
          </Text>

          {/* Name Field (Sign Up only) */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Marcus"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="warrior@damn.app"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
          </View>

          {/* Error Message */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Submit Button (Solid Black) */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Continue with Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={onGoogleSignIn}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.textMain} size="small" />
            ) : (
              <>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <Path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </Svg>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continue as Guest Button */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={continueAsGuest}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>⚡ Enter Voice Assistant (Guest)</Text>
          </TouchableOpacity>

          {/* Toggle Login / Sign Up */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.7}>
              <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 10,
    backgroundColor: '#0B0C0E',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: COLORS.textMain,
  },
  brandSubtitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSub,
    marginTop: 2,
  },
  authCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardWhite,
    borderRadius: RADIUS.card + 4,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.cardLg,
  },
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  cardSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSub,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSub,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    fontFamily: FONTS.bodySemiBold,
    backgroundColor: COLORS.cardCream,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.btn - 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.accentPink,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.accentBlack,
    borderRadius: RADIUS.btn - 4,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textInverse,
    letterSpacing: 0.2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardWhite,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.btn - 4,
    paddingVertical: 11,
    gap: 8,
  },
  googleBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF4E8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: RADIUS.btn - 4,
    paddingVertical: 11,
    marginTop: 8,
  },
  guestBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  toggleText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textSub,
  },
  toggleLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMain,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  dividerText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginHorizontal: 10,
  },
});
