import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Star, TrendingUp, Download } from 'lucide-react-native';

const REPORTS = [
    {
        id: '1', term: 'Term 1 – 2025', published: 'Feb 20', rating: 'Excellent Progress',
        areas: [
            { name: '🎨 Art & Creativity', score: 90, label: 'Excellent' },
            { name: '📖 Language & Literacy', score: 72, label: 'Good' },
            { name: '🔢 Maths Readiness', score: 78, label: 'Good' },
            { name: '🤸 Physical Development', score: 92, label: 'Excellent' },
            { name: '🤝 Social & Emotional', score: 85, label: 'Very Good' },
        ]
    },
    {
        id: '2', term: 'Term 2 – 2024', published: 'Oct 10', rating: 'Good Progress',
        areas: [
            { name: '🎨 Art & Creativity', score: 82, label: 'Very Good' },
            { name: '📖 Language & Literacy', score: 65, label: 'Progressing' },
            { name: '🔢 Maths Readiness', score: 70, label: 'Good' },
            { name: '🤸 Physical Development', score: 88, label: 'Excellent' },
            { name: '🤝 Social & Emotional', score: 75, label: 'Good' },
        ]
    },
];

const levelColor = (score: number) =>
    score >= 85 ? '#16a34a' : score >= 70 ? '#3b82f6' : '#f97316';

export default function ReportCardsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [selected, setSelected] = React.useState(REPORTS[0].id);

    const childName = user?.childName ?? 'Your Child';
    const childClass = user?.childClass ?? '';
    const report = REPORTS.find(r => r.id === selected)!;
    const avg = Math.round(report.areas.reduce((a, s) => a + s.score, 0) / report.areas.length);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Progress Report</Text>
                    {childName ? (
                        <Text style={styles.headerSub}>
                            {childName}{childClass ? ` · ${childClass}` : ''}
                        </Text>
                    ) : null}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Term Switcher */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.termRow} style={styles.termScrollView}>
                {REPORTS.map(r => (
                    <TouchableOpacity key={r.id}
                        style={[styles.termChip, selected === r.id && styles.termChipActive]}
                        onPress={() => setSelected(r.id)}>
                        <Text style={[styles.termChipText, selected === r.id && styles.termChipTextActive]}>{r.term}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Overview */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewItem}>
                        <Star size={22} color="#f59e0b" />
                        <Text style={styles.overviewValue}>{report.rating}</Text>
                        <Text style={styles.overviewLabel}>Overall</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.overviewItem}>
                        <TrendingUp size={22} color="#22c55e" />
                        <Text style={styles.overviewValue}>{avg}%</Text>
                        <Text style={styles.overviewLabel}>Avg Score</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.overviewItem}>
                        <Text style={styles.overviewValue}>{report.areas.length}</Text>
                        <Text style={styles.overviewLabel}>Areas</Text>
                    </View>
                </View>

                {/* Developmental Areas */}
                <Text style={styles.sectionTitle}>Developmental Areas</Text>
                {report.areas.map(area => (
                    <View key={area.name} style={styles.areaCard}>
                        <View style={styles.areaTop}>
                            <Text style={styles.areaName}>{area.name}</Text>
                            <Text style={[styles.areaLabel, { color: levelColor(area.score) }]}>{area.label}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${area.score}%` as any, backgroundColor: levelColor(area.score) }]} />
                        </View>
                        <Text style={styles.scoreText}>{area.score} / 100</Text>
                    </View>
                ))}

                <TouchableOpacity style={styles.downloadBtn}>
                    <Download size={18} color="#0f172a" />
                    <Text style={styles.downloadText}>Download Progress Report PDF</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
    termScrollView: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    termRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
    termChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
    termChipActive: { backgroundColor: '#20e1d0' },
    termChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    termChipTextActive: { color: '#0f172a' },
    content: { padding: 20, paddingBottom: 40 },
    overviewCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 24, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, alignItems: 'center', justifyContent: 'space-around' },
    overviewItem: { alignItems: 'center', gap: 4, flex: 1 },
    overviewValue: { fontSize: 14, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    overviewLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    divider: { width: 1, height: 40, backgroundColor: '#f1f5f9' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    areaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    areaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    areaName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    areaLabel: { fontSize: 12, fontWeight: '700' },
    progressBar: { height: 7, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 4 },
    scoreText: { fontSize: 11, color: '#94a3b8', fontWeight: '500', textAlign: 'right' },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginTop: 8 },
    downloadText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
});
