import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    Image, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/constants/api';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface Student {
    id: string;
    name: string;
    enrollmentId: string;
    avatar: string | null;
}

export default function AttendanceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const classId = user?.classId;
    const className = user?.className ?? 'My Class';
    const today = new Date().toISOString().split('T')[0];

    const loadData = useCallback(async () => {
        if (!classId) { setError('No class assigned'); setLoading(false); return; }
        setLoading(true); setError(null);
        try {
            // Fetch students in the class
            const classRes = await fetch(ENDPOINTS.teacherClasses(user?.userId ?? ''));
            const classData = await classRes.json();
            const myClass = classData.classes?.find((c: { id: string }) => c.id === classId);
            const studentList: Student[] = myClass?.students ?? [];

            // Fetch today's existing attendance
            const attRes = await fetch(ENDPOINTS.teacherAttendanceGet(classId));
            const attData = await attRes.json();
            const existingMap: Record<string, AttendanceStatus> = {};
            for (const rec of attData.records ?? []) {
                existingMap[rec.studentId] = rec.status as AttendanceStatus;
            }

            setStudents(studentList);
            // Default unrecorded students to PRESENT
            const defaultAtt: Record<string, AttendanceStatus> = {};
            for (const s of studentList) {
                defaultAtt[s.id] = existingMap[s.id] ?? 'PRESENT';
            }
            setAttendance(defaultAtt);
        } catch {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    }, [classId, user?.userId]);

    useEffect(() => { loadData(); }, [loadData]);

    const setStatus = (id: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [id]: status }));
        setSaved(false);
    };

    const submitAttendance = async () => {
        if (!classId) return;
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId, status,
            }));
            const res = await fetch(ENDPOINTS.teacherAttendance, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId, date: today, records }),
            });
            if (!res.ok) throw new Error();
            setSaved(true);
            Alert.alert('✓ Attendance Saved', `Recorded for ${records.length} students.`);
        } catch {
            Alert.alert('Error', 'Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const present = Object.values(attendance).filter(s => s === 'PRESENT').length;
    const absent = Object.values(attendance).filter(s => s === 'ABSENT').length;
    const late = Object.values(attendance).filter(s => s === 'LATE').length;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    <Text style={styles.headerSub}>{className} · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <TouchableOpacity onPress={loadData} style={styles.backBtn}>
                    <RefreshCw size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#20e1d0" />
                    <Text style={styles.loadingText}>Loading students...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.statsBar}>
                        <View style={[styles.stat, { backgroundColor: '#dcfce7' }]}>
                            <Text style={[styles.statNum, { color: '#16a34a' }]}>{present}</Text>
                            <Text style={[styles.statLabel, { color: '#16a34a' }]}>Present</Text>
                        </View>
                        <View style={[styles.stat, { backgroundColor: '#fee2e2' }]}>
                            <Text style={[styles.statNum, { color: '#dc2626' }]}>{absent}</Text>
                            <Text style={[styles.statLabel, { color: '#dc2626' }]}>Absent</Text>
                        </View>
                        <View style={[styles.stat, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.statNum, { color: '#d97706' }]}>{late}</Text>
                            <Text style={[styles.statLabel, { color: '#d97706' }]}>Late</Text>
                        </View>
                        <View style={[styles.stat, { backgroundColor: '#f1f5f9' }]}>
                            <Text style={[styles.statNum, { color: '#475569' }]}>{students.length}</Text>
                            <Text style={[styles.statLabel, { color: '#475569' }]}>Total</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.list} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                        {students.length === 0 && (
                            <Text style={styles.emptyText}>No students found in this class.</Text>
                        )}
                        {students.map(student => (
                            <View key={student.id} style={styles.studentCard}>
                                {student.avatar
                                    ? <Image source={{ uri: student.avatar }} style={styles.avatar} />
                                    : <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarInitial}>{student.name[0]?.toUpperCase()}</Text>
                                    </View>
                                }
                                <Text style={styles.studentName}>{student.name}</Text>
                                <View style={styles.statusBtns}>
                                    <TouchableOpacity
                                        style={[styles.statusBtn, attendance[student.id] === 'PRESENT' && styles.btnPresent]}
                                        onPress={() => setStatus(student.id, 'PRESENT')}>
                                        <CheckCircle2 size={18} color={attendance[student.id] === 'PRESENT' ? '#16a34a' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.statusBtn, attendance[student.id] === 'LATE' && styles.btnLate]}
                                        onPress={() => setStatus(student.id, 'LATE')}>
                                        <Clock size={18} color={attendance[student.id] === 'LATE' ? '#d97706' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.statusBtn, attendance[student.id] === 'ABSENT' && styles.btnAbsent]}
                                        onPress={() => setStatus(student.id, 'ABSENT')}>
                                        <XCircle size={18} color={attendance[student.id] === 'ABSENT' ? '#dc2626' : '#94a3b8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.submitBtn, saved && styles.submittedBtn, saving && { opacity: 0.7 }]}
                            onPress={submitAttendance}
                            disabled={saving || students.length === 0}>
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.submitText}>{saved ? '✓ Attendance Saved' : 'Submit Attendance'}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    headerSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
    statsBar: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    stat: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    list: { flex: 1 },
    studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    avatarFallback: { backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '800', color: '#0ea5e9' },
    studentName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
    statusBtns: { flexDirection: 'row', gap: 8 },
    statusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
    btnPresent: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    btnLate: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    btnAbsent: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    submitBtn: { backgroundColor: '#20e1d0', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    submittedBtn: { backgroundColor: '#16a34a' },
    submitText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#20e1d0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryText: { fontWeight: '700', color: '#0f172a' },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 40 },
});
