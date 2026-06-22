import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/color';

export default function UsernameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Username Setup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textPrimary, fontSize: 24 },
});