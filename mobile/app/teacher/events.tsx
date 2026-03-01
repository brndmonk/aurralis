import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
    ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, MapPin, Clock, Plus, X } from 'lucide-react-native';
import { ENDPOINTS } from '@/constants/api';

interface ApiEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    type: string;
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
    academ: { color: '#3b82f6', bg: '#eff6ff' },
    sport: { color: '#f97316', bg: '#fff7ed' },
    holiday: { color: '#10b981', bg: '#ecfdf5' },
    meeting: { color: '#8b5cf6', bg: '#f5f3ff' },
    field: { color: '#f43f5e', bg: '#fff1f2' },
    other: { color: '#64748b', bg: '#f8fafc' },
};

function getEventColor(type: string): { color: string; bg: string } {
    const key = Object.keys(TYPE_COLORS).find(k => type.toLowerCase().includes(k));
    return TYPE_COLORS[key ?? 'other'];
}

function formatEventDate(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return { day: String(day), month, time };
}

export default function EventsScreen() {
    const router = useRouter();
    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    // New event form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(ENDPOINTS.teacherEvents);
            const data = await res.json();
            const list: ApiEvent[] = Array.isArray(data) ? data : (data.events ?? []);
            setEvents(list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
        } catch {
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const createEvent = async () => {
        if (!title.trim() || !startDate.trim()) {
            Alert.alert('Required', 'Please fill in the title and start date.'); return;
        }
        setSaving(true);
        try {
            const res = await fetch(ENDPOINTS.teacherEvents, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    location: location.trim() || null,
                    startDate: new Date(startDate).toISOString(),
                    type: 'OTHER',
                }),
            });
            if (!res.ok) throw new Error();
            setShowAdd(false);
            setTitle(''); setDescription(''); setLocation(''); setStartDate('');
            fetchEvents();
        } catch {
            Alert.alert('Error', 'Failed to create event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Group events by month
    const grouped = events.reduce<Record<string, ApiEvent[]>>((acc, ev) => {
        const month = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(ev);
        return acc;
    }, {});

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Events &amp; Calendar</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
                    <Plus size={20} color="#0f172a" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#20e1d0" />
                    <Text style={styles.loadingText}>Loading events...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchEvents} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {events.length === 0 && (
                        <View style={styles.center}>
                            <CalendarDays size={40} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No events yet. Tap + to add one.</Text>
                        </View>
                    )}
                    {Object.entries(grouped).map(([month, evList]) => (
                        <View key={month}>
                            <View style={styles.monthBanner}>
                                <CalendarDays size={16} color="#20e1d0" />
                                <Text style={styles.monthText}>{month}</Text>
                            </View>
                            {evList.map(ev => {
                                const { color, bg } = getEventColor(ev.type);
                                const { day, month: mon, time } = formatEventDate(ev.startDate);
                                return (
                                    <View key={ev.id} style={styles.card}>
                                        <View style={[styles.dateBlock, { backgroundColor: bg }]}>
                                            <Text style={[styles.dateNum, { color }]}>{day}</Text>
                                            <Text style={[styles.dateMon, { color }]}>{mon}</Text>
                                        </View>
                                        <View style={styles.cardContent}>
                                            <Text style={styles.cardTitle}>{ev.title}</Text>
                                            <View style={styles.metaRow}>
                                                <Clock size={12} color="#94a3b8" />
                                                <Text style={styles.metaText}>{time}</Text>
                                            </View>
                                            {ev.location && (
                                                <View style={styles.metaRow}>
                                                    <MapPin size={12} color="#94a3b8" />
                                                    <Text style={styles.metaText}>{ev.location}</Text>
                                                </View>
                                            )}
                                            {ev.description ? <Text style={styles.desc} numberOfLines={2}>{ev.description}</Text> : null}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Add Event Modal */}
            <Modal visible={showAdd} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>New Event</Text>
                            <TouchableOpacity onPress={() => setShowAdd(false)}>
                                <X size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Title *</Text>
                        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Science Fair" placeholderTextColor="#94a3b8" />
                        <Text style={styles.inputLabel}>Start Date * (YYYY-MM-DD)</Text>
                        <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2025-03-15" placeholderTextColor="#94a3b8" />
                        <Text style={styles.inputLabel}>Location</Text>
                        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Main Hall" placeholderTextColor="#94a3b8" />
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Optional details..." placeholderTextColor="#94a3b8" multiline textAlignVertical="top" />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={createEvent} disabled={saving}>
                                {saving ? <ActivityIndicator color="#0f172a" size="small" /> : <Text style={styles.saveText}>Create</Text>}
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
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#20e1d0', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    monthBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f8fafc' },
    monthText: { fontSize: 13, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
    list: { padding: 20, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
    dateBlock: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16, flexShrink: 0 },
    dateNum: { fontSize: 22, fontWeight: '800' },
    dateMon: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText: { fontSize: 12, color: '#64748b' },
    desc: { fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 17 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#20e1d0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryText: { fontWeight: '700', color: '#0f172a' },
    emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 16, fontSize: 14 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, color: '#0f172a' },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
    cancelText: { fontWeight: '700', color: '#475569' },
    saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#20e1d0', alignItems: 'center', justifyContent: 'center' },
    saveText: { fontWeight: '700', color: '#0f172a' },
});
