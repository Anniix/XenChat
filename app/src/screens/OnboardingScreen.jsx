import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { colors } from '../theme/color';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function OnboardingScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleContinue = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Valid phone number daalo');
      return;
    }

    setLoading(true);
    try {
      // Try login first
      const res = await api.post('/auth/login', { phone });
      if (res.data.success) {
        setAuth(res.data.user, res.data.token);
        // Navigate to main app
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // User nahi hai — Username screen pe bhejo
        navigation.navigate('Username', { phone });
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Kuch gadbad hui');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>XEN<Text style={styles.titleAccent}>CHAT</Text></Text>
      <Text style={styles.subtitle}>Encrypted. Incognito. Yours.</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="9999999999"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.bg} />
          : <Text style={styles.btnText}>CONTINUE →</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', paddingHorizontal: 32,
  },
  title: {
    fontSize: 48, fontWeight: 'bold',
    color: colors.textPrimary, letterSpacing: 4, marginBottom: 8,
  },
  titleAccent: { color: colors.neonGreen },
  subtitle: {
    fontSize: 14, color: colors.textSecondary,
    letterSpacing: 2, marginBottom: 48,
  },
  label: { color: colors.textSecondary, fontSize: 12, marginBottom: 8, letterSpacing: 1 },
  inputContainer: { marginBottom: 24 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
  },
  prefix: { color: colors.neonGreen, fontSize: 16, marginRight: 8 },
  input: {
    flex: 1, color: colors.textPrimary,
    fontSize: 18, paddingVertical: 16,
  },
  btn: {
    backgroundColor: colors.neonGreen,
    paddingVertical: 16, borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.bg, fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
});