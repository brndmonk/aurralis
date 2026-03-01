import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    Image, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ClipboardCheck, Smile, MessageSquare, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/constants/api';

interface Student {
    id: string;
    name: string;
    enrollmentId: string;
    avatar: string | null;
    attendanceRate: number;
}

interface ClassData {
    id: string;
    displayName: string;
    studentCount: number;
    avgAttendance: number;
    students: Student[];
}

export default function ClassDetailScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { name, subject } = useLocalSearchParams<{ id: string; name: string; subject: string }>();

    const [cls, setCls] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const classId = user?.classId;

    const loadClass = useCallback(async () => {
        if (!user?.userId) { setError('Not authenticated'); setLoading(false); return; }
        setLoading(true); setError(null);
        try {
            const res = await fetch(ENDPOINTS.teacherClasses(user.userId));
            const data = await res.json();
            const classes: ClassData[] = data.classes ?? [];
            // Find by name or use first
            const found = classes.find(c => c.displayName === (name ?? user.className)) ?? classes[0] ?? null;
            setCls(found);
        } catch {
            setError('Failed to load class data');
        } finally {
            setLoading(false);
        }
    }, [user?.userId, name, user?.className]);

    useEffect(() => { loadClass(); }, [loadClass]);

    const quickActions = [
        { label: 'Take Attendance', icon: ClipboardCheck, color: '#22c55e', bg: '#f0fdf4', route: '/teacher/attendance' },
        { label: 'Add Activity', icon: Smile, color: '#f97316', bg: '#fff7ed', route: '/teacher/homework' },
        { label: 'Post Update', icon: MessageSquare, color: '#0ea5e9', bg: '#f0f9ff', route: '/teacher/post-update' },
    ];

    const displayName = cls?.displayName ?? (name ?? user?.className ?? 'My Class');
    const avgAttendance = cls?.avgAttendance ?? 0;
    const studentCount = cls?.studentCount ?? 0;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{displayName}</Text>
                    <Text style={styles.headerSub}>{subject || 'Montessori Class'}</Text>
                </View>
                <TouchableOpacity onPress={loadClass} style={styles.backBtn}>
                    <RefreshCw size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text style={styles.loadingText}>Loading class...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadClass} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Stats */}
                    <View style={styles.statsRow}>
                        {[
                            { label: 'Children', value: String(studentCount), color: '#3b82f6' },
                            { label: 'Avg Attendance', value: `${avgAttendance}%`, color: '#10b981' },
                            { label: 'Capacity', value: String(cls?.studentCount ?? '–'), color: '#f97316' },
                        ].map(s => (
                            <View key={s.label} style={styles.statCard}>
                                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Quick Actions */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        {quickActions.map(a => (
                            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
                                <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                                    <a.icon size={20} color={a.color} />
                                </View>
                                <Text style={styles.actionLabel}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Student List */}
                    <Text style={styles.sectionTitle}>Students ({studentCount})</Text>
                    {(cls?.students ?? []).length === 0 && (
                        <Text style={styles.emptyText}>No students enrolled yet.</Text>
                    )}
                    {(cls?.students ?? []).map(student => {
                        const rate = student.attendanceRate;
                        const status = rate >= 90 ? 'Excellent' : rate >= 75 ? 'Good' : 'Needs Attention';
                        return (
                            <View key={student.id} style={styles.studentCard}>
                                {student.avatar
                                    ? <Image source={{ uri: student.avatar }} style={styles.avatar} />
                                    : <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarInitial}>{student.name[0]?.toUpperCase()}</Text>
                                    </View>
                                }
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentSub}>#{student.enrollmentId} · Attendance: {rate}%</Text>
                                </View>
                                <View style={[styles.statusPill,
                                status === 'Excellent' ? styles.excellent :
                                    status === 'Good' ? styles.good : styles.attention
                                ]}>
                                    <Text style={styles.statusText}>{status}</Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#f97316' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    content: { padding: 20, paddingBottom: 40 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
    studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12 },
    avatarFallback: { backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '800', color: '#0ea5e9' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    studentSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    excellent: { backgroundColor: '#dcfce7' },
    good: { backgroundColor: '#e0f2fe' },
    attention: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 10, fontWeight: '700', color: '#475569' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#f97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryText: { fontWeight: '700', color: '#fff' },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 20 },
});
