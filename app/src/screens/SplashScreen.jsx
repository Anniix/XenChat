import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/color';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>XEN</Text>
      <Text style={styles.sub}>CHAT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 64, fontWeight: 'bold', color: colors.neonGreen, letterSpacing: 8 },
  sub: { fontSize: 24, color: colors.textSecondary, letterSpacing: 16 },
});