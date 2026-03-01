import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Coffee, Palette, Music, Dumbbell, BookOpen, Moon } from 'lucide-react-native';

// Daily diary for today - shows what the child did at school
const TODAY = {
    date: 'Friday, Feb 28, 2025',
    child: 'Aarav Sharma',
    class: 'Nursery A',
    teacher: 'Mrs. Smith',
    teacherNote: 'Aarav had a wonderful day! He was very enthusiastic during Art & Craft and made a beautiful butterfly painting. He shared his crayons with friends — great social behaviour! 🌟',
    mood: '😊 Happy',
};

const TIMELINE = [
    { time: '9:00', icon: Sun, color: '#f97316', bg: '#fff7ed', activity: 'Circle Time & Good Morning Song', detail: 'Counted numbers 1–10, sang "Good Morning" rhyme.' },
    { time: '9:30', icon: Coffee, color: '#8b5cf6', bg: '#f5f3ff', activity: 'Morning Snack', detail: 'Had banana and milk. Ate well today! 🍌' },
    { time: '10:00', icon: Palette, color: '#ec4899', bg: '#fdf2f8', activity: 'Art & Craft', detail: 'Made a butterfly using crayons and colour paper. Great focus and creativity shown.' },
    { time: '10:45', icon: BookOpen, color: '#3b82f6', bg: '#eff6ff', activity: 'Story Time', detail: 'Listened to "The Very Hungry Caterpillar". Answered questions about the story.' },
    { time: '11:15', icon: Dumbbell, color: '#10b981', bg: '#ecfdf5', activity: 'Outdoor Play', detail: 'Sandbox, slide, and group chase games. Active and energetic!' },
    { time: '11:45', icon: Music, color: '#f59e0b', bg: '#fffbeb', activity: 'Music & Rhymes', detail: 'Practiced "Twinkle Twinkle". Take-home: sing 3 times before bed.' },
    { time: '12:00', icon: Moon, color: '#6366f1', bg: '#eef2ff', activity: 'Pack-up & Dismissal', detail: 'Cheerful goodbye! Remembered to take his water bottle.' },
];

const NAP = { slept: true, duration: '— (half-day session)' };

export default function DailyDiaryScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Daily Diary</Text>
                    <Text style={styles.headerSub}>{TODAY.date}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Child Info Bar */}
                <View style={styles.infoBar}>
                    <Image source={{ uri: 'https://i.pravatar.cc/150?u=k1' }} style={styles.childAvatar} />
                    <View style={styles.infoText}>
                        <Text style={styles.childName}>{TODAY.child}</Text>
                        <Text style={styles.childClass}>{TODAY.class}</Text>
                    </View>
                    <View style={styles.moodBadge}>
                        <Text style={styles.moodText}>{TODAY.mood}</Text>
                    </View>
                </View>

                {/* Teacher's Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteLabel}>📝 Teacher's Note</Text>
                    <Text style={styles.noteText}>{TODAY.teacherNote}</Text>
                    <Text style={styles.noteTeacher}>— {TODAY.teacher}</Text>
                </View>

                {/* Timeline */}
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                {TIMELINE.map((item, i) => {
                    const Icon = item.icon;
                    const isLast = i === TIMELINE.length - 1;
                    return (
                        <View key={item.time} style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                                <Text style={styles.timeLabel}>{item.time}</Text>
                                {!isLast && <View style={styles.timelineLine} />}
                            </View>
                            <View style={[styles.timelineIcon, { backgroundColor: item.bg }]}>
                                <Icon size={16} color={item.color} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.activityName}>{item.activity}</Text>
                                <Text style={styles.activityDetail}>{item.detail}</Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#f97316' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    content: { padding: 20, paddingBottom: 40 },
    infoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    childAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    infoText: { flex: 1 },
    childName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    childClass: { fontSize: 12, color: '#64748b' },
    moodBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    moodText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
    noteCard: { backgroundColor: '#fffbeb', borderRadius: 16, padding: 18, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
    noteLabel: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 8 },
    noteText: { fontSize: 14, color: '#44403c', lineHeight: 22, marginBottom: 10 },
    noteTeacher: { fontSize: 12, color: '#a78bfa', fontWeight: '600', textAlign: 'right', fontStyle: 'italic' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    timelineRow: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { width: 52, alignItems: 'center' },
    timeLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 4, marginTop: 2 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#f1f5f9', marginBottom: -8 },
    timelineIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2, flexShrink: 0 },
    timelineContent: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    activityName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    activityDetail: { fontSize: 12, color: '#64748b', lineHeight: 17 },
});
