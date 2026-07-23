import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
];

export default function OnboardingScreen({ navigation }) {
  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState('signup');
  // Signup sub-tab: 'phone' or 'username'
  const [signupTab, setSignupTab] = useState('phone');

  // Form states
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Username/Password Signup states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  // Login states (Instagram-style: username, phone, or email + password)
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [authMode, signupTab]);

  // 1. Send SMS OTP (Phone Signup/Login)
  const handleSendOTP = async () => {
    if (phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const fullPhone = selectedCountry.code + phone.trim();
      const res = await api.post('/auth/send-otp', { phone: fullPhone });

      if (res.data.success) {
        if (res.data.dev_otp) {
          Alert.alert('Dev OTP', `Your OTP is: ${res.data.dev_otp}`);
        }
        navigation.navigate('OTP', {
          phone: fullPhone,
          displayPhone: `${selectedCountry.flag} ${selectedCountry.code} ${phone.trim()}`,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Username & Password Signup
  const handleDirectRegister = async () => {
    if (signupUsername.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (signupPassword.trim().length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        username: signupUsername.trim(),
        password: signupPassword.trim(),
        email: signupEmail.trim() || undefined,
      });

      if (res.data.success) {
        await setAuth(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Instagram-Style Login (Username/Phone/Email + Password)
  const handleInstagramLogin = async () => {
    if (!loginInput.trim()) {
      setError('Please enter your Username, Phone, or Email');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        login: loginInput.trim(),
        password: loginPassword.trim() || undefined,
      });

      if (res.data.success) {
        await setAuth(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" translucent={false} />

      <LinearGradient
        colors={['#00FFB2', '#9D5CFF', '#00C8FF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Logo Header */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={styles.logoTitle}>XENCHAT</Text>
            <Text style={styles.logoSub}>INSTAGRAM-STYLE ENCRYPTED MESSENGER</Text>
          </View>

          {/* Mode Switcher Tabs (LOG IN vs SIGN UP) */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, authMode === 'signup' && styles.modeTabActive]}
              onPress={() => { setAuthMode('signup'); setError(''); }}
            >
              <Text style={[styles.modeTabText, authMode === 'signup' && styles.modeTabTextActive]}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
              onPress={() => { setAuthMode('login'); setError(''); }}
            >
              <Text style={[styles.modeTabText, authMode === 'login' && styles.modeTabTextActive]}>
                LOG IN
              </Text>
            </TouchableOpacity>
          </View>

          {/* ────────────────── SIGN UP MODE ────────────────── */}
          {authMode === 'signup' && (
            <View>
              {/* Sub-tabs: Phone vs Username */}
              <View style={styles.subTabs}>
                <TouchableOpacity
                  style={[styles.subTab, signupTab === 'phone' && styles.subTabActive]}
                  onPress={() => { setSignupTab('phone'); setError(''); }}
                >
                  <Ionicons name="call-outline" size={16} color={signupTab === 'phone' ? '#00FFB2' : '#666688'} />
                  <Text style={[styles.subTabText, signupTab === 'phone' && styles.subTabTextActive]}>
                    Phone OTP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTab, signupTab === 'username' && styles.subTabActive]}
                  onPress={() => { setSignupTab('username'); setError(''); }}
                >
                  <Ionicons name="at-outline" size={16} color={signupTab === 'username' ? '#00FFB2' : '#666688'} />
                  <Text style={[styles.subTabText, signupTab === 'username' && styles.subTabTextActive]}>
                    Username
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sub-tab A: Phone Signup */}
              {signupTab === 'phone' && (
                <View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                    <View style={styles.phoneBox}>
                      <TouchableOpacity
                        style={styles.countryBtn}
                        onPress={() => setShowCountryPicker(!showCountryPicker)}
                      >
                        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                        <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                        <Ionicons name="chevron-down" size={14} color="#00FFB2" />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="#444466"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(val) => { setPhone(val); setError(''); }}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Country Picker Dropdown */}
                  {showCountryPicker && (
                    <View style={styles.dropdown}>
                      {COUNTRY_CODES.map((c, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.dropdownItem}
                          onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                        >
                          <Text style={styles.countryFlag}>{c.flag}</Text>
                          <Text style={styles.dropdownName}>{c.name}</Text>
                          <Text style={styles.dropdownCode}>{c.code}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, phone.length < 10 && styles.actionBtnDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading || phone.length < 10}
                  >
                    <LinearGradient
                      colors={phone.length >= 10 ? ['#00FFB2', '#9D5CFF'] : ['#1A1A2E', '#1A1A2E']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.actionGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.actionText, phone.length < 10 && styles.actionTextDisabled]}>
                            SEND OTP
                          </Text>
                          <Ionicons name="paper-plane" size={16} color={phone.length >= 10 ? '#000' : '#444'} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Sub-tab B: Username Signup */}
              {signupTab === 'username' && (
                <View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>USERNAME</Text>
                    <View style={styles.inputBox}>
                      <Text style={styles.prefix}>@</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Choose username"
                        placeholderTextColor="#444466"
                        value={signupUsername}
                        onChangeText={(val) => { setSignupUsername(val); setError(''); }}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="lock-closed-outline" size={16} color="#444466" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="Create password"
                        placeholderTextColor="#444466"
                        secureTextEntry
                        value={signupPassword}
                        onChangeText={(val) => { setSignupPassword(val); setError(''); }}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="mail-outline" size={16} color="#444466" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="yourname@gmail.com"
                        placeholderTextColor="#444466"
                        keyboardType="email-address"
                        value={signupEmail}
                        onChangeText={(val) => { setSignupEmail(val); setError(''); }}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, (signupUsername.length < 3 || signupPassword.length < 4) && styles.actionBtnDisabled]}
                    onPress={handleDirectRegister}
                    disabled={loading || signupUsername.length < 3 || signupPassword.length < 4}
                  >
                    <LinearGradient
                      colors={signupUsername.length >= 3 && signupPassword.length >= 4 ? ['#00FFB2', '#9D5CFF'] : ['#1A1A2E', '#1A1A2E']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.actionGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.actionText, (signupUsername.length < 3 || signupPassword.length < 4) && styles.actionTextDisabled]}>
                            REGISTER ACCOUNT
                          </Text>
                          <Ionicons name="checkmark-circle" size={18} color={signupUsername.length >= 3 ? '#000' : '#444'} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ────────────────── LOG IN MODE (INSTAGRAM-STYLE) ────────────────── */}
          {authMode === 'login' && (
            <View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>USERNAME, PHONE OR EMAIL</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={16} color="#444466" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username, phone, or email"
                    placeholderTextColor="#444466"
                    value={loginInput}
                    onChangeText={(val) => { setLoginInput(val); setError(''); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={16} color="#444466" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#444466"
                    secureTextEntry={!showLoginPassword}
                    value={loginPassword}
                    onChangeText={(val) => { setLoginPassword(val); setError(''); }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)}>
                    <Ionicons name={showLoginPassword ? 'eye-off' : 'eye'} size={18} color="#888899" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, !loginInput.trim() && styles.actionBtnDisabled]}
                onPress={handleInstagramLogin}
                disabled={loading || !loginInput.trim()}
              >
                <LinearGradient
                  colors={loginInput.trim() ? ['#00FFB2', '#9D5CFF'] : ['#1A1A2E', '#1A1A2E']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={[styles.actionText, !loginInput.trim() && styles.actionTextDisabled]}>
                        LOG IN TO XENCHAT
                      </Text>
                      <Ionicons name="log-in-outline" size={18} color={loginInput.trim() ? '#000' : '#444'} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={14} color="#FF0055" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  topLine: { height: 2 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoImg: { width: 64, height: 64, marginBottom: 8 },
  logoTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 24, color: '#FFFFFF', letterSpacing: 3 },
  logoSub: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, color: '#00FFB2', letterSpacing: 2, marginTop: 4 },

  modeTabs: {
    flexDirection: 'row', backgroundColor: '#14142B',
    borderRadius: 12, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modeTabActive: { backgroundColor: '#00FFB220', borderWidth: 1, borderColor: '#00FFB2' },
  modeTabText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#666688', letterSpacing: 1 },
  modeTabTextActive: { color: '#00FFB2' },

  subTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  subTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#16162A', borderWidth: 1, borderColor: '#2A2A4A',
  },
  subTabActive: { borderColor: '#00FFB2', backgroundColor: '#00FFB210' },
  subTabText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, color: '#666688' },
  subTabTextActive: { color: '#00FFB2' },

  inputWrap: { marginBottom: 14 },
  inputLabel: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, color: '#00FFB2', letterSpacing: 1, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    paddingHorizontal: 14, backgroundColor: '#16162A',
    borderRadius: 10, borderWidth: 1, borderColor: '#2A2A4A',
  },
  phoneBox: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    backgroundColor: '#16162A', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A4A', paddingHorizontal: 10,
  },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#2A2A4A' },
  countryFlag: { fontSize: 16 },
  countryCode: { fontFamily: 'Rajdhani_600SemiBold', color: '#00FFB2', fontSize: 14 },
  phoneInput: { flex: 1, color: '#FFF', paddingLeft: 10, fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 },
  prefix: { fontFamily: 'Orbitron_700Bold', color: '#00FFB2', fontSize: 14, marginRight: 4 },
  input: { flex: 1, color: '#FFFFFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 15 },

  dropdown: {
    backgroundColor: '#16162A', borderRadius: 10,
    borderWidth: 1, borderColor: '#00FFB2',
    marginBottom: 14, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A4A', gap: 10,
  },
  dropdownName: { flex: 1, color: '#FFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 14 },
  dropdownCode: { color: '#00FFB2', fontFamily: 'Orbitron_700Bold', fontSize: 12 },

  actionBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 8 },
  actionBtnDisabled: { opacity: 0.5 },
  actionGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, color: '#000', letterSpacing: 1.5 },
  actionTextDisabled: { color: '#666688' },

  errorWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  errorText: { color: '#FF0055', fontSize: 13, fontFamily: 'Rajdhani_600SemiBold' },
});