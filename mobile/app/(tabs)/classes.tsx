import React from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Users, ChevronRight, Clock, MapPin, Star } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

// ── Teacher view data ───────────────────────────────────────────────────────
const TEACHER_CLASSES = [
    { id: 'c1', name: 'Playgroup A', subject: 'Ages 2–3', students: 12, room: 'Room 1', color: '#f97316', bg: '#fff7ed', time: '09:00 AM' },
    { id: 'c2', name: 'Nursery A', subject: 'Ages 3–4', students: 15, room: 'Room 2', color: '#3b82f6', bg: '#eff6ff', time: '09:00 AM' },
    { id: 'c3', name: 'Nursery B', subject: 'Ages 3–4', students: 14, room: 'Room 3', color: '#8b5cf6', bg: '#f5f3ff', time: '09:30 AM' },
    { id: 'c4', name: 'KG 1', subject: 'Ages 4–5', students: 18, room: 'Room 4', color: '#10b981', bg: '#ecfdf5', time: '09:00 AM' },
    { id: 'c5', name: 'KG 2', subject: 'Ages 5–6', students: 20, room: 'Room 5', color: '#ec4899', bg: '#fdf2f8', time: '09:00 AM' },
];

// ── Parent view data (child's daily timetable) ─────────────────────────────
const CHILD_SCHEDULE = [
    { time: '9:00 AM', label: 'Circle Time & Morning Song', room: 'Room 2', color: '#f97316', bg: '#fff7ed' },
    { time: '9:30 AM', label: 'Morning Snack', room: 'Canteen', color: '#10b981', bg: '#ecfdf5' },
    { time: '10:00 AM', label: 'Art & Craft', room: 'Room 2', color: '#ec4899', bg: '#fdf2f8' },
    { time: '10:45 AM', label: 'Story Time & Language', room: 'Room 2', color: '#3b82f6', bg: '#eff6ff' },
    { time: '11:15 AM', label: 'Outdoor Play & Motor Skills', room: 'Garden', color: '#22c55e', bg: '#dcfce7' },
    { time: '11:45 AM', label: 'Music, Rhymes & Movement', room: 'Room 2', color: '#8b5cf6', bg: '#f5f3ff' },
    { time: '12:00 PM', label: 'Pack-up & Dismissal', room: 'Main Gate', color: '#64748b', bg: '#f1f5f9' },
];

function TeacherClassesView() {
    const router = useRouter();
    return (
        <>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Classes</Text>
                <Text style={styles.headerSub}>{TEACHER_CLASSES.length} sections assigned</Text>
            </View>
            <ScrollView contentContainerStyle={styles.list}>
                {TEACHER_CLASSES.map(cls => (
                    <TouchableOpacity
                        key={cls.id}
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/teacher/class-detail', params: { id: cls.id, name: cls.name, subject: cls.subject } })}>
                        <View style={[styles.iconBox, { backgroundColor: cls.bg }]}>
                            <BookOpen size={22} color={cls.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{cls.name}</Text>
                            <Text style={styles.cardClass}>{cls.subject} · {cls.room}</Text>
                            <View style={styles.metaRow}>
                                <Users size={12} color="#94a3b8" />
                                <Text style={styles.metaText}>{cls.students} children</Text>
                                <Text style={styles.dot}>·</Text>
                                <Text style={styles.metaText}>{cls.time}</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </>
    );
}

function ParentClassView() {
    const router = useRouter();
    return (
        <>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Aarav's Schedule</Text>
                <Text style={styles.headerSub}>Nursery A · Morning Session (9 AM – 12 PM)</Text>
            </View>

            {/* Class Info Card */}
            <View style={styles.classInfoCard}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=t1' }} style={styles.teacherAvatar} />
                <View style={styles.classInfoText}>
                    <Text style={styles.classInfoTitle}>Nursery A</Text>
                    <Text style={styles.classInfoSub}>Class Teacher: Mrs. Smith</Text>
                    <Text style={styles.classInfoSub}>Room 2 · 15 children</Text>
                </View>
                <View style={[styles.ageBadge]}>
                    <Text style={styles.ageText}>Ages 3–4</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                <Text style={styles.scheduleTitle}>Daily Timetable</Text>
                {CHILD_SCHEDULE.map((slot, i) => (
                    <View key={i} style={styles.scheduleCard}>
                        <View style={[styles.timePill, { backgroundColor: slot.bg }]}>
                            <Clock size={12} color={slot.color} />
                            <Text style={[styles.timeText, { color: slot.color }]}>{slot.time}</Text>
                        </View>
                        <View style={styles.scheduleInfo}>
                            <Text style={styles.slotLabel}>{slot.label}</Text>
                            <View style={styles.roomRow}>
                                <MapPin size={11} color="#94a3b8" />
                                <Text style={styles.roomText}>{slot.room}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </>
    );
}

export default function ClassesScreen() {
    const { user } = useAuth();
    return (
        <SafeAreaView style={styles.safe}>
            {user?.role === 'parent' ? <ParentClassView /> : <TeacherClassesView />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
    list: { padding: 20, paddingBottom: 40 },
    // Teacher list
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
    iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    cardClass: { fontSize: 13, color: '#64748b', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#94a3b8' },
    dot: { color: '#cbd5e1', fontSize: 12 },
    // Parent class card
    classInfoCard: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    teacherAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    classInfoText: { flex: 1 },
    classInfoTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
    classInfoSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
    ageBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    ageText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
    scheduleTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
    scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 14 },
    timeText: { fontSize: 11, fontWeight: '800' },
    scheduleInfo: { flex: 1 },
    slotLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    roomRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    roomText: { fontSize: 11, color: '#94a3b8' },
});
