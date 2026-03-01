import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';

interface AttendanceRecord {
    date: string;
    status: string;
    note: string | null;
}
interface Stats {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    present: { label: 'Present', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
    absent: { label: 'Absent', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
    late: { label: 'Late', color: '#d97706', bg: '#fef3c7', icon: Clock },
    excused: { label: 'Excused', color: '#6366f1', bg: '#eef2ff', icon: AlertCircle },
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ParentAttendanceScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isDemo = !user?.studentId || user.studentId === 'demo';

    const fetchAttendance = useCallback(async () => {
        if (isDemo) {
            // Demo fallback data
            const demo: AttendanceRecord[] = [
                { date: new Date().toISOString(), status: 'present', note: null },
                { date: new Date(Date.now() - 86400000).toISOString(), status: 'present', note: null },
                { date: new Date(Date.now() - 172800000).toISOString(), status: 'absent', note: 'Called in sick' },
                { date: new Date(Date.now() - 259200000).toISOString(), status: 'late', note: 'Arrived at 9:30 AM' },
                { date: new Date(Date.now() - 345600000).toISOString(), status: 'present', note: null },
            ];
            setRecords(demo);
            const p = demo.filter(r => r.status === 'present').length;
            const a = demo.filter(r => r.status === 'absent').length;
            const l = demo.filter(r => r.status === 'late').length;
            setStats({ total: demo.length, present: p, absent: a, late: l, excused: 0, rate: Math.round(((p + l) / demo.length) * 100) });
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(ENDPOINTS.parentAttendance(user!.studentId!));
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setRecords(data.records ?? []);
            setStats(data.stats ?? { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
        } catch {
            setError('Could not load attendance. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [user?.studentId, isDemo]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    const childName = user?.childName ?? 'Your Child';
    const childClass = user?.childClass ?? '';
    const pct = stats.rate;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    <Text style={styles.headerSub}>{childName}{childClass ? ` · ${childClass}` : ''}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text style={styles.loadingText}>Loading attendance…</Text>
                </View>
            ) : error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchAttendance}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Summary Ring */}
                    <View style={styles.summaryCard}>
                        <View style={[styles.ringCircle, { borderColor: pct >= 90 ? '#22c55e' : pct >= 75 ? '#f97316' : '#ef4444' }]}>
                            <Text style={styles.ringNum}>{pct}%</Text>
                            <Text style={styles.ringLabel}>Present</Text>
                        </View>
                        <View style={styles.summaryStats}>
                            <View style={styles.statRow}>
                                <CheckCircle2 size={16} color="#16a34a" />
                                <Text style={styles.statText}><Text style={[styles.statBold, { color: '#16a34a' }]}>{stats.present}</Text> Present</Text>
                            </View>
                            <View style={styles.statRow}>
                                <XCircle size={16} color="#dc2626" />
                                <Text style={styles.statText}><Text style={[styles.statBold, { color: '#dc2626' }]}>{stats.absent}</Text> Absent</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Clock size={16} color="#d97706" />
                                <Text style={styles.statText}><Text style={[styles.statBold, { color: '#d97706' }]}>{stats.late}</Text> Late</Text>
                            </View>
                            {stats.excused > 0 && (
                                <View style={styles.statRow}>
                                    <AlertCircle size={16} color="#6366f1" />
                                    <Text style={styles.statText}><Text style={[styles.statBold, { color: '#6366f1' }]}>{stats.excused}</Text> Excused</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {pct < 90 && stats.total > 0 && (
                        <View style={styles.tipCard}>
                            <TrendingUp size={16} color="#d97706" />
                            <Text style={styles.tipText}>Regular attendance between ages 3–6 builds strong social and learning habits. Aim for 90%+.</Text>
                        </View>
                    )}

                    {records.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No attendance records yet.</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Daily Log ({stats.total} days)</Text>
                            {records.map((rec, i) => {
                                const cfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.present;
                                const Icon = cfg.icon;
                                return (
                                    <View key={i} style={styles.row}>
                                        <View style={styles.rowLeft}>
                                            <Text style={styles.rowDate}>{formatDate(rec.date)}</Text>
                                            {rec.note ? <Text style={styles.rowNote}>{rec.note}</Text> : null}
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                            <Icon size={13} color={cfg.color} />
                                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
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
    headerSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    retryText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    content: { padding: 20, paddingBottom: 40 },
    summaryCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
    ringCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 7, alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    ringNum: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
    ringLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
    summaryStats: { flex: 1, gap: 8 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statText: { fontSize: 13, color: '#475569' },
    statBold: { fontWeight: '800' },
    tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, marginBottom: 20 },
    tipText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    rowLeft: { flex: 1 },
    rowDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
    rowNote: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
});
