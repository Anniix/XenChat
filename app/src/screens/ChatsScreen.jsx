import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar, RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/color';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { connectSocket } from '../services/socketService';
import useAuthStore from '../store/useAuthStore';

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

const ChatItem = ({ item, index, navigation, currentUserId }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
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

  const isMyLastMsg = item.last_message_sender_id === currentUserId;

  const renderLastMsgTick = () => {
    if (!isMyLastMsg || !item.last_message) return null;

    if (item.last_message_status === 'read') {
      return (
        <Ionicons
          name="checkmark-done"
          size={14}
          color="#00FFB2"
          style={{
            marginRight: 4,
            shadowColor: '#00FFB2',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 5,
          }}
        />
      );
    }
    if (item.last_message_status === 'delivered') {
      return <Ionicons name="checkmark-done" size={14} color="#CCCCCC" style={{ marginRight: 4 }} />;
    }
    return <Ionicons name="checkmark" size={13} color="#888888" style={{ marginRight: 4 }} />;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
      onPress={() => navigation.navigate('ChatRoom', {
        chatId: item.id,
        otherUserId: item.other_user_id,
        playerName: item.other_username || 'PLAYER_' + item.id.slice(0, 4).toUpperCase(),
        realName: item.other_username,
      })}
      >
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[colors.neonGreen + '80', colors.neonPurple + '80']}
            style={styles.avatarBorder}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.other_username || item.id).slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
          <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatRow}>
            <Text style={styles.chatName}>{item.other_username || 'PLAYER_' + item.id.slice(0,4).toUpperCase()}</Text>
            <Text style={styles.chatTime}>{formatTime(item.last_message_at)}</Text>
          </View>
          <View style={styles.chatRow}>
            <View style={styles.msgRow}>
              {renderLastMsgTick()}
              <Text style={styles.lastMsg} numberOfLines={1}>
                {item.last_message || 'No messages yet'}
              </Text>
            </View>
            {Number(item.unread_count) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            )}
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
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const { user, token } = useAuthStore();

  const fetchChatsRef = useRef(null);
  const handleIncomingMessageRef = useRef(null);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      if (res.data.success) setChats(res.data.chats);
    } catch (err) {
      console.log('error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  fetchChatsRef.current = fetchChats;

  handleIncomingMessageRef.current = (newMsg) => {
    console.log('⚡ ChatsScreen message:new event:', newMsg);
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.id === newMsg.chat_id);
      if (chatIndex === -1) {
        fetchChatsRef.current?.();
        return prevChats;
      }

      const targetChat = { ...prevChats[chatIndex] };
      targetChat.last_message = newMsg.ciphertext;
      targetChat.last_message_at = newMsg.sent_at;
      targetChat.last_message_sender_id = newMsg.sender_id;
      targetChat.last_message_status = newMsg.status || 'sent';

      const currentUserId = useAuthStore.getState().user?.id;
      if (newMsg.sender_id !== currentUserId) {
        targetChat.unread_count = (Number(targetChat.unread_count) || 0) + 1;
      }

      const otherChats = prevChats.filter((c) => c.id !== newMsg.chat_id);
      return [targetChat, ...otherChats];
    });

    // Also sync with server
    fetchChatsRef.current?.();
  };

  useEffect(() => {
    fetchChats();
    const socket = token ? connectSocket(token) : null;

    Animated.timing(headerAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    const onNewMsg = (msg) => handleIncomingMessageRef.current?.(msg);
    const onStatusMsg = () => fetchChatsRef.current?.();
    const onReadMsg = () => fetchChatsRef.current?.();

    if (socket) {
      socket.on('message:new', onNewMsg);
      socket.on('message:status', onStatusMsg);
      socket.on('messages:read', onReadMsg);
    }

    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchChatsRef.current?.();
    });

    return () => {
      unsubscribeFocus();
      if (socket) {
        socket.off('message:new', onNewMsg);
        socket.off('message:status', onStatusMsg);
        socket.off('messages:read', onReadMsg);
      }
    };
  }, [navigation, token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const [globalResults, setGlobalResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (text) => {
    setSearch(text);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (text.trim().length >= 1) {
      setSearchingGlobal(true);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/users/search?q=${encodeURIComponent(text.trim())}`);
          if (res.data.success) {
            setGlobalResults(res.data.users || []);
          }
        } catch (err) {
          setGlobalResults([]);
        } finally {
          setSearchingGlobal(false);
        }
      }, 300);
    } else {
      setGlobalResults([]);
      setSearchingGlobal(false);
    }
  };

  const handleStartChat = async (targetUser) => {
    try {
      const res = await api.post('/chats', { recipient_id: targetUser.id });
      if (res.data.success) {
        const chat = res.data.chat;
        fetchChats();
        setSearch('');
        setShowSearch(false);
        setGlobalResults([]);
        navigation.navigate('ChatRoom', {
          chatId: chat.id,
          otherUserId: targetUser.id,
          playerName: targetUser.username,
          realName: targetUser.username,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not start chat');
    }
  };

  const toggleSearch = () => {
    const nextState = !showSearch;
    setShowSearch(nextState);
    if (!nextState) {
      setSearch('');
      setGlobalResults([]);
    }
    Animated.spring(searchAnim, {
      toValue: nextState ? 1 : 0,
      friction: 8, useNativeDriver: false,
    }).start();
  };

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 56],
  });

  const filteredLocalChats = chats.filter(c => {
    const matchesSearch = search.length === 0 ||
      (c.other_username || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Groups' ? c.is_group === true :
      true;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" translucent={false} />

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
            placeholder="Search username or phone..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={handleSearchChange}
            autoFocus={showSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
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
      </View>

      <LinearGradient
        colors={[colors.neonGreen + '60', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.divider}
      />

      {/* Global Search Results List */}
      {search.trim().length > 0 ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={{ color: '#00FFB2', fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, marginVertical: 10, letterSpacing: 1 }}>
            SEARCH RESULTS FOR "{search}"
          </Text>

          {searchingGlobal ? (
            <ActivityIndicator size="small" color="#00FFB2" style={{ marginTop: 20 }} />
          ) : globalResults.length === 0 && filteredLocalChats.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="person-remove-outline" size={48} color="#444466" />
              <Text style={{ color: '#888899', fontFamily: 'Rajdhani_600SemiBold', fontSize: 16, marginTop: 10 }}>
                No user found matching "{search}"
              </Text>
              <Text style={{ color: '#555577', fontSize: 12, marginTop: 4 }}>
                Check spelling or try a phone number
              </Text>
            </View>
          ) : (
            <FlatList
              data={globalResults}
              keyExtractor={(u) => u.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: u }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A3E',
                  }}
                  onPress={() => handleStartChat(u)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A3E',
                      justify: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00FFB240',
                    }}>
                      <Text style={{ color: '#00FFB2', fontFamily: 'Orbitron_700Bold', fontSize: 16 }}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: '#FFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 }}>
                        {u.username}
                      </Text>
                      {u.phone ? (
                        <Text style={{ color: '#888899', fontSize: 12 }}>+{u.phone}</Text>
                      ) : null}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8,
                      borderRadius: 20, backgroundColor: '#00FFB220',
                      borderWidth: 1, borderColor: '#00FFB2',
                    }}
                    onPress={() => handleStartChat(u)}
                  >
                    <Text style={{ color: '#00FFB2', fontFamily: 'Orbitron_700Bold', fontSize: 12 }}>
                      CHAT
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : chats.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.neonGreen} />
          <Text style={styles.emptyText}>NO CHATS YET</Text>
          <Text style={styles.emptySub}>Search username or phone number to start chatting</Text>
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={toggleSearch}
          >
            <LinearGradient
              colors={[colors.neonGreen + '30', colors.neonPurple + '20']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.newChatText}>+ START A CHAT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Existing Chats List */
        <FlatList
          data={filteredLocalChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.neonGreen}
              colors={[colors.neonGreen]}
            />
          }
          renderItem={({ item, index }) => (
            <ChatItem item={item} index={index} navigation={navigation} currentUserId={user?.id} />
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={toggleSearch}
      >
        <LinearGradient
          colors={[colors.neonGreen, colors.neonPurple]}
          style={styles.fabGradient}
        >
          <Ionicons name="create-outline" size={22} color="#000" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
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