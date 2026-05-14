import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { ThemeContext } from '../context/ThemeContext';

// Native Google Sign-In — wrapped in try-catch for Expo Go compatibility
let GoogleSignin = null;
let statusCodes = null;
try {
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  statusCodes = gsModule.statusCodes;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
} catch (e) {
  console.log('⚠️ @react-native-google-signin not available (Expo Go). Native sign-in disabled.');
}

const { width, height } = Dimensions.get('window');

export default function AuthStartScreen({ navigation, setIsLoggedIn }) {
  const { theme } = useContext(ThemeContext);
  /* ──────────────── Animations ──────────────── */
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(60)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Decorative floating orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoSlide, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(footerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating orb loop
    const loopOrb = (orbAnim, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(orbAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );

    loopOrb(orb1, 4000).start();
    loopOrb(orb2, 5500).start();
  }, []);

  /* ──────────────── Native Google Sign-In ──────────────── */
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Development Mode',
        'Native Google Sign-In is not available in Expo Go. Please use a development or production build to test Google Sign-In.\n\nYou can still use Email login for now.'
      );
      return;
    }

    try {
      setGoogleLoading(true);

      // Check Play Services availability
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Native one-tap sign-in — no browser popup
      const response = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken;

      if (!idToken) {
        throw new Error('No idToken received from Google Sign-In');
      }

      // Exchange Google idToken for Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      setIsLoggedIn(true);
    } catch (error) {
      console.log('Google Sign-In Error:', error?.code, error?.message);

      if (error?.code === statusCodes?.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else if (error?.code === statusCodes?.IN_PROGRESS) {
        // Already in progress
      } else if (error?.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services',
          'Google Play Services is not available on this device. Please update or install it to use Google Sign-In.'
        );
      } else {
        Alert.alert(
          'Sign-In Failed',
          'Could not sign in with Google. Please try again.\n\n' + (error?.message || '')
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ──────────────── Orb interpolations ──────────────── */
  const orb1TranslateY = orb1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const orb2TranslateY = orb2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });
  const orb1Opacity = orb1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.35, 0.15],
  });
  const orb2Opacity = orb2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.25, 0.1],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#0A0E21', '#0F1B3D', '#142952']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Decorative floating orbs ── */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            opacity: orb1Opacity,
            transform: [{ translateY: orb1TranslateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            opacity: orb2Opacity,
            transform: [{ translateY: orb2TranslateY }],
          },
        ]}
      />

      {/* ── Logo section ── */}
      <Animated.View
        style={[
          styles.logoSection,
          {
            opacity: logoFade,
            transform: [{ translateY: logoSlide }],
          },
        ]}
      >
        <Image
          source={require('../../assets/splash-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ── Tagline ── */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineFade }]}>
        <Text style={styles.tagline}>Your Smart Travel Companion</Text>
        <View style={styles.taglineAccent} />
        <Text style={styles.subTagline}>
          Navigate smarter. Explore effortlessly.
        </Text>
      </Animated.View>

      {/* ── Auth Buttons ── */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          {
            opacity: buttonsFade,
            transform: [{ translateY: buttonsSlide }],
          },
        ]}
      >
        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          activeOpacity={0.85}
        >
          <View style={styles.googleInner}>
            {googleLoading ? (
              <ActivityIndicator color="#333" size="small" style={{ marginRight: 12 }} />
            ) : (
              <Image
                source={require('../../assets/google.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in…' : 'Continue with Google'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Login Button */}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <View style={styles.emailInner}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </View>
        </TouchableOpacity>

        {/* Sign Up Prompt */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupPrompt}
          activeOpacity={0.7}
        >
          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text style={[styles.signupLink, { color: theme.primary }]}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Footer ── */}
      <Animated.View style={[styles.footer, { opacity: footerFade }]}>
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('TermsOfUse')}
          >
            Terms of Use
          </Text>{' '}
          and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  /* ── Decorative orbs ── */
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 260,
    height: 260,
    backgroundColor: '#146BAEFF',
    top: -50,
    right: -80,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: '#4A6CF7',
    bottom: -40,
    left: -70,
  },

  /* ── Logo ── */
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 280,
    height: 85,
    tintColor: '#FFFFFF',
  },

  /* ── Tagline ── */
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#19649eff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  taglineAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#146BAEFF',
    borderRadius: 2,
    marginVertical: 10,
  },
  subTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.5,
  },

  /* ── Buttons Container ── */
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },

  /* ── Google Button ── */
  googleButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },

  /* ── Divider ── */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* ── Email Button ── */
  emailButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  emailInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 199, 255, 0.35)',
    backgroundColor: 'rgba(126, 199, 255, 0.08)',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* ── Sign Up Prompt ── */
  signupPrompt: {
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  signupLink: {
    color: '#146BAEFF',
    fontWeight: '700',
  },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 36,
    paddingHorizontal: 30,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    lineHeight: 18,
  },
  termsLink: {
    color: 'rgba(126, 199, 255, 0.7)',
    textDecorationLine: 'underline',
  },
});
