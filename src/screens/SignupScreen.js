import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { ThemeContext } from '../context/ThemeContext';

export default function SignupScreen({ navigation, setIsLoggedIn }) {
  const { theme } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({ visible: false, title: '', message: '' });

  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [confFocus, setConfFocus] = useState(false);

  const hFade = useRef(new Animated.Value(0)).current;
  const hSlide = useRef(new Animated.Value(-25)).current;
  const fFade = useRef(new Animated.Value(0)).current;
  const fSlide = useRef(new Animated.Value(40)).current;
  const ftFade = useRef(new Animated.Value(0)).current;
  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(hFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(hSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(fSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(ftFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const lp = (a, d) => Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: d, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: d, useNativeDriver: true }),
    ]));
    lp(o1, 4500).start();
    lp(o2, 6000).start();
  }, []);

  const o1Y = o1.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const o2Y = o2.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const o1Op = o1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.28, 0.12] });
  const o2Op = o2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.2, 0.08] });

  const showAlert = (t, m) => setAlertData({ visible: true, title: t, message: m });
  const closeAlert = () => setAlertData({ visible: false, title: '', message: '' });

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Missing Information', 'Please fill out all the fields to create an account.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Your password must be at least 6 characters long.');
      return;
    }
    try {
      setLoading(true);
      const uc = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(uc.user, { displayName: name });
      setIsLoggedIn(true);
    } catch (err) {
      console.log(err);
      let msg = 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account already exists with this email. Please log in instead.';
      else if (err.code === 'auth/invalid-email') msg = 'The email address is badly formatted.';
      else if (err.code === 'auth/weak-password') msg = 'The password is too weak. Please use a stronger password.';
      else if (err.code === 'auth/network-request-failed') msg = 'Network error. Please check your internet connection.';
      showAlert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const I = ({ icon, ph, val, set, foc, setFoc, sec, show, toggle, kb, cap }) => (
    <View style={[s.iw, foc && s.iwf]}>
      <Ionicons name={icon} size={20} color={foc ? theme.primary : 'rgba(255,255,255,0.4)'} style={s.ii} />
      <TextInput placeholder={ph} placeholderTextColor="rgba(255,255,255,0.35)" value={val}
        onChangeText={set} style={s.inp} secureTextEntry={sec && !show}
        keyboardType={kb || 'default'} autoCapitalize={cap || 'none'}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} />
      {toggle !== undefined && (
        <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.eye}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A0E21', '#0F1B3D', '#142952']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[s.orb, s.orb1, { opacity: o1Op, transform: [{ translateY: o1Y }] }]} />
      <Animated.View style={[s.orb, s.orb2, { opacity: o2Op, transform: [{ translateY: o2Y }] }]} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <Animated.View style={[s.header, { opacity: hFade, transform: [{ translateY: hSlide }] }]}>
            <Image source={require('../../assets/splash-logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.title}>Create Account</Text>
            <Text style={s.sub}>Join Navilux and start exploring</Text>
          </Animated.View>

          <Animated.View style={[s.formWrap, { opacity: fFade, transform: [{ translateY: fSlide }] }]}>
            <View style={s.glass}>
              <I icon="person-outline" ph="Full Name" val={name} set={setName} foc={nameFocus} setFoc={setNameFocus} cap="words" />
              <I icon="mail-outline" ph="Email Address" val={email} set={setEmail} foc={emailFocus} setFoc={setEmailFocus} kb="email-address" />
              <I icon="lock-closed-outline" ph="Password" val={password} set={setPassword} foc={passFocus} setFoc={setPassFocus} sec show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              <I icon="shield-checkmark-outline" ph="Confirm Password" val={confirmPassword} set={setConfirmPassword} foc={confFocus} setFoc={setConfFocus} sec show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

              <View style={s.hint}>
                <Ionicons name="information-circle-outline" size={14} color="rgba(126,199,255,0.5)" />
                <Text style={s.hintTxt}>Minimum 6 characters</Text>
              </View>

              <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85} style={s.btnOut}>
                <LinearGradient colors={['#5BA8E5', theme.primary, '#5BA8E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <><Text style={s.btnTxt}>Create Account</Text><Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} /></>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: ftFade }]}>
            <Text style={s.footTxt}>Already have an account?{' '}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[s.footLink, { color: theme.primary }]}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={alertData.visible} onRequestClose={closeAlert}>
        <View style={s.mo}>
          <View style={s.mc}>
            <LinearGradient colors={['#1A1F3D', '#0F1B3D']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={s.mic}><Ionicons name="alert-circle" size={36} color="#FF5C5C" /></View>
            <Text style={s.mt}>{alertData.title}</Text>
            <Text style={s.mm}>{alertData.message}</Text>
            <TouchableOpacity onPress={closeAlert} activeOpacity={0.85} style={s.mbo}>
              <LinearGradient colors={['#5BA8E5', theme.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.mb}>
                <Text style={s.mbt}>Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 240, height: 240, backgroundColor: '#146BAEFF', top: -40, right: -70 },
  orb2: { width: 180, height: 180, backgroundColor: '#4A6CF7', bottom: 30, left: -80 },
  back: { position: 'absolute', top: 50, left: 10, zIndex: 10, width: 44, height: 44, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  logo: { width: 200, height: 58, tintColor: '#FFFFFF', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginBottom: 8 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3 },
  glass: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 24 },
  formWrap: { width: '100%' },
  iw: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 56, marginBottom: 14 },
  iwf: { borderColor: 'rgba(126,199,255,0.5)', backgroundColor: 'rgba(126,199,255,0.06)' },
  ii: { marginRight: 12 },
  inp: { flex: 1, fontSize: 16, color: '#FFFFFF', height: '100%' },
  eye: { padding: 6 },
  hint: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: -4, paddingLeft: 4 },
  hintTxt: { fontSize: 12, color: 'rgba(126,199,255,0.5)', marginLeft: 6 },
  btnOut: { borderRadius: 16, overflow: 'hidden', shadowColor: '#146BAEFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  btn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footTxt: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
  footLink: { fontSize: 15, fontWeight: '700', color: '#146BAEFF' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  mc: { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', elevation: 12 },
  mic: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,92,92,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mt: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  mm: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  mbo: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  mb: { width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  mbt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});