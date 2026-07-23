import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function UsernameScreen({ route, navigation }) {
  const { phone } = route.params || {};
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkTimeoutRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Real-time username availability check
  const handleUsernameChange = (val) => {
    setUsername(val);
    setError('');
    setIsUsernameAvailable(null);

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    if (val.trim().length < 3) return;

    setCheckingUsername(true);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username/${val.trim()}`);
        setIsUsernameAvailable(res.data.available);
      } catch (e) {
        setIsUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
  };

  const handleCreate = async () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (isUsernameAvailable === false) {
      setError('This username is already taken');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;
      const res = await api.post('/auth/register', {
        username: username.trim(),
        phone: cleanPhone,
        password: password.trim() || undefined,
      });

      if (res.data.success) {
        await setAuth(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const avatarLetters = username.trim().slice(0, 2).toUpperCase() || '??';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" translucent={false} />

      <LinearGradient
        colors={['#00FFB2', '#9D5CFF', '#00C8FF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      <Animated.View style={[styles.content, {
        opacity: fadeAnim, transform: [{ translateY: slideAnim }]
      }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#00FFB2" />
        </TouchableOpacity>

        <Text style={styles.title}>CREATE YOUR{'\n'}INSTAGRAM-STYLE PROFILE</Text>
        <Text style={styles.subtitle}>Choose your unique username & password to log in anytime</Text>

        {/* Avatar Preview */}
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={['#00FFB2', '#9D5CFF']}
            style={styles.avatarBorder}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetters}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Username Input with Live Validation */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>USERNAME</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. saniya_12"
              placeholderTextColor="#444466"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {checkingUsername ? (
              <ActivityIndicator size="small" color="#00FFB2" />
            ) : isUsernameAvailable === true ? (
              <Ionicons name="checkmark-circle" size={20} color="#00FFB2" />
            ) : isUsernameAvailable === false ? (
              <Ionicons name="close-circle" size={20} color="#FF0055" />
            ) : null}
          </View>
          {isUsernameAvailable === false && (
            <Text style={styles.takenText}>Username taken, try another</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>CREATE PASSWORD (OPTIONAL)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#444466" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter a secure password"
              placeholderTextColor="#444466"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#888899" />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle" size={14} color="#FF0055" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, (username.trim().length < 3 || isUsernameAvailable === false) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading || username.trim().length < 3 || isUsernameAvailable === false}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={username.trim().length >= 3 && isUsernameAvailable !== false ? ['#00FFB2', '#9D5CFF'] : ['#2A2A3E', '#2A2A3E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.createGradient}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={[styles.createText, username.trim().length < 3 && styles.createTextDisabled]}>
                  COMPLETE REGISTRATION
                </Text>
                <Ionicons name="arrow-forward" size={18} color={username.trim().length >= 3 ? '#000' : '#444'} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  topLine: { height: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  backBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: '#1A1A2E',
    borderWidth: 1, borderColor: '#00FFB220',
    alignSelf: 'flex-start', marginBottom: 20,
  },

  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22, color: '#FFFFFF',
    letterSpacing: 2, textAlign: 'center',
    lineHeight: 32, marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 14, color: '#888899',
    textAlign: 'center', marginBottom: 24,
  },

  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatarBorder: { padding: 3, borderRadius: 50 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#16162A',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 26, color: '#00FFB2',
  },

  inputWrap: { marginBottom: 20 },
  inputLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12, color: '#00FFB2',
    letterSpacing: 1.5, marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, paddingHorizontal: 16,
    backgroundColor: '#16162A',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  inputPrefix: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16, color: '#00FFB2', marginRight: 6,
  },
  input: {
    flex: 1, color: '#FFFFFF',
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
  },
  takenText: { color: '#FF0055', fontSize: 12, marginTop: 4 },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginBottom: 16,
  },
  errorText: { color: '#FF0055', fontSize: 13, fontFamily: 'Rajdhani_600SemiBold' },

  createBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  createBtnDisabled: { opacity: 0.5 },
  createGradient: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 20,
  },
  createText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13, color: '#000000', letterSpacing: 1.5,
  },
  createTextDisabled: { color: '#666688' },
});