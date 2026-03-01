import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Smile, CheckSquare, Square, Clock, Lightbulb } from 'lucide-react-native';

const ACTIVITIES = [
    { id: '1', area: '🎨 Art & Craft', title: 'Colour the Butterfly worksheet', due: 'Tomorrow', done: false, desc: 'Use crayons or colour pencils. Let your child choose the colours!' },
    { id: '2', area: '📖 Language', title: 'Practice Rhyme: "Twinkle Twinkle"', due: 'Today', done: true, desc: 'Sing along 3 times with your child today.' },
    { id: '3', area: '🔢 Maths Readiness', title: 'Count objects around the house', due: 'Mar 3', done: false, desc: 'Count 1–10 with everyday objects: spoons, pillows, toys.' },
    { id: '4', area: '🤝 Social & Emotional', title: 'My Feelings Chart', due: 'Mar 5', done: true, desc: 'Ask your child to point to how they feel each morning for 3 days.' },
];

export default function ParentActivitiesScreen() {
    const router = useRouter();
    const done = ACTIVITIES.filter(a => a.done).length;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Take-Home Activities</Text>
                    <Text style={styles.headerSub}>Aarav · Nursery A</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressTop}>
                        <Text style={styles.progressLabel}>Completed this week</Text>
                        <Text style={styles.progressFrac}>{done} / {ACTIVITIES.length}</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(done / ACTIVITIES.length) * 100}%` as any }]} />
                    </View>
                </View>

                {/* Tip Banner */}
                <View style={styles.tipBanner}>
                    <Lightbulb size={18} color="#d97706" />
                    <Text style={styles.tipText}>10–15 minutes of activity time each day makes a big difference in early development.</Text>
                </View>

                <Text style={styles.sectionTitle}>All Activities</Text>
                {ACTIVITIES.map(act => (
                    <View key={act.id} style={[styles.card, act.done && styles.cardDone]}>
                        <View style={styles.cardTop}>
                            <View style={[styles.areaChip, act.done && { opacity: 0.5 }]}>
                                <Text style={styles.areaText}>{act.area}</Text>
                            </View>
                            <View style={styles.dueRow}>
                                <Clock size={11} color="#94a3b8" />
                                <Text style={styles.dueText}>Due: {act.due}</Text>
                            </View>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.cardLeft}>
                                <Text style={[styles.cardTitle, act.done && styles.textDone]}>{act.title}</Text>
                                <Text style={styles.cardDesc}>{act.desc}</Text>
                            </View>
                            {act.done
                                ? <CheckSquare size={24} color="#22c55e" />
                                : <Square size={24} color="#cbd5e1" />}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    headerSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
    content: { padding: 20, paddingBottom: 40 },
    progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
    progressLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    progressFrac: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
    progressBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
    tipBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, marginBottom: 20 },
    tipText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
    cardDone: { opacity: 0.65 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    areaChip: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    areaText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dueText: { fontSize: 12, color: '#94a3b8' },
    cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardLeft: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    textDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
    cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
});
