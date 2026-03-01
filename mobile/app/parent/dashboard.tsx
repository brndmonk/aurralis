import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronRight, ClipboardCheck, Smile, DollarSign, Star,
    Bell, BookOpen, Image as ImageIcon, Calendar, Megaphone, Info,
} from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';
import { BRAND } from '@/constants/Brand';

const QUICK_LINKS = [
    { label: 'Class Photos', icon: ImageIcon, color: '#ec4899', bg: '#fdf2f8', route: '/parent/photos' },
    { label: 'Daily Diary', icon: BookOpen, color: '#f97316', bg: '#fff7ed', route: '/parent/daily-diary' },
    { label: 'Attendance', icon: ClipboardCheck, color: '#22c55e', bg: '#f0fdf4', route: '/parent/attendance' },
    { label: 'Activities', icon: Smile, color: '#8b5cf6', bg: '#f5f3ff', route: '/parent/homework' },
    { label: 'Fee Status', icon: DollarSign, color: '#0ea5e9', bg: '#f0f9ff', route: '/parent/fees' },
    { label: 'Progress', icon: Star, color: '#ec4899', bg: '#fdf2f8', route: '/parent/report-cards' },
];

const TYPE_ICON: Record<string, any> = {
    meeting: Bell,
    holiday: Calendar,
    exhibition: Star,
    activity: Smile,
    other: Megaphone,
};
const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
    meeting: { color: '#3b82f6', bg: '#eff6ff' },
    holiday: { color: '#8b5cf6', bg: '#f5f3ff' },
    exhibition: { color: '#ec4899', bg: '#fdf2f8' },
    activity: { color: '#f97316', bg: '#fff7ed' },
    other: { color: '#10b981', bg: '#ecfdf5' },
};

interface ApiEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    type: string;
}

function formatEventDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ParentDashboard() {
    const router = useRouter();
    const { user } = useAuth();

    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    const childName = user?.childName ?? 'Your Child';
    const childClass = user?.childClass ?? '';
    const attendanceRate = user?.attendanceRate ?? 0;
    const pendingFees = user?.pendingFees ?? 0;

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(ENDPOINTS.events);
            if (res.ok) {
                const data = await res.json();
                setEvents((data.events ?? []).slice(0, 4));
            }
        } catch {
            // Network error — show empty state
        } finally {
            setEventsLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.avatar, styles.avatarInitials]}>
                            <Text style={styles.avatarInitialsText}>
                                {(user?.name || 'P')[0].toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.name}>{user?.name || 'Parent'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notifBtn}
                        onPress={() => router.push('/parent/announcements' as any)}
                    >
                        <Text>🔔</Text>
                        {events.length > 0 && <View style={styles.notifDot} />}
                    </TouchableOpacity>
                </View>

                {/* Child Card */}
                <TouchableOpacity style={styles.childCard} onPress={() => router.push('/parent/my-child' as any)}>
                    <View style={[styles.childAvatar, styles.avatarInitials]}>
                        <Text style={styles.avatarInitialsText}>
                            {childName[0].toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.childInfo}>
                        <Text style={styles.childName}>{childName}</Text>
                        {childClass ? <Text style={styles.childClass}>{childClass}</Text> : null}
                        <View style={styles.childStats}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{attendanceRate}% Attendance</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                                <Text style={styles.badgeText}>
                                    {pendingFees > 0 ? `₹${pendingFees.toLocaleString()} Due` : 'Fees Clear ✓'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>

                {/* Quick Links */}
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.quickGrid}>
                    {QUICK_LINKS.map(ql => (
                        <TouchableOpacity key={ql.label} style={styles.quickCard} onPress={() => router.push(ql.route as any)}>
                            <View style={[styles.quickIcon, { backgroundColor: ql.bg }]}>
                                <ql.icon size={22} color={ql.color} />
                            </View>
                            <Text style={styles.quickLabel}>{ql.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Announcements */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Announcements</Text>
                    <TouchableOpacity onPress={() => router.push('/parent/announcements' as any)}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {eventsLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color={BRAND.teal} />
                    </View>
                ) : events.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Info size={20} color="#94a3b8" />
                        <Text style={styles.emptyText}>No announcements yet</Text>
                    </View>
                ) : (
                    events.map(ev => {
                        const tc = TYPE_COLOR[ev.type] ?? TYPE_COLOR.other;
                        const Icon = TYPE_ICON[ev.type] ?? Megaphone;
                        return (
                            <TouchableOpacity
                                key={ev.id}
                                style={styles.activityCard}
                                onPress={() => router.push('/parent/announcements' as any)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: tc.bg }]}>
                                    <Icon size={18} color={tc.color} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle} numberOfLines={1}>{ev.title}</Text>
                                    {ev.description ? (
                                        <Text style={styles.activityDesc} numberOfLines={2}>{ev.description}</Text>
                                    ) : null}
                                    <Text style={styles.activityTime}>{formatEventDate(ev.startDate)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 24, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarInitials: { backgroundColor: BRAND.purpleBg, alignItems: 'center', justifyContent: 'center' },
    avatarInitialsText: { fontSize: 18, fontWeight: '800', color: BRAND.purple },
    greeting: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    name: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    notifBtn: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },

    childCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f97316',
        borderRadius: 20, padding: 18, marginBottom: 28,
        shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
    },
    childAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginRight: 14 },
    childInfo: { flex: 1 },
    childName: { fontSize: 17, fontWeight: '800', color: '#fff' },
    childClass: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginVertical: 4 },
    childStats: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAll: { fontSize: 14, fontWeight: '700', color: BRAND.teal, marginBottom: 16 },

    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 },
    quickCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'flex-start', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    quickLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },

    loadingBox: { alignItems: 'center', paddingVertical: 24 },
    emptyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 20, justifyContent: 'center' },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },

    activityCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
    activityIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    activityDesc: { fontSize: 12, color: '#64748b', lineHeight: 16, marginBottom: 4 },
    activityTime: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
});
