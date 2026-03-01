import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Image, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Phone, Mail, Baby, ClipboardCheck, Star } from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';

interface ProfileData {
    childName: string;
    childClass: string;
    childGender: string | null;
    childDob: string | null;
    childEnrollmentId: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string | null;
    teacherName: string | null;
    teacherPhone: string | null;
    teacherEmail: string | null;
    attendanceRate: number;
    pendingFees: number;
    paidFees: number;
}

function calcAge(dobIso: string | null | undefined): string {
    if (!dobIso) return '';
    const dob = new Date(dobIso);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    return months > 0 ? `${years} yr ${months} mo` : `${years} year${years !== 1 ? 's' : ''}`;
}

const MILESTONES = [
    { area: '🎨 Art & Creativity', level: 85, label: 'Very Good' },
    { area: '📖 Language & Literacy', level: 70, label: 'Good' },
    { area: '🔢 Maths Readiness', level: 78, label: 'Good' },
    { area: '🤸 Physical Development', level: 90, label: 'Excellent' },
    { area: '🤝 Social & Emotional', level: 80, label: 'Very Good' },
];
const levelColor = (l: number) => l >= 85 ? '#22c55e' : l >= 70 ? '#3b82f6' : '#f97316';

export default function MyChildScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const isDemo = !user?.studentId || user.studentId === 'demo';

    const fetchProfile = useCallback(async () => {
        if (isDemo) { setLoading(false); return; }
        try {
            const res = await fetch(ENDPOINTS.parentProfile(user!.studentId!));
            if (res.ok) setProfile(await res.json());
        } catch { /* use session fallback */ }
        finally { setLoading(false); }
    }, [user?.studentId, isDemo]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Prefer fresh API data, fall back to session
    const childName     = profile?.childName     ?? user?.childName      ?? 'Your Child';
    const childClass    = profile?.childClass    ?? user?.childClass     ?? '';
    const childGender   = profile?.childGender   ?? user?.childGender   ?? null;
    const childDob      = profile?.childDob      ?? user?.childDob      ?? null;
    const childAge      = calcAge(childDob);
    const enrollmentId  = profile?.childEnrollmentId ?? user?.childEnrollmentId ?? '';
    const attendanceRate = profile?.attendanceRate  ?? user?.attendanceRate  ?? 0;
    const teacherName   = profile?.teacherName   ?? user?.teacherName   ?? null;
    const teacherPhone  = profile?.teacherPhone  ?? user?.teacherPhone  ?? null;
    const teacherEmail  = profile?.teacherEmail  ?? user?.teacherEmail  ?? null;

    const callTeacher = () => {
        if (!teacherPhone) { Alert.alert('Not available', 'Teacher phone number not on file.'); return; }
        Linking.openURL(`tel:${teacherPhone}`);
    };
    const emailTeacher = () => {
        if (!teacherEmail) { Alert.alert('Not available', 'Teacher email not on file.'); return; }
        Linking.openURL(`mailto:${teacherEmail}`);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Child</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <Image
                            source={{ uri: `https://i.pravatar.cc/150?u=${enrollmentId || 'child'}` }}
                            style={styles.avatar}
                        />
                        <Text style={styles.childName}>{childName}</Text>
                        <Text style={styles.childMeta}>
                            {childClass}
                            {childAge ? ` · ${childAge}` : ''}
                            {childGender ? ` · ${childGender.charAt(0) + childGender.slice(1).toLowerCase()}` : ''}
                        </Text>
                        {enrollmentId ? (
                            <Text style={styles.enrollmentId}>ID: {enrollmentId}</Text>
                        ) : null}
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
                                <ClipboardCheck size={16} color="#16a34a" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#16a34a' }]}>{attendanceRate}%</Text>
                                <Text style={[styles.statLabel, { color: '#16a34a' }]}>Attendance</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
                                <Baby size={16} color="#3b82f6" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                                    {attendanceRate >= 90 ? 'On Track' : attendanceRate >= 75 ? 'Good' : 'Needs Attn'}
                                </Text>
                                <Text style={[styles.statLabel, { color: '#3b82f6' }]}>Development</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}>
                                <Star size={16} color="#f97316" style={{ marginBottom: 4 }} />
                                <Text style={[styles.statValue, { color: '#f97316' }]}>
                                    {childClass || 'Active'}
                                </Text>
                                <Text style={[styles.statLabel, { color: '#f97316' }]}>Class</Text>
                            </View>
                        </View>
                    </View>

                    {/* Developmental Milestones */}
                    <Text style={styles.sectionTitle}>Developmental Milestones</Text>
                    <View style={styles.demoNote}>
                        <Text style={styles.demoNoteText}>📋 Based on latest progress report</Text>
                    </View>
                    {MILESTONES.map(m => (
                        <View key={m.area} style={styles.milestoneCard}>
                            <View style={styles.milestoneTop}>
                                <Text style={styles.milestoneArea}>{m.area}</Text>
                                <Text style={[styles.milestoneLabel, { color: levelColor(m.level) }]}>{m.label}</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${m.level}%` as any, backgroundColor: levelColor(m.level) }]} />
                            </View>
                        </View>
                    ))}

                    {/* Class Teacher */}
                    {teacherName ? (
                        <>
                            <Text style={styles.sectionTitle}>Class Teacher</Text>
                            <View style={styles.teacherCard}>
                                <Image
                                    source={{ uri: `https://i.pravatar.cc/150?u=${teacherEmail || 'teacher'}` }}
                                    style={styles.teacherAvatar}
                                />
                                <View style={styles.teacherInfo}>
                                    <Text style={styles.teacherName}>{teacherName}</Text>
                                    <Text style={styles.teacherClass}>
                                        Class Teacher{childClass ? ` · ${childClass}` : ''}
                                    </Text>
                                    {teacherPhone && (
                                        <Text style={styles.teacherContact}>{teacherPhone}</Text>
                                    )}
                                </View>
                                <View style={styles.teacherActions}>
                                    <TouchableOpacity
                                        style={[styles.contactBtn, { backgroundColor: teacherPhone ? '#dcfce7' : '#f1f5f9' }]}
                                        onPress={callTeacher}>
                                        <Phone size={16} color={teacherPhone ? '#16a34a' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.contactBtn, { backgroundColor: teacherEmail ? '#dbeafe' : '#f1f5f9' }]}
                                        onPress={emailTeacher}>
                                        <Mail size={16} color={teacherEmail ? '#2563eb' : '#94a3b8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    ) : null}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#3b82f6' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 20, paddingBottom: 40 },
    profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
    childName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    childMeta: { fontSize: 13, color: '#64748b', marginBottom: 4, textAlign: 'center' },
    enrollmentId: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
    statValue: { fontSize: 12, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
    statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
    demoNote: { backgroundColor: '#f0f9ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
    demoNoteText: { fontSize: 12, color: '#0369a1', fontWeight: '500' },
    milestoneCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    milestoneArea: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    milestoneLabel: { fontSize: 12, fontWeight: '700' },
    progressBar: { height: 7, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    teacherCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 4, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    teacherAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    teacherInfo: { flex: 1 },
    teacherName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    teacherClass: { fontSize: 12, color: '#64748b', marginTop: 2 },
    teacherContact: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    teacherActions: { flexDirection: 'row', gap: 8 },
    contactBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
