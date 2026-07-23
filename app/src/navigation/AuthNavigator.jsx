import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import OTPScreen from '../screens/OTPScreen';
import UsernameScreen from '../screens/UsernameScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Username" component={UsernameScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}