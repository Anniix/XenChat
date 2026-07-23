import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const glitch1 = useRef(new Animated.Value(0)).current;
  const glitch2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Glow pulse
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      // Text appear
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(lineWidth, { toValue: 1, duration: 800, useNativeDriver: false }),
      ]),
    ]).start();

    // Glitch loop
    const glitch = () => {
      Animated.sequence([
        Animated.timing(glitch1, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: -3, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch1, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: 3, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch1, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.delay(2000 + Math.random() * 2000),
      ]).start(() => glitch());
    };
    setTimeout(() => glitch(), 1000);

    // Navigate after 3s
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const glowSize = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 40],
  });

  const lineWidthInterp = lineWidth.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '60%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Background grid */}
      <View style={styles.bgGrid}>
        {Array(12).fill(0).map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: (i * height) / 12 }]} />
        ))}
        {Array(8).fill(0).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i * width) / 8 }]} />
        ))}
      </View>

      {/* Corner decorations */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        {/* Glow behind logo */}
        <Animated.View style={[styles.logoGlow, {
          shadowRadius: glowSize,
          shadowOpacity: glowAnim,
        }]} />

        {/* Glitch layers */}
        <Animated.Image
          source={require('../assets/images/logo.png')}
          style={[styles.logoGlitch, {
            transform: [{ translateX: glitch1 }],
            tintColor: '#FF00FF',
            opacity: 0.4,
          }]}
        />
        <Animated.Image
          source={require('../assets/images/logo.png')}
          style={[styles.logoGlitch, {
            transform: [{ translateX: glitch2 }],
            tintColor: '#00FFFF',
            opacity: 0.4,
          }]}
        />

        {/* Main logo */}
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textWrap, {
        opacity: textOpacity,
        transform: [{ translateY: textSlide }],
      }]}>
        {/* Glitch text */}
        <View style={{ position: 'relative' }}>
          <Animated.Text style={[styles.title, {
            transform: [{ translateX: glitch1 }],
            color: '#FF00FF', opacity: 0.5, position: 'absolute',
          }]}>XENCHAT</Animated.Text>
          <Animated.Text style={[styles.title, {
            transform: [{ translateX: glitch2 }],
            color: '#00FFFF', opacity: 0.5, position: 'absolute',
          }]}>XENCHAT</Animated.Text>
          <Text style={styles.title}>XENCHAT</Text>
        </View>

        {/* Animated line */}
        <View style={styles.lineContainer}>
          <Animated.View style={[styles.line, { width: lineWidthInterp }]}>
            <LinearGradient
              colors={['#00FFB2', '#9D5CFF', '#00C8FF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.tagline}>ENCRYPTED · INCOGNITO · GAMING</Text>
      </Animated.View>

      {/* Bottom loading bar */}
      <View style={styles.loadingWrap}>
        <View style={styles.loadingBg}>
          <Animated.View style={[styles.loadingFill, { width: lineWidthInterp }]}>
            <LinearGradient
              colors={['#00FFB2', '#9D5CFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.loadingText}>INITIALIZING SECURE CHANNEL...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#050510',
    justifyContent: 'center', alignItems: 'center',
  },

  bgGrid: { ...StyleSheet.absoluteFillObject },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: '#00FFB205',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: '#9D5CFF05',
  },

  corner: {
    position: 'absolute', width: 20, height: 20,
    borderColor: '#00FFB240',
  },
  cornerTL: { top: 40, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 40, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 40, left: 24, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 40, right: 24, borderBottomWidth: 2, borderRightWidth: 2 },

  logoWrap: { position: 'relative', marginBottom: 32 },
  logoGlow: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 40,
    shadowColor: '#00FFB2',
    shadowOffset: { width: 0, height: 0 },
    top: 0, left: 0,
  },
  logoGlitch: {
    position: 'absolute',
    width: 160, height: 160,
  },
  logo: { width: 160, height: 160 },

  textWrap: { alignItems: 'center', gap: 8 },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 34, color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: '#00FFB2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  lineContainer: {
    width: '100%', height: 2,
    alignItems: 'center', marginVertical: 6,
  },
  line: { height: 2 },
  tagline: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 10, color: '#9D5CFF',
    letterSpacing: 3,
  },

  loadingWrap: {
    position: 'absolute', bottom: 60,
    width: '70%', alignItems: 'center', gap: 8,
  },
  loadingBg: {
    width: '100%', height: 2,
    backgroundColor: '#1A1A2E',
    borderRadius: 1, overflow: 'hidden',
  },
  loadingFill: { height: '100%' },
  loadingText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8, color: '#444466',
    letterSpacing: 2,
  },
});