import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    TextInput, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const CONVERSATIONS = [
    { id: '1', name: 'Mr. Johnson', role: 'Parent · Aarav Sharma', avatar: 'https://i.pravatar.cc/150?u=p1', last: 'Regarding the field trip...', time: '10:30 AM', unread: 1 },
    { id: '2', name: 'Mrs. Patel', role: 'Parent · Sneha Patel', avatar: 'https://i.pravatar.cc/150?u=p2', last: 'Thank you for the update!', time: 'Yesterday', unread: 0 },
    { id: '3', name: 'Mr. Das', role: 'Parent · Rohit Das', avatar: 'https://i.pravatar.cc/150?u=p3', last: 'Can we reschedule the PTM?', time: 'Mon', unread: 2 },
];

const MESSAGES = [
    { id: 'm1', from: 'them', text: 'Hello! I wanted to ask about the upcoming field trip.', time: '10:28 AM' },
    { id: 'm2', from: 'me', text: 'Hi Mr. Johnson! Sure, the field trip is on March 22. All students need to bring their consent forms by March 15.', time: '10:29 AM' },
    { id: 'm3', from: 'them', text: 'Understood. What should Aarav bring on the day?', time: '10:30 AM' },
];

export default function ChatScreen() {
    const { user } = useAuth();
    const [selected, setSelected] = useState<string | null>(null);
    const [messages, setMessages] = useState(MESSAGES);
    const [input, setInput] = useState('');

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { id: `m${Date.now()}`, from: 'me', text: input, time: 'Now' }]);
        setInput('');
    };

    if (selected) {
        const conv = CONVERSATIONS.find(c => c.id === selected)!;
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
                        <Text style={{ fontSize: 24, color: '#0f172a' }}>‹</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: conv.avatar }} style={styles.chatAvatar} />
                    <View>
                        <Text style={styles.chatName}>{conv.name}</Text>
                        <Text style={styles.chatRole}>{conv.role}</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.messagesContainer}>
                    {messages.map(msg => (
                        <View key={msg.id} style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                            <Text style={[styles.bubbleText, msg.from === 'me' && styles.bubbleTextMe]}>{msg.text}</Text>
                            <Text style={styles.bubbleTime}>{msg.time}</Text>
                        </View>
                    ))}
                </ScrollView>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.chatInput}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                            <Send size={20} color="#0f172a" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSub}>{CONVERSATIONS.reduce((a, c) => a + c.unread, 0)} unread</Text>
            </View>

            <ScrollView contentContainerStyle={styles.convList}>
                {CONVERSATIONS.map(conv => (
                    <TouchableOpacity key={conv.id} style={styles.convCard} onPress={() => setSelected(conv.id)}>
                        <View style={styles.convAvatarWrap}>
                            <Image source={{ uri: conv.avatar }} style={styles.convAvatar} />
                            {conv.unread > 0 && <View style={styles.unreadDot}><Text style={styles.unreadText}>{conv.unread}</Text></View>}
                        </View>
                        <View style={styles.convContent}>
                            <View style={styles.convRow}>
                                <Text style={styles.convName}>{conv.name}</Text>
                                <Text style={styles.convTime}>{conv.time}</Text>
                            </View>
                            <Text style={styles.convRole}>{conv.role}</Text>
                            <Text style={styles.convLast} numberOfLines={1}>{conv.last}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
    convList: { padding: 16, paddingBottom: 40 },
    convCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, padding: 14, marginBottom: 10,
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4,
    },
    convAvatarWrap: { position: 'relative', marginRight: 12 },
    convAvatar: { width: 48, height: 48, borderRadius: 24 },
    unreadDot: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    unreadText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    convContent: { flex: 1 },
    convRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    convName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    convTime: { fontSize: 12, color: '#94a3b8' },
    convRole: { fontSize: 12, color: '#94a3b8', marginBottom: 3 },
    convLast: { fontSize: 13, color: '#64748b' },
    // Chat detail
    chatHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
        paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 36, alignItems: 'center' },
    chatAvatar: { width: 40, height: 40, borderRadius: 20 },
    chatName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    chatRole: { fontSize: 12, color: '#94a3b8' },
    messagesContainer: { padding: 16, paddingBottom: 10 },
    bubble: {
        maxWidth: '78%', padding: 12, borderRadius: 16, marginBottom: 8,
        backgroundColor: '#fff', alignSelf: 'flex-start',
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
    },
    bubbleMe: { backgroundColor: '#20e1d0', alignSelf: 'flex-end' as const },
    bubbleThem: { backgroundColor: '#fff', alignSelf: 'flex-start' as const },
    bubbleText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
    bubbleTextMe: { color: '#0f172a' },
    bubbleTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    chatInput: {
        flex: 1, backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16,
        paddingVertical: 10, fontSize: 15, color: '#0f172a',
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#20e1d0', alignItems: 'center', justifyContent: 'center' },
});
