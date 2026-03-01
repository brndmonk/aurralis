import React from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Search, PenSquare, BookPlus, ClipboardCheck, CheckCircle2, MessageSquare, Star, MoreHorizontal } from 'lucide-react-native';
import { BRAND } from '@/constants/Brand';

export default function TeacherHome() {
    const { user } = useAuth();
    const router = useRouter();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const className = user?.className ?? 'My Class';
    const classes = user?.classes ?? [];

    const quickActions = [
        { label: 'Upload Photos', desc: 'Share today\'s moments', icon: Camera, color: '#ec4899', bg: '#fdf2f8', route: '/teacher/photo-upload' },
        { label: 'Post Update', desc: 'Share news with parents', icon: PenSquare, color: '#3b82f6', bg: '#eff6ff', route: '/teacher/post-update' },
        { label: 'Attendance', desc: 'Mark today\'s attendance', icon: ClipboardCheck, color: '#22c55e', bg: '#f0fdf4', route: '/teacher/attendance' },
        { label: 'Add Activity', desc: 'Assign take-home tasks', icon: BookPlus, color: '#a855f7', bg: '#faf5ff', route: '/teacher/homework' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: 'https://i.pravatar.cc/150?u=teacher1' }} style={styles.avatar} />
                            <View style={styles.onlineBadge} />
                        </View>
                        <View>
                            <Text style={styles.greeting}>{greeting},</Text>
                            <Text style={styles.name}>{user?.name || 'Teacher'}</Text>
                            {className && <Text style={[styles.greeting, { color: BRAND.purple, fontSize: 12 }]}>📚 {className}</Text>}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Image source={require('@/assets/images/logo.png')} style={styles.logoSmall} resizeMode="contain" />
                        <TouchableOpacity style={styles.notificationBtn}>
                            <View style={styles.notificationDot} />
                            <Text>🔔</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput placeholder="Search children, classes..." placeholderTextColor="#94a3b8" style={styles.searchInput} />
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.gridContainer}>
                        {quickActions.map(qa => (
                            <TouchableOpacity key={qa.label} style={styles.gridCard} onPress={() => router.push(qa.route as any)}>
                                <View style={[styles.iconBox, { backgroundColor: qa.bg }]}>
                                    <qa.icon size={22} color={qa.color} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.cardTitle}>{qa.label}</Text>
                                <Text style={styles.cardDesc}>{qa.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Today's Schedule */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <TouchableOpacity onPress={() => router.push('/teacher/events')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }} style={{ marginHorizontal: -24 }}>
                        {(classes.length > 0 ? classes : [{ id: '', displayName: className, studentCount: 0, name: className, section: null }]).map((cls, i) => (
                            <TouchableOpacity
                                key={cls.id || i}
                                style={[styles.scheduleCard, { borderLeftColor: ['#0ea5e9', '#a855f7', '#22c55e'][i % 3], borderLeftWidth: 6, marginLeft: i > 0 ? 16 : 0 }]}
                                onPress={() => router.push({ pathname: '/teacher/class-detail', params: { name: cls.displayName } } as any)}>
                                <View style={styles.scheduleHeader}>
                                    <View style={[styles.timeBadge, { backgroundColor: ['#e0f2fe', '#faf5ff', '#dcfce7'][i % 3] }]}>
                                        <Text style={[styles.timeText, { color: ['#0ea5e9', '#a855f7', '#22c55e'][i % 3] }]}>Class {i + 1}</Text>
                                    </View>
                                    <MoreHorizontal size={20} color="#cbd5e1" />
                                </View>
                                <Text style={styles.scheduleTitle}>{cls.displayName}</Text>
                                <Text style={styles.scheduleSubtitle}>{cls.studentCount} students enrolled</Text>
                                <View style={styles.avatarsRow}>
                                    <View style={styles.miniAvatar}><Image source={{ uri: 'https://i.pravatar.cc/150?u=k1' }} style={styles.avatarImg} /></View>
                                    <View style={[styles.miniAvatar, { marginLeft: -10 }]}><Image source={{ uri: 'https://i.pravatar.cc/150?u=k2' }} style={styles.avatarImg} /></View>
                                    <View style={[styles.countBadge, { marginLeft: -10 }]}><Text style={styles.countText}>+{Math.max(0, cls.studentCount - 2)}</Text></View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {[
                        { icon: CheckCircle2, bg: '#dcfce7', color: '#16a34a', title: 'Attendance Marked', desc: 'Nursery A — 14 present, 1 absent today.', time: '9:05 AM' },
                        { icon: MessageSquare, bg: '#e0f2fe', color: '#0284c7', title: 'New Message', desc: 'Aarav\'s mom: "Will he need a spare uniform?"', time: '1 hour ago' },
                        { icon: Star, bg: '#fef3c7', color: '#d97706', title: 'Progress Note Added', desc: 'Priya showed great improvement in colouring today.', time: 'Yesterday' },
                    ].map((a, i) => (
                        <View key={i} style={styles.activityCard}>
                            <View style={[styles.activityIconBox, { backgroundColor: a.bg }]}>
                                <a.icon size={20} color={a.color} />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>{a.title}</Text>
                                <Text style={styles.activityDesc}>{a.desc}</Text>
                                <Text style={styles.activityTime}>{a.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BRAND.bg },
    container: { flex: 1 },
    contentContainer: { padding: 24, paddingTop: 12, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoSmall: { width: 80, height: 36 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, backgroundColor: '#22c55e', borderRadius: 7, borderWidth: 2, borderColor: BRAND.bg },
    greeting: { fontSize: 14, color: BRAND.label, fontWeight: '600' },
    name: { fontSize: 18, fontWeight: '800', color: BRAND.ink },
    notificationBtn: { width: 44, height: 44, backgroundColor: BRAND.white, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 32, shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: BRAND.ink },
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: BRAND.ink, marginBottom: 16 },
    seeAll: { fontSize: 14, fontWeight: '700', color: BRAND.purple },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
    gridCard: { width: '47%', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    cardDesc: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    scheduleCard: { backgroundColor: '#ffffff', width: 240, borderRadius: 20, padding: 20, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    timeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    timeText: { fontSize: 12, fontWeight: '800' },
    scheduleTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    scheduleSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 16 },
    avatarsRow: { flexDirection: 'row', alignItems: 'center' },
    miniAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#ffffff', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    countBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
    countText: { fontSize: 9, fontWeight: '700', color: '#475569' },
    activityCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    activityIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    activityDesc: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 8 },
    activityTime: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
});
