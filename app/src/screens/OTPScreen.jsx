import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function OTPScreen({ route, navigation }) {
  const { phone, displayPhone } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);
  const { setAuth } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (val, index) => {
    if (val.length > 1) {
      const digits = val.split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setError('');

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (val && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), val].join('');
      if (fullOtp.length === 6) verifyOTP(fullOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/verify-otp', { phone: cleanPhone, otp: code });

      if (res.data.success) {
        if (!res.data.isNewUser) {
          // Existing user -> logged in directly!
          await setAuth(res.data.user, res.data.token);
        } else {
          // New user -> navigate to Username & Password creation screen
          navigation.navigate('Username', { phone: cleanPhone });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code';
      setError(msg);
      triggerShake();
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/send-otp', { phone: cleanPhone });
      if (res.data.success) {
        startTimer();
        if (res.data.dev_otp) {
          Alert.alert('Dev OTP', `Your OTP is: ${res.data.dev_otp}`);
        } else {
          Alert.alert('OTP Sent', 'A new verification code has been sent via SMS.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 6) verifyOTP(code);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" translucent={false} />

      <LinearGradient
        colors={['#00FFB2', '#9D5CFF', '#00C8FF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#00FFB2" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={['#00FFB220', '#9D5CFF20']}
            style={styles.headerIcon}
          >
            <Ionicons name="shield-checkmark" size={40} color="#00FFB2" />
          </LinearGradient>

          <Text style={styles.title}>VERIFY YOUR{'\n'}NUMBER</Text>
          <Text style={styles.subTitle}>
            Enter 6-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>{displayPhone || phone}</Text>
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => (inputRefs.current[idx] = r)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                error ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle" size={14} color="#FF0055" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Resend Timer */}
        <View style={styles.resendWrap}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendBtnText}>
                {resending ? 'RESENDING...' : 'RESEND OTP CODE'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerHighlight}>{timer}s</Text>
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyBtn, otp.join('').length < 6 && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.join('').length < 6}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={otp.join('').length === 6 ? ['#00FFB2', '#9D5CFF'] : ['#1A1A2E', '#1A1A2E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.verifyGradient}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={[styles.verifyText, otp.join('').length < 6 && styles.verifyTextDisabled]}>
                  VERIFY & CONTINUE
                </Text>
                <Ionicons name="arrow-forward" size={18} color={otp.join('').length === 6 ? '#000' : '#444'} />
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
    alignSelf: 'flex-start', marginBottom: 24,
  },

  headerWrap: { alignItems: 'center', marginBottom: 32 },
  headerIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 24, color: '#FFFFFF',
    letterSpacing: 2, textAlign: 'center',
    lineHeight: 34, marginBottom: 8,
  },
  subTitle: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 15, color: '#888899',
    textAlign: 'center', lineHeight: 22,
  },
  phoneHighlight: { color: '#00FFB2', fontWeight: 'bold' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: 48, height: 56,
    borderRadius: 12,
    backgroundColor: '#16162A',
    borderWidth: 1.5, borderColor: '#2A2A4A',
    textAlign: 'center',
    color: '#00FFB2',
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
  },
  otpBoxFilled: {
    borderColor: '#00FFB2',
    backgroundColor: '#00FFB210',
  },
  otpBoxError: {
    borderColor: '#FF0055',
    backgroundColor: '#FF005510',
  },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    marginBottom: 16,
  },
  errorText: { color: '#FF0055', fontSize: 13, fontFamily: 'Rajdhani_600SemiBold' },

  resendWrap: { alignItems: 'center', marginBottom: 30 },
  timerText: { color: '#888899', fontSize: 14, fontFamily: 'Rajdhani_400Regular' },
  timerHighlight: { color: '#00FFB2', fontWeight: 'bold' },
  resendBtnText: { color: '#00FFB2', fontSize: 14, fontFamily: 'Rajdhani_600SemiBold', letterSpacing: 1 },

  verifyBtn: { borderRadius: 12, overflow: 'hidden' },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyGradient: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 20,
  },
  verifyText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14, color: '#000000', letterSpacing: 2,
  },
  verifyTextDisabled: { color: '#666688' },
});