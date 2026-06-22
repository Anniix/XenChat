import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/color';
import api from '../services/api';

const GlitchText = ({ text, style }) => {
  const glitch1 = useRef(new Animated.Value(0)).current;
  const glitch2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(glitch1, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: -2, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch1, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: 2, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch1, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch2, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.delay(1500 + Math.random() * 2000),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <View style={{ position: 'relative' }}>
      <Animated.Text style={[style, {
        transform: [{ translateX: glitch1 }],
        opacity: 0.6, position: 'absolute',
        color: '#FF00FF',
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 2, height: 0 },
        textShadowRadius: 8,
      }]}>{text}</Animated.Text>
      <Animated.Text style={[style, {
        transform: [{ translateX: glitch2 }],
        opacity: 0.6, position: 'absolute',
        color: '#00FFFF',
        textShadowColor: '#00FFFF',
        textShadowOffset: { width: -2, height: 0 },
        textShadowRadius: 8,
      }]}>{text}</Animated.Text>
      <Text style={style}>{text}</Text>
    </View>
  );
};

const ChatItem = ({ item, index, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400,
        delay: index * 80, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay: index * 80, useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getInitials = (id) => id.slice(0, 4).toUpperCase();
  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
      onPress={() => navigation.navigate('ChatRoom', {
        chatId: item.id,
        playerName: 'PLAYER_' + item.id.slice(0, 4).toUpperCase(),
        realName: item.other_username,
      })}
      >
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[colors.neonGreen + '80', colors.neonPurple + '80']}
            style={styles.avatarBorder}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>#{getInitials(item.id)}</Text>
            </View>
          </LinearGradient>
          <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatRow}>
            <Text style={styles.chatName}>PLAYER_{getInitials(item.id)}</Text>
            <Text style={styles.chatTime}>{formatTime(item.last_message_at)}</Text>
          </View>
          <View style={styles.chatRow}>
            <View style={styles.msgRow}>
              <Ionicons name="lock-closed" size={10} color={colors.neonGreen} />
              <Text style={styles.lastMsg} numberOfLines={1}>
                {' '}{item.last_message || '[ENCRYPTED CHANNEL READY]'}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />
    </Animated.View>
  );
};

export default function ChatsScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchChats();
    Animated.timing(headerAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      if (res.data.success) setChats(res.data.chats);
    } catch (err) {
      console.log('error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    Animated.spring(searchAnim, {
      toValue: showSearch ? 0 : 1,
      friction: 8, useNativeDriver: false,
    }).start();
  };

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 56],
  });

  const filtered = chats.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <LinearGradient
        colors={[colors.neonGreen, colors.neonPurple, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{
          translateY: headerAnim.interpolate({
            inputRange: [0, 1], outputRange: [-20, 0]
          })
        }]
      }]}>
        <GlitchText text="XENCHAT" style={styles.headerTitle} />
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSearch}>
            <Ionicons name={showSearch ? "close" : "search"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.searchWrap, { height: searchHeight, overflow: 'hidden' }]}>
        <View style={styles.searchBar}>
          <LinearGradient
            colors={[colors.neonGreen + '20', colors.neonPurple + '10']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="search" size={14} color={colors.neonGreen} />
          <Text style={styles.searchPrompt}>{'> '}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH_PLAYER..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus={showSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={14} color={colors.neonGreen} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={styles.filterRow}>
        {['All', 'Unread', 'Groups'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            {activeFilter === f && (
              <LinearGradient
                colors={[colors.neonGreen + '30', colors.neonPurple + '20']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.onlineCount}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>1 ONLINE</Text>
        </View>
      </View>

      <LinearGradient
        colors={[colors.neonGreen + '60', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.divider}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wifi-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>NO ACTIVE CHANNELS</Text>
          <Text style={styles.emptySub}>Initiate encrypted connection</Text>
          <TouchableOpacity style={styles.newChatBtn}>
            <LinearGradient
              colors={[colors.neonGreen + '30', colors.neonPurple + '20']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.newChatText}>+ OPEN CHANNEL</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <ChatItem item={item} index={index} navigation={navigation} />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.neonGreen, colors.neonPurple]}
          style={styles.fabGradient}
        >
          <Ionicons name="create-outline" size={22} color="#000" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  topLine: { height: 2, width: '100%' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: '#00FFB2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: '#1A1A1A', marginLeft: 4,
  },

  searchWrap: { paddingHorizontal: 16, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, borderWidth: 1,
    borderColor: colors.neonGreen + '40',
    gap: 6, overflow: 'hidden',
  },
  searchPrompt: {
    color: '#00FFB2',
    fontFamily: 'Orbitron_400Regular',
    fontSize: 12,
  },
  searchInput: {
    flex: 1, color: '#F0F0F0',
    fontSize: 13, paddingVertical: 0,
    fontFamily: 'Rajdhani_400Regular',
  },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    paddingVertical: 8, gap: 8, alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 4, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden',
  },
  filterChipActive: { borderColor: colors.neonGreen },
  filterText: {
    color: '#888888', fontSize: 11,
    fontFamily: 'Rajdhani_600SemiBold', letterSpacing: 1,
  },
  filterTextActive: {
    color: '#00FFB2', fontFamily: 'Rajdhani_600SemiBold',
    fontWeight: '700', letterSpacing: 1,
  },
  onlineCount: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FFB2' },
  onlineText: {
    color: '#00FFB2', fontSize: 10,
    fontFamily: 'Rajdhani_600SemiBold', letterSpacing: 2,
  },

  divider: { height: 1, marginBottom: 4 },

  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatarBorder: {
    width: 54, height: 54, borderRadius: 27,
    padding: 2, justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    color: '#00FFB2',
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10, letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#00FFB2',
    borderWidth: 2, borderColor: '#0D0D0D',
  },

  chatInfo: { flex: 1 },
  chatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 5,
  },
  chatName: {
    color: '#FFFFFF', fontSize: 15,
    fontFamily: 'Rajdhani_600SemiBold', letterSpacing: 2,
  },
  chatTime: { color: '#444444', fontSize: 11 },
  msgRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lastMsg: {
    color: '#888888', fontSize: 13,
    flex: 1, fontFamily: 'Rajdhani_400Regular',
  },
  badge: {
    backgroundColor: '#00FFB2', borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#00FFB215', marginLeft: 84 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: {
    color: '#888888', fontSize: 16,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 3,
  },
  emptySub: {
    color: '#444444', fontSize: 12,
    fontFamily: 'Rajdhani_400Regular', letterSpacing: 1,
  },
  newChatBtn: {
    marginTop: 12, borderWidth: 1, borderColor: '#00FFB2',
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 4, overflow: 'hidden',
  },
  newChatText: {
    color: '#00FFB2', fontFamily: 'Orbitron_400Regular',
    letterSpacing: 2, fontSize: 12,
  },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: '#00FFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 10,
  },
  fabGradient: {
    width: 56, height: 56,
    justifyContent: 'center', alignItems: 'center',
  },
});