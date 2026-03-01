import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Users, Globe } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/constants/api';

export default function PostUpdateScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'class' | 'all'>('class');
    const [sending, setSending] = useState(false);

    const className = user?.className ?? 'My Class';

    const send = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Required', 'Please fill in the title and message.'); return;
        }

        setSending(true);
        try {
            // Post as an event/announcement to the backend
            const res = await fetch(ENDPOINTS.teacherEvents, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: message.trim(),
                    startDate: new Date().toISOString(),
                    type: 'ANNOUNCEMENT',
                    location: audience === 'class' ? className : 'All School',
                }),
            });

            if (!res.ok) throw new Error();

            Alert.alert(
                '✓ Update Sent!',
                `Your message has been posted${audience === 'class' ? ` for ${className}` : ' to all parents'}.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
            setTitle(''); setMessage('');
        } catch {
            Alert.alert('Error', 'Failed to send update. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Update</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subhead}>Share a news update with parents and students.</Text>

                {/* Audience */}
                <Text style={styles.label}>Send To</Text>
                <View style={styles.audienceRow}>
                    <TouchableOpacity
                        style={[styles.audienceBtn, audience === 'class' && styles.audienceBtnActive]}
                        onPress={() => setAudience('class')}>
                        <Users size={16} color={audience === 'class' ? '#0f172a' : '#94a3b8'} />
                        <Text style={[styles.audienceBtnText, audience === 'class' && styles.audienceBtnTextActive]}>
                            {className}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.audienceBtn, audience === 'all' && styles.audienceBtnActive]}
                        onPress={() => setAudience('all')}>
                        <Globe size={16} color={audience === 'all' ? '#0f172a' : '#94a3b8'} />
                        <Text style={[styles.audienceBtnText, audience === 'all' && styles.audienceBtnTextActive]}>All Parents</Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Field Trip Reminder"
                    placeholderTextColor="#94a3b8"
                />

                {/* Message */}
                <Text style={styles.label}>Message *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write your update here..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />

                {/* Preview Card */}
                {(title || message) && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewLabel}>Preview</Text>
                        <Text style={styles.previewTitle}>{title || 'Untitled'}</Text>
                        <Text style={styles.previewMessage}>{message}</Text>
                        <Text style={styles.previewMeta}>
                            → {audience === 'class' ? `${className} Parents` : 'All School Parents'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                    onPress={send}
                    disabled={sending}>
                    {sending
                        ? <ActivityIndicator color="#0f172a" size="small" />
                        : <><Send size={18} color="#0f172a" /><Text style={styles.sendText}>Send Update</Text></>
                    }
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    content: { padding: 20 },
    subhead: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
    audienceRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    audienceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
    audienceBtnActive: { backgroundColor: '#20e1d0', borderColor: '#20e1d0' },
    audienceBtnText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
    audienceBtnTextActive: { color: '#0f172a' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a', marginBottom: 16 },
    textarea: { height: 140, paddingTop: 14 },
    previewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#20e1d0', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
    previewLabel: { fontSize: 11, fontWeight: '700', color: '#20e1d0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    previewTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    previewMessage: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
    previewMeta: { fontSize: 12, color: '#94a3b8' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    sendBtn: { backgroundColor: '#20e1d0', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
});
