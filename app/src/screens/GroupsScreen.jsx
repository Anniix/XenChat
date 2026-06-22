import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/color';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Groups</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textPrimary, fontSize: 24 },
});