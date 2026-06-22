import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Animated, StatusBar, KeyboardAvoidingView,
  Platform, Modal, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/color';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const ChatBackground = () => {
  const symbols = ['⬡', '◈', '✦', '⬢', '◆', '✧', '⬡', '◈'];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array(80).fill(0).map((_, i) => (
        <Text
          key={i}
          style={[styles.bgSymbol, {
            top: Math.floor(i / 8) * 60 + (i % 2 === 0 ? 0 : 30),
            left: (i % 8) * 50,
            opacity: 0.03 + (i % 4) * 0.01,
            fontSize: 10 + (i % 3) * 4,
            color: i % 3 === 0 ? '#00FFB2' : i % 3 === 1 ? '#9D5CFF' : '#00C8FF',
          }]}>
          {symbols[i % symbols.length]}
        </Text>
      ))}
    </View>
  );
};

const getDateLabel = (timestamp) => {
  if (!timestamp) return null;
  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.toDateString() === today.toDateString()) return 'TODAY';
  if (msgDate.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return msgDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).toUpperCase();
};

const DateSeparator = ({ label }) => (
  <View style={styles.dateSep}>
    <View style={styles.dateLine} />
    <View style={styles.dateBadge}>
      <Text style={styles.dateText}>{label}</Text>
    </View>
    <View style={styles.dateLine} />
  </View>
);

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, playerName, realName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const flatListRef = useRef(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuthStore();
  const displayName = realName || playerName || 'PLAYER_????';

  useEffect(() => {
    fetchMessages();
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(inputAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      if (res.data.success) setMessages(res.data.messages);
    } catch (err) {
      console.log('msgs error:', err.message);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const tempMsg = {
      id: Date.now().toString(),
      ciphertext: text,
      sender_id: user?.id,
      sent_at: new Date().toISOString(),
      temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const messagesWithDates = () => {
    const result = [];
    let lastDate = null;
    messages.forEach((msg, index) => {
      const dateLabel = getDateLabel(msg.sent_at || msg.created_at);
      if (dateLabel !== lastDate) {
        result.push({ type: 'date', id: `date-${index}`, label: dateLabel });
        lastDate = dateLabel;
      }
      result.push({ type: 'msg', ...msg });
    });
    return result;
  };

  const emojis = [
    '😀','😂','🥲','😍','🤩','😎','🥶','😤','🤬','💀',
    '🔥','💯','⚡','🎮','🏆','💎','🛡️','⚔️','🎯','🚀',
    '❤️','💚','💜','🖤','🤍','👊','✌️','🤝','👾','🤖',
  ];

  const MessageBubble = ({ item }) => {
    const isMe = item.sender_id === user?.id;
    const slideAnim = useRef(new Animated.Value(isMe ? 50 : -50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
    }, []);

    return (
      <Animated.View style={[
        styles.msgWrapper,
        isMe ? styles.msgWrapperMe : styles.msgWrapperThem,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }, { scale: scaleAnim }] }
      ]}>
        {!isMe && (
          <LinearGradient
            colors={['#9D5CFF80', '#00FFB280']}
            style={styles.msgAvatarBorder}
          >
            <View style={styles.msgAvatar}>
              <Text style={styles.msgAvatarText}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
        )}

        <View style={{ maxWidth: '75%' }}>
          {isMe ? (
            // MY MESSAGE — Dark with neon border
            <View style={styles.bubbleMe}>
              <LinearGradient
                colors={['#1A1A3E', '#0D0D2E']}
                style={styles.bubbleMeInner}
              >
                <View style={styles.bubbleMeAccent} />
                <Text style={styles.bubbleTextMe}>{item.ciphertext}</Text>
                <View style={styles.msgMetaMe}>
                  <Text style={styles.msgTimeMe}>{formatTime(item.sent_at || item.created_at)}</Text>
                  <Ionicons name="checkmark-done" size={13} color="#00FFB2" />
                </View>
              </LinearGradient>
            </View>
          ) : (
            // THEIR MESSAGE
            <View style={styles.bubbleThem}>
              <View style={styles.lockRow}>
                <Ionicons name="lock-closed" size={8} color={colors.neonGreen} />
                <Text style={styles.encLabel}> E2E</Text>
              </View>
              <Text style={styles.bubbleTextThem}>{item.ciphertext}</Text>
              <Text style={styles.msgTimeThem}>{formatTime(item.sent_at || item.created_at)}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const menuOptions = [
    { icon: 'person-outline', label: 'View Profile' },
    { icon: 'search-outline', label: 'Search Messages' },
    { icon: 'shield-outline', label: 'Privacy Mode' },
    { icon: 'game-controller-outline', label: 'Play Game' },
    { icon: 'trash-outline', label: 'Clear Chat', danger: true },
    { icon: 'ban-outline', label: 'Block Player', danger: true },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />
      <ChatBackground />

      {/* Top neon line */}
      <LinearGradient
        colors={['#00FFB2', '#9D5CFF', '#00C8FF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topLine}
      />

      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.neonGreen} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.8}>
          <LinearGradient
            colors={['#9D5CFF80', '#00FFB280']}
            style={styles.headerAvatarBorder}
          >
            <View style={styles.headerAvatarInner}>
              <Text style={styles.headerAvatarText}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="videocam-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <LinearGradient
        colors={['#9D5CFF30', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.divider}
      />

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messagesWithDates()}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <LinearGradient
              colors={['#9D5CFF30', '#00FFB220']}
              style={styles.emptyChatIcon}
            >
              <Ionicons name="shield-checkmark" size={40} color={colors.neonGreen} />
            </LinearGradient>
            <Text style={styles.emptyChatText}>CHANNEL SECURED</Text>
            <Text style={styles.emptyChatSub}>Messages are end-to-end encrypted</Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.type === 'date') return <DateSeparator label={item.label} />;
          return <MessageBubble item={item} />;
        }}
      />

      {/* Emoji Picker */}
      {showEmoji && (
        <View style={styles.emojiPicker}>
          <View style={styles.emojiGrid}>
            {emojis.map((e, i) => (
              <TouchableOpacity
                key={i}
                style={styles.emojiBtn}
                onPress={() => setText(prev => prev + e)}
              >
                <Text style={styles.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Bar */}
      <Animated.View style={[styles.inputBar, {
        opacity: inputAnim,
        transform: [{ translateY: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
      }]}>
        <TouchableOpacity
          style={styles.emojiToggleBtn}
          onPress={() => setShowEmoji(!showEmoji)}
        >
          <Ionicons
            name={showEmoji ? "keypad-outline" : "happy-outline"}
            size={22}
            color={showEmoji ? colors.neonGreen : colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#333355"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            onFocus={() => setShowEmoji(false)}
          />
          <TouchableOpacity style={styles.attachInner}>
            <Ionicons name="attach" size={20} color="#444466" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={sendMessage}
          activeOpacity={0.8}
        >
          {text.trim().length > 0 ? (
            <LinearGradient
              colors={['#00FFB2', '#9D5CFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={18} color="#000" />
            </LinearGradient>
          ) : (
            <View style={[styles.sendGradient, { backgroundColor: '#1A1A2E' }]}>
              <Ionicons name="mic-outline" size={18} color="#444466" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* 3-dot Menu */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuBox}>
            <LinearGradient
              colors={['#1A1A2E', '#0D0D1A']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>OPTIONS</Text>
              <LinearGradient
                colors={['#00FFB2', '#9D5CFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.menuTitleLine}
              />
            </View>
            {menuOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => setShowMenu(false)}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={opt.danger ? colors.danger : colors.neonGreen}
                />
                <Text style={[styles.menuLabel, opt.danger && styles.menuLabelDanger]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },

  bgSymbol: { position: 'absolute', fontWeight: 'bold' },

  topLine: { height: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#0A0A1Aee',
  },
  backBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: '#1A1A2E', marginRight: 6,
    borderWidth: 1, borderColor: '#00FFB220',
  },
  headerCenter: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  headerAvatarBorder: {
    width: 44, height: 44, borderRadius: 22,
    padding: 2, justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarInner: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0D0D2E',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: {
    color: '#00FFB2', fontFamily: 'Orbitron_400Regular', fontSize: 11,
  },
  headerName: {
    color: '#FFFFFF', fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16, letterSpacing: 1.5,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00FFB2' },
  onlineText: {
    color: '#00FFB2', fontSize: 10,
    fontFamily: 'Rajdhani_600SemiBold', letterSpacing: 2,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: '#1A1A2E', marginLeft: 3,
    borderWidth: 1, borderColor: '#9D5CFF20',
  },

  divider: { height: 1 },
  msgList: { padding: 12, paddingBottom: 8 },

  dateSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16, paddingHorizontal: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#9D5CFF20' },
  dateBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#1A1A2E',
    borderWidth: 1, borderColor: '#9D5CFF40',
    borderRadius: 12, marginHorizontal: 8,
  },
  dateText: {
    color: '#9D5CFF', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 2,
  },

  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 10, alignItems: 'flex-end',
  },
  msgWrapperMe: { justifyContent: 'flex-end' },
  msgWrapperThem: { justifyContent: 'flex-start' },

  msgAvatarBorder: {
    width: 34, height: 34, borderRadius: 17,
    padding: 1.5, justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  msgAvatar: {
    width: 31, height: 31, borderRadius: 16,
    backgroundColor: '#0D0D2E',
    justifyContent: 'center', alignItems: 'center',
  },
  msgAvatarText: {
    color: '#00FFB2', fontFamily: 'Orbitron_400Regular', fontSize: 9,
  },

  // MY BUBBLE — Dark purple with neon accent
  bubbleMe: {
    borderRadius: 18, borderBottomRightRadius: 4,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#00FFB240',
    shadowColor: '#00FFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  bubbleMeInner: {
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMeAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: '#00FFB2',
    borderTopLeftRadius: 18,
  },
  bubbleTextMe: {
    color: '#E0E0FF',
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16, paddingLeft: 8,
  },
  msgMetaMe: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 4, marginTop: 4,
  },
  msgTimeMe: { color: '#00FFB260', fontSize: 10 },

  // THEIR BUBBLE
  bubbleThem: {
    backgroundColor: '#16162A',
    borderWidth: 1, borderColor: '#9D5CFF30',
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#9D5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  lockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  encLabel: {
    color: '#00FFB2', fontSize: 8,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1,
  },
  bubbleTextThem: {
    color: '#D0D0FF', fontFamily: 'Rajdhani_400Regular', fontSize: 16,
  },
  msgTimeThem: { color: '#44446688', fontSize: 10, marginTop: 4, textAlign: 'right' },

  emptyChat: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyChatIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyChatText: {
    color: '#888', fontFamily: 'Orbitron_700Bold',
    fontSize: 13, letterSpacing: 3,
  },
  emptyChatSub: {
    color: '#444', fontFamily: 'Rajdhani_400Regular',
    fontSize: 13, letterSpacing: 1,
  },

  emojiPicker: {
    backgroundColor: '#0D0D1A',
    borderTopWidth: 1, borderTopColor: '#9D5CFF30',
    paddingVertical: 8,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  emojiBtn: { width: '10%', paddingVertical: 6, alignItems: 'center' },
  emoji: { fontSize: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: '#1A1A2E',
    backgroundColor: '#0A0A1Aee',
    gap: 6,
  },
  emojiToggleBtn: {
    padding: 10, borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1, borderColor: '#9D5CFF20',
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 24, borderWidth: 1,
    borderColor: '#9D5CFF30',
    backgroundColor: '#12122A',
    paddingHorizontal: 14, paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    flex: 1, color: '#D0D0FF',
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 15, paddingVertical: 0,
  },
  attachInner: { padding: 2, marginLeft: 6 },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendGradient: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 22,
  },

  menuOverlay: {
    flex: 1, backgroundColor: '#00000099',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: 80, paddingRight: 12,
  },
  menuBox: {
    width: 220, borderRadius: 12,
    borderWidth: 1, borderColor: '#9D5CFF40',
    overflow: 'hidden', paddingBottom: 8,
  },
  menuHeader: { padding: 14, paddingBottom: 8 },
  menuTitle: {
    color: '#00FFB2', fontFamily: 'Orbitron_700Bold',
    fontSize: 11, letterSpacing: 3,
  },
  menuTitleLine: { height: 1, marginTop: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  menuLabel: {
    color: '#CCCCEE', fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14, letterSpacing: 1,
  },
  menuLabelDanger: { color: '#FF4545' },
});