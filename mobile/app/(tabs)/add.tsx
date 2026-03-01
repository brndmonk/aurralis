import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { PenSquare, BookPlus, ClipboardCheck, Calendar, DollarSign, Bell } from 'lucide-react-native';

export default function AddScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const teacherActions = [
        { label: 'Post Update', icon: PenSquare, color: '#3b82f6', bg: '#eff6ff', route: '/teacher/post-update' },
        { label: 'Add Homework', icon: BookPlus, color: '#8b5cf6', bg: '#f5f3ff', route: '/teacher/homework' },
        { label: 'Take Attendance', icon: ClipboardCheck, color: '#22c55e', bg: '#f0fdf4', route: '/teacher/attendance' },
        { label: 'Add Event', icon: Calendar, color: '#f97316', bg: '#fff7ed', route: '/teacher/events' },
    ];

    const parentActions = [
        { label: 'Pay Fees', icon: DollarSign, color: '#f97316', bg: '#fff7ed', route: '/parent/fees' },
        { label: 'Send Message', icon: PenSquare, color: '#3b82f6', bg: '#eff6ff', route: '/chat' },
        { label: 'View Announcements', icon: Bell, color: '#8b5cf6', bg: '#f5f3ff', route: '/parent/announcements' },
        { label: 'View Report Card', icon: ClipboardCheck, color: '#22c55e', bg: '#f0fdf4', route: '/parent/report-cards' },
    ];

    const actions = user?.role === 'parent' ? parentActions : teacherActions;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quick Actions</Text>
                <Text style={styles.headerSub}>What would you like to do?</Text>
            </View>

            <View style={styles.grid}>
                {actions.map(a => (
                    <TouchableOpacity key={a.label} style={styles.card} onPress={() => router.push(a.route as any)}>
                        <View style={[styles.iconBox, { backgroundColor: a.bg }]}>
                            <a.icon size={28} color={a.color} strokeWidth={2} />
                        </View>
                        <Text style={styles.cardLabel}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 24, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
    grid: {
        flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16,
        justifyContent: 'center',
    },
    card: {
        width: '44%', backgroundColor: '#fff', borderRadius: 20,
        padding: 24, alignItems: 'center', gap: 14,
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
});
