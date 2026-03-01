import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, CreditCard, Info } from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';

interface FeeItem {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    paidDate: string | null;
    status: string;
    receiptUrl: string | null;
}
interface Summary {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    pendingCount: number;
    totalCount: number;
    paidCount: number;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    paid: { label: 'Paid', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
    pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', icon: Clock },
    overdue: { label: 'Overdue', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
};

function fmt(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}
function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FeesScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [fees, setFees] = useState<FeeItem[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalAmount: 0, paidAmount: 0, pendingAmount: 0,
        pendingCount: 0, totalCount: 0, paidCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isDemo = !user?.studentId || user.studentId === 'demo';

    const fetchFees = useCallback(async () => {
        if (isDemo) {
            const demo: FeeItem[] = [
                { id: '1', description: 'Term 1 Fees', amount: 8500, dueDate: new Date('2025-01-10').toISOString(), paidDate: new Date('2025-01-08').toISOString(), status: 'paid', receiptUrl: null },
                { id: '2', description: 'Term 2 Fees', amount: 8500, dueDate: new Date('2025-04-10').toISOString(), paidDate: null, status: 'pending', receiptUrl: null },
                { id: '3', description: 'Annual Admission', amount: 3000, dueDate: new Date('2025-01-10').toISOString(), paidDate: new Date('2025-01-08').toISOString(), status: 'paid', receiptUrl: null },
            ];
            setFees(demo);
            setSummary({ totalAmount: 20000, paidAmount: 11500, pendingAmount: 8500, pendingCount: 1, totalCount: 3, paidCount: 2 });
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(ENDPOINTS.parentFees(user!.studentId!));
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setFees(data.fees ?? []);
            setSummary(data.summary ?? {
                totalAmount: 0, paidAmount: 0, pendingAmount: 0,
                pendingCount: 0, totalCount: 0, paidCount: 0,
            });
        } catch {
            setError('Could not load fee details. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [user?.studentId, isDemo]);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const childName = user?.childName ?? 'Your Child';
    const childClass = user?.childClass ?? '';

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Fee Payments</Text>
                    <Text style={styles.headerSub}>{childName}{childClass ? ` · ${childClass}` : ''}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={styles.loadingText}>Loading fees…</Text>
                </View>
            ) : error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchFees}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Summary Banner */}
                    <View style={styles.banner}>
                        <View>
                            <Text style={styles.bannerLabel}>Total Fees</Text>
                            <Text style={styles.bannerAmount}>{fmt(summary.totalAmount)}</Text>
                            <Text style={styles.bannerSub}>{summary.totalCount} fee items</Text>
                        </View>
                        <View style={styles.bannerRight}>
                            <Text style={styles.paidText}>{summary.paidCount} of {summary.totalCount} paid</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, {
                                    width: summary.totalCount > 0
                                        ? `${(summary.paidCount / summary.totalCount) * 100}%` as any
                                        : '0%',
                                }]} />
                            </View>
                            {summary.pendingCount > 0 && (
                                <View style={styles.pendingTag}>
                                    <AlertCircle size={12} color="#dc2626" />
                                    <Text style={styles.pendingText}>{fmt(summary.pendingAmount)} pending</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Info size={14} color="#0ea5e9" />
                        <Text style={styles.infoText}>For receipts or payment queries, contact the school office at admin@aurralis.com</Text>
                    </View>

                    {fees.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No fee records found.</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
                            {fees.map(fee => {
                                const cfg = STATUS_CFG[fee.status] ?? STATUS_CFG.pending;
                                const Icon = cfg.icon;
                                return (
                                    <View key={fee.id} style={styles.feeCard}>
                                        <View style={[styles.feeIcon, { backgroundColor: cfg.bg }]}>
                                            <Icon size={20} color={cfg.color} />
                                        </View>
                                        <View style={styles.feeInfo}>
                                            <Text style={styles.feeTerm}>{fee.description}</Text>
                                            <Text style={styles.feeDue}>
                                                {fee.status === 'paid' && fee.paidDate
                                                    ? `Paid: ${fmtDate(fee.paidDate)}`
                                                    : `Due: ${fmtDate(fee.dueDate)}`}
                                            </Text>
                                        </View>
                                        <View style={styles.feeRight}>
                                            <Text style={styles.feeAmount}>{fmt(fee.amount)}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                    )}

                    {summary.pendingCount > 0 && (
                        <TouchableOpacity style={styles.payBtn}>
                            <CreditCard size={20} color="#0f172a" />
                            <Text style={styles.payText}>Contact School to Pay</Text>
                        </TouchableOpacity>
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
    banner: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
    bannerAmount: { fontSize: 28, fontWeight: '800', color: '#20e1d0', marginVertical: 4 },
    bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    bannerRight: { alignItems: 'flex-end', flex: 1, marginLeft: 16 },
    paidText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
    progressBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#20e1d0', borderRadius: 3 },
    pendingTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    pendingText: { fontSize: 10, color: '#dc2626', fontWeight: '700' },
    infoCard: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 12, color: '#0369a1', lineHeight: 18 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    feeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
    feeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    feeInfo: { flex: 1 },
    feeTerm: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    feeDue: { fontSize: 11, color: '#94a3b8' },
    feeRight: { alignItems: 'flex-end', gap: 4 },
    feeAmount: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '700' },
    payBtn: { backgroundColor: '#20e1d0', padding: 16, borderRadius: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    payText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
});
