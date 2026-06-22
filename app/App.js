import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useFonts, Orbitron_700Bold, Orbitron_400Regular } from '@expo-google-fonts/orbitron';
import { Rajdhani_600SemiBold, Rajdhani_400Regular } from '@expo-google-fonts/rajdhani';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#00FFB2', letterSpacing: 4 }}>LOADING...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}