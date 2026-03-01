import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Megaphone, Info, Calendar, Star, Smile } from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';

interface EventItem {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    type: string;
}

const TYPE_ICON: Record<string, any> = {
    meeting: Bell,
    holiday: Calendar,
    exhibition: Star,
    activity: Smile,
    other: Megaphone,
};
const TYPE_COLOR: Record<string, { color: string; bg: string; label: string }> = {
    meeting: { color: '#3b82f6', bg: '#eff6ff', label: 'Meeting' },
    holiday: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Holiday' },
    exhibition: { color: '#ec4899', bg: '#fdf2f8', label: 'Exhibition' },
    activity: { color: '#f97316', bg: '#fff7ed', label: 'Activity' },
    other: { color: '#10b981', bg: '#ecfdf5', label: 'Notice' },
};

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AnnouncementsScreen() {
    const router = useRouter();

    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(ENDPOINTS.events);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch {
            setError('Could not load announcements. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Announcements</Text>
                    <Text style={styles.headerSub}>School Events & Notices</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Loading announcements…</Text>
                </View>
            ) : error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchEvents}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {events.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Info size={32} color="#94a3b8" />
                            <Text style={styles.emptyTitle}>No announcements yet</Text>
                            <Text style={styles.emptyText}>School events and notices will appear here.</Text>
                        </View>
                    ) : (
                        events.map(ev => {
                            const tc = TYPE_COLOR[ev.type] ?? TYPE_COLOR.other;
                            const Icon = TYPE_ICON[ev.type] ?? Megaphone;
                            return (
                                <View key={ev.id} style={[styles.card, { borderLeftColor: tc.color }]}>
                                    <View style={styles.cardTop}>
                                        <View style={[styles.iconBox, { backgroundColor: tc.bg }]}>
                                            <Icon size={15} color={tc.color} />
                                        </View>
                                        <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                                            <Text style={[styles.typeText, { color: tc.color }]}>{tc.label}</Text>
                                        </View>
                                        <Text style={styles.date}>{fmtDate(ev.startDate)}</Text>
                                    </View>
                                    <Text style={styles.cardTitle}>{ev.title}</Text>
                                    {ev.description ? (
                                        <Text style={styles.cardBody}>{ev.description}</Text>
                                    ) : null}
                                    {ev.location ? (
                                        <Text style={styles.location}>📍 {ev.location}</Text>
                                    ) : null}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    headerSub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    retryText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    content: { padding: 20, paddingBottom: 40 },
    emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, borderLeftWidth: 4, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    typeText: { fontSize: 10, fontWeight: '700' },
    date: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' as any },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    cardBody: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 6 },
    location: { fontSize: 12, color: '#64748b', fontWeight: '500' },
});
