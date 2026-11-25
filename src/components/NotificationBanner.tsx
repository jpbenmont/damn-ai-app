import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Platform,
  Image 
} from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const NotificationBanner: React.FC = () => {
  const { currentNotification, dismissNotification } = useApp();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentNotification) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: Platform.OS === 'web' ? 16 : 48,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 6.5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 6500);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [currentNotification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissNotification();
    });
  };

  if (!currentNotification) return null;

  // Determine badge colors based on notification type
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'streak':
      case 'night':
        return { bg: '#FFEBF0', text: COLORS.accentPink, border: 'rgba(255, 71, 87, 0.2)' };
      case 'water':
        return { bg: '#E1F5FE', text: '#0284C7', border: 'rgba(2, 132, 199, 0.2)' };
      case 'workout':
        return { bg: '#E2F5E8', text: '#059669', border: 'rgba(32, 201, 151, 0.2)' };
      default:
        return { bg: '#FAF4E8', text: COLORS.textMain, border: COLORS.cardBorder };
    }
  };

  const badgeTheme = getBadgeStyle(currentNotification.type);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.bannerContainer}>
        {/* Left Squircle App Logo */}
        <View style={styles.logoBox}>
          <Image 
            source={require('../../assets/Damn_Notification_Image.png')} 
            style={styles.logoImg} 
            resizeMode="contain"
          />
        </View>

        {/* Content Column */}
        <View style={styles.contentCol}>
          {/* Header Row with Badge */}
          <View style={styles.headerRow}>
            <Text style={styles.appTitle}>DAMN</Text>
            <View style={[styles.typeBadge, { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }]}>
              <Text style={[styles.typeBadgeText, { color: badgeTheme.text }]}>
                {currentNotification.tag || 'ALERT'}
              </Text>
            </View>
          </View>

          {/* Message Text */}
          <Text style={styles.messageText} numberOfLines={3}>
            {currentNotification.message}
          </Text>

          {/* Optional Action Button */}
          {currentNotification.actionLabel && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                if (currentNotification.onAction) currentNotification.onAction();
                handleDismiss();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>{currentNotification.actionLabel}</Text>
              <ArrowRight size={12} color={COLORS.textInverse} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={14} color={COLORS.textSub} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  bannerContainer: {
    width: '100%',
    maxWidth: 412,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card - 2, // 24px Squircle
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...SHADOWS.cardLg,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginTop: 2,
    backgroundColor: '#F8F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textMain,
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  messageText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#141416',
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentBlack,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginTop: 8,
  },
  actionBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
