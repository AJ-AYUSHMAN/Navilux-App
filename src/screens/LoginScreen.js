import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertData, setAlertData] = useState({ visible: false, title: '', message: '' });

  // Focus states for glowing input borders
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  /* ──────────────── Animations ──────────────── */
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-25)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Decorative orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(footerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Floating orb loops
    const loopOrb = (anim, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      );
    loopOrb(orb1, 4500).start();
    loopOrb(orb2, 6000).start();
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const orb1Op = orb1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.28, 0.12] });
  const orb2Op = orb2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.2, 0.08] });

  /* ──────────────── Helpers ──────────────── */
  const showAlert = (title, message) => setAlertData({ visible: true, title, message });
  const closeAlert = () => setAlertData({ visible: false, title: '', message: '' });

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Missing Information', 'Please enter your email and password to login.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setIsLoggedIn(true);
    } catch (err) {
      console.log(err);
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/invalid-email') friendlyMessage = 'The email address is badly formatted.';
      else if (err.code === 'auth/user-not-found') friendlyMessage = 'No account exists with this email.';
      else if (err.code === 'auth/wrong-password') friendlyMessage = "Incorrect password. If you forgot it, please tap 'Forgot Password?' to reset it.";
      else if (err.code === 'auth/invalid-credential') friendlyMessage = "Invalid email or password. If you forgot your password, please tap 'Forgot Password?' to reset it.";
      else if (err.code === 'auth/user-disabled') friendlyMessage = 'This account has been disabled by the administrator.';
      else if (err.code === 'auth/network-request-failed') friendlyMessage = 'Network error. Please check your internet connection.';

      showAlert('Authentication Failed', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background ── */}
      <LinearGradient
        colors={['#0A0E21', '#0F1B3D', '#142952']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Floating orbs ── */}
      <Animated.View
        style={[styles.orb, styles.orb1, { opacity: orb1Op, transform: [{ translateY: orb1Y }] }]}
      />
      <Animated.View
        style={[styles.orb, styles.orb2, { opacity: orb2Op, transform: [{ translateY: orb2Y }] }]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Back Arrow ── */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* ── Header ── */}
          <Animated.View
            style={[
              styles.headerSection,
              { opacity: headerFade, transform: [{ translateY: headerSlide }] },
            ]}
          >
            <Image
              source={require('../../assets/splash-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Sign in to continue your journey</Text>
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: formFade, transform: [{ translateY: formSlide }] },
            ]}
          >
            {/* Glass card */}
            <View style={styles.glassCard}>
              {/* Email Input */}
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? theme.primary : 'rgba(255,255,255,0.4)'}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordFocused ? theme.primary : 'rgba(255,255,255,0.4)'}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(255,255,255,0.45)"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={{ top: 8, bottom: 8 }}
              >
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.loginButtonOuter}
              >
                <LinearGradient
                  colors={['#5BA8E5', theme.primary, '#5BA8E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View style={[styles.footer, { opacity: footerFade }]}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.signupLink, { color: theme.primary }]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Premium Custom Alert Modal ── */}
      <Modal transparent animationType="fade" visible={alertData.visible} onRequestClose={closeAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1A1F3D', '#0F1B3D']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={36} color="#FF5C5C" />
            </View>
            <Text style={styles.modalTitle}>{alertData.title}</Text>
            <Text style={styles.modalMessage}>{alertData.message}</Text>
            <TouchableOpacity onPress={closeAlert} activeOpacity={0.85} style={styles.modalButtonOuter}>
              <LinearGradient
                colors={['#5BA8E5', theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  /* ── Orbs ── */
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: {
    width: 220,
    height: 220,
    backgroundColor: '#146BAEFF',
    top: -30,
    left: -60,
  },
  orb2: {
    width: 180,
    height: 180,
    backgroundColor: '#4A6CF7',
    bottom: 60,
    right: -70,
  },

  /* ── Back ── */
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Header ── */
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  logo: {
    width: 220,
    height: 65,
    tintColor: '#FFFFFF',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },

  /* ── Glass Card ── */
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
  },

  /* ── Form ── */
  formContainer: { width: '100%' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(126, 199, 255, 0.5)',
    backgroundColor: 'rgba(126, 199, 255, 0.06)',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  eyeButton: { padding: 6 },

  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#146BAEFF',
  },

  /* ── Login Button ── */
  loginButtonOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#146BAEFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signupText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#146BAEFF',
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  modalIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtonOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});