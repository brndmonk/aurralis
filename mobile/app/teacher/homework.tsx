import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    TextInput, Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Smile, Clock, ChevronRight } from 'lucide-react-native';

const ACTIVITIES = [
    { id: '1', title: 'Colour the Butterfly', class: 'Nursery A', area: 'Art & Craft', due: 'Tomorrow', urgent: false },
    { id: '2', title: 'Practice Rhyme: "Twinkle Twinkle"', class: 'KG 1', area: 'Language', due: 'Today', urgent: true },
    { id: '3', title: 'Shape Sorting Worksheet', class: 'KG 2', area: 'Maths Readiness', due: 'Mar 3', urgent: false },
    { id: '4', title: 'Draw My Family', class: 'Playgroup A', area: 'Creative', due: 'Mar 4', urgent: false },
];

export default function HomeworkScreen() {
    const router = useRouter();
    const [activities, setActivities] = useState(ACTIVITIES);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [area, setArea] = useState('');
    const [due, setDue] = useState('');

    const addActivity = () => {
        if (!title || !area) { Alert.alert('Error', 'Fill in required fields'); return; }
        setActivities(prev => [
            { id: Date.now().toString(), title, class: 'Nursery A', area, due: due || 'TBD', urgent: false },
            ...prev,
        ]);
        setTitle(''); setArea(''); setDue('');
        setShowModal(false);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activities</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                    <Plus size={20} color="#0f172a" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {activities.map(act => (
                    <TouchableOpacity key={act.id} style={styles.card}>
                        <View style={[styles.subjectBadge, act.urgent && { backgroundColor: '#fee2e2' }]}>
                            <Smile size={16} color={act.urgent ? '#dc2626' : '#f97316'} />
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.cardRow}>
                                <Text style={styles.cardTitle}>{act.title}</Text>
                                {act.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>Today</Text></View>}
                            </View>
                            <Text style={styles.cardClass}>{act.class} · {act.area}</Text>
                            <View style={styles.dueRow}>
                                <Clock size={12} color="#94a3b8" />
                                <Text style={styles.dueText}>Due: {act.due}</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Add Activity</Text>
                        <Text style={styles.inputLabel}>Activity Title *</Text>
                        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Colour the Sun" placeholderTextColor="#94a3b8" />
                        <Text style={styles.inputLabel}>Learning Area *</Text>
                        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. Art & Craft, Language" placeholderTextColor="#94a3b8" />
                        <Text style={styles.inputLabel}>Due Date</Text>
                        <TextInput style={styles.input} value={due} onChangeText={setDue} placeholder="e.g. Tomorrow / Mar 5" placeholderTextColor="#94a3b8" />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={addActivity}>
                                <Text style={styles.saveText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#20e1d0', alignItems: 'center', justifyContent: 'center' },
    list: { padding: 20, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
    subjectBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    cardContent: { flex: 1 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 },
    urgentBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    urgentText: { fontSize: 10, color: '#dc2626', fontWeight: '700' },
    cardClass: { fontSize: 12, color: '#64748b', marginBottom: 6 },
    dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dueText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, color: '#0f172a' },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
    cancelText: { fontWeight: '700', color: '#475569' },
    saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#20e1d0', alignItems: 'center' },
    saveText: { fontWeight: '700', color: '#0f172a' },
});
