import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Image, Switch, Alert, TextInput, ActivityIndicator,
    Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
    User, Mail, Phone, Bell, Shield, HelpCircle,
    ChevronRight, LogOut, BookOpen, ClipboardCheck,
    Baby, MessageSquare, Edit3, Check, X, RefreshCw, Lock, Eye, EyeOff, Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BRAND, SHADOW } from '@/constants/Brand';
import { ENDPOINTS } from '@/constants/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface ParentProfile {
    studentId: string;
    childName: string;
    childClass: string;
    childEnrollmentId: string;
    childGender: string | null;
    parentName: string;
    parentEmail: string | null;
    parentPhone: string;
    teacherName: string | null;
    teacherPhone: string | null;
    teacherEmail: string | null;
    avatarUrl: string | null;
    attendanceRate: number;
    pendingFees: number;
    paidFees: number;
}

// ── Edit Profile Modal ─────────────────────────────────────────────────────

function EditProfileModal({
    visible,
    profile,
    onClose,
    onSaved,
}: {
    visible: boolean;
    profile: ParentProfile;
    onClose: () => void;
    onSaved: (updated: { parentName: string; parentPhone: string; parentEmail: string }) => void;
}) {
    const [name, setName] = useState(profile.parentName);
    const [phone, setPhone] = useState(profile.parentPhone || '');
    const [email, setEmail] = useState(profile.parentEmail || '');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            setName(profile.parentName);
            setPhone(profile.parentPhone || '');
            setEmail(profile.parentEmail || '');
            setErr(null);
        }
    }, [visible, profile]);

    const handleSave = async () => {
        if (!name.trim()) { setErr('Name is required.'); return; }
        setSaving(true);
        setErr(null);
        try {
            const payload = {
                parentName: name.trim(),
                parentPhone: phone.trim(),
                parentEmail: email.trim() || '',
            };

            // Demo account — no backend, just update locally
            if (!profile.studentId || profile.studentId === 'demo') {
                onSaved(payload);
                onClose();
                return;
            }

            const res = await fetch(ENDPOINTS.parentProfile(profile.studentId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentName: payload.parentName,
                    parentPhone: payload.parentPhone,
                    parentEmail: payload.parentEmail || null,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || 'Failed to save');
            }
            const updated = await res.json();
            onSaved({ ...payload, ...updated });
            onClose();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={em.safe}>
                    {/* Header */}
                    <View style={em.header}>
                        <TouchableOpacity onPress={onClose} style={em.iconBtn}>
                            <X size={22} color={BRAND.ink} />
                        </TouchableOpacity>
                        <Text style={em.title}>Edit Profile</Text>
                        <TouchableOpacity onPress={handleSave} style={em.iconBtn} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color={BRAND.purple} />
                                : <Check size={22} color={BRAND.purple} />}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={em.body} keyboardShouldPersistTaps="handled">
                        {err && (
                            <View style={em.errorBox}>
                                <Text style={em.errorText}>{err}</Text>
                            </View>
                        )}

                        <Text style={em.sectionLabel}>YOUR DETAILS</Text>
                        <View style={em.card}>
                            {/* Name */}
                            <View style={em.field}>
                                <View style={[em.fieldIcon, { backgroundColor: '#eff6ff' }]}>
                                    <User size={16} color="#3b82f6" />
                                </View>
                                <View style={em.fieldContent}>
                                    <Text style={em.fieldLabel}>Full Name *</Text>
                                    <TextInput
                                        style={em.fieldInput}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Your full name"
                                        placeholderTextColor={BRAND.muted}
                                    />
                                </View>
                            </View>

                            <View style={em.divider} />

                            {/* Phone */}
                            <View style={em.field}>
                                <View style={[em.fieldIcon, { backgroundColor: '#ecfdf5' }]}>
                                    <Phone size={16} color="#10b981" />
                                </View>
                                <View style={em.fieldContent}>
                                    <Text style={em.fieldLabel}>Phone Number</Text>
                                    <TextInput
                                        style={em.fieldInput}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+91 98765 43210"
                                        placeholderTextColor={BRAND.muted}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={em.divider} />

                            {/* Email */}
                            <View style={em.field}>
                                <View style={[em.fieldIcon, { backgroundColor: '#eff6ff' }]}>
                                    <Mail size={16} color="#3b82f6" />
                                </View>
                                <View style={em.fieldContent}>
                                    <Text style={em.fieldLabel}>Email Address</Text>
                                    <TextInput
                                        style={em.fieldInput}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="you@email.com"
                                        placeholderTextColor={BRAND.muted}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={em.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={em.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const em = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BRAND.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: BRAND.border,
        backgroundColor: BRAND.white,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 17, fontWeight: '800', color: BRAND.ink },
    body: { padding: 20, paddingBottom: 48 },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: BRAND.muted, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
    card: { backgroundColor: BRAND.white, borderRadius: 16, overflow: 'hidden', ...SHADOW },
    field: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    fieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: BRAND.muted, marginBottom: 4 },
    fieldInput: { fontSize: 15, color: BRAND.ink, fontWeight: '500' },
    divider: { height: 1, backgroundColor: BRAND.border, marginLeft: 62 },
    saveBtn: {
        marginTop: 24, backgroundColor: BRAND.purple, borderRadius: 16,
        padding: 16, alignItems: 'center',
        shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
    },
    saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ── Change Password Modal ──────────────────────────────────────────────────

function ChangePasswordModal({
    visible,
    studentId,
    onClose,
}: {
    visible: boolean;
    studentId: string;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const isDemo = !studentId || studentId === 'demo';

    useEffect(() => {
        if (visible) {
            setCurrent('');
            setNext('');
            setConfirm('');
            setErr(null);
        }
    }, [visible]);

    const handleSave = async () => {
        setErr(null);
        if (next.length < 6) { setErr('New password must be at least 6 characters.'); return; }
        if (next !== confirm) { setErr('Passwords do not match.'); return; }

        if (isDemo) {
            Alert.alert('Demo Account', 'Password changes are not saved for demo accounts.', [
                { text: 'OK', onPress: onClose },
            ]);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(ENDPOINTS.changePassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    currentPassword: current || undefined,
                    newPassword: next,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');
            Alert.alert('Password Updated', 'Your password has been changed successfully.', [
                { text: 'OK', onPress: onClose },
            ]);
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Could not update password.');
        } finally {
            setSaving(false);
        }
    };

    const PasswordField = ({
        label,
        value,
        onChange,
        show,
        toggleShow,
        placeholder,
    }: {
        label: string;
        value: string;
        onChange: (v: string) => void;
        show: boolean;
        toggleShow: () => void;
        placeholder: string;
    }) => (
        <View style={pw.field}>
            <Text style={pw.fieldLabel}>{label}</Text>
            <View style={pw.inputRow}>
                <Lock size={16} color={BRAND.muted} style={{ marginRight: 10 }} />
                <TextInput
                    style={pw.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={BRAND.muted}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {show
                        ? <EyeOff size={16} color={BRAND.muted} />
                        : <Eye size={16} color={BRAND.muted} />}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={pw.safe}>
                    {/* Header */}
                    <View style={pw.header}>
                        <TouchableOpacity onPress={onClose} style={pw.iconBtn}>
                            <X size={22} color={BRAND.ink} />
                        </TouchableOpacity>
                        <Text style={pw.title}>Change Password</Text>
                        <TouchableOpacity onPress={handleSave} style={pw.iconBtn} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color={BRAND.purple} />
                                : <Check size={22} color={BRAND.purple} />}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={pw.body} keyboardShouldPersistTaps="handled">
                        {err && (
                            <View style={pw.errorBox}>
                                <Text style={pw.errorText}>{err}</Text>
                            </View>
                        )}

                        <Text style={pw.sectionLabel}>SET NEW PASSWORD</Text>
                        <View style={pw.card}>
                            <PasswordField
                                label="Current Password"
                                value={current}
                                onChange={setCurrent}
                                show={showCurrent}
                                toggleShow={() => setShowCurrent(v => !v)}
                                placeholder="Leave blank if not set"
                            />
                            <View style={pw.divider} />
                            <PasswordField
                                label="New Password"
                                value={next}
                                onChange={setNext}
                                show={showNext}
                                toggleShow={() => setShowNext(v => !v)}
                                placeholder="Min 6 characters"
                            />
                            <View style={pw.divider} />
                            <PasswordField
                                label="Confirm New Password"
                                value={confirm}
                                onChange={setConfirm}
                                show={showConfirm}
                                toggleShow={() => setShowConfirm(v => !v)}
                                placeholder="Re-enter new password"
                            />
                        </View>

                        <Text style={pw.hint}>
                            If you've never set a password before, leave "Current Password" blank.
                        </Text>

                        <TouchableOpacity style={pw.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={pw.saveBtnText}>Update Password</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const pw = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BRAND.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: BRAND.border,
        backgroundColor: BRAND.white,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 17, fontWeight: '800', color: BRAND.ink },
    body: { padding: 20, paddingBottom: 48 },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: BRAND.muted, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
    card: { backgroundColor: BRAND.white, borderRadius: 16, overflow: 'hidden', ...SHADOW },
    field: { padding: 16 },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: BRAND.muted, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: BRAND.bg, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: BRAND.border,
    },
    input: { flex: 1, fontSize: 15, color: BRAND.ink },
    divider: { height: 1, backgroundColor: BRAND.border },
    hint: { fontSize: 12, color: BRAND.muted, textAlign: 'center', marginTop: 14, lineHeight: 18 },
    saveBtn: {
        marginTop: 24, backgroundColor: BRAND.purple, borderRadius: 16,
        padding: 16, alignItems: 'center',
        shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
    },
    saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ── Main Profile Screen ────────────────────────────────────────────────────

export default function ProfileScreen() {
    const { logout, user, updateUser } = useAuth();

    // Seed profile from session immediately so edit works before/without API
    const sessionProfile = (): ParentProfile => ({
        studentId: user?.studentId ?? 'demo',
        childName: user?.childName ?? '',
        childClass: user?.childClass ?? '',
        childEnrollmentId: user?.childEnrollmentId ?? '',
        childGender: null,
        parentName: user?.name ?? '',
        parentEmail: user?.email ?? null,
        parentPhone: user?.phone ?? '',
        teacherName: user?.teacherName ?? null,
        teacherPhone: null,
        teacherEmail: null,
        avatarUrl: null,
        attendanceRate: user?.attendanceRate ?? 0,
        pendingFees: user?.pendingFees ?? 0,
        paidFees: 0,
    });

    const [profile, setProfile] = useState<ParentProfile>(sessionProfile);
    const [loading, setLoading] = useState(true);
    const [editVisible, setEditVisible] = useState(false);
    const [changePwVisible, setChangePwVisible] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [diaryAlertsOn, setDiaryAlertsOn] = useState(true);

    const isTeacher = user?.role === 'teacher';
    const bannerColor = isTeacher ? BRAND.purple : BRAND.teal;

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        if (isTeacher || !user?.studentId || user.studentId === 'demo') {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(ENDPOINTS.parentProfile(user.studentId));
            if (res.ok) {
                const data: ParentProfile = await res.json();
                setProfile(data);
            }
        } catch {
            // Network error — session-seeded profile is already showing
        } finally {
            setLoading(false);
        }
    }, [user?.studentId, isTeacher]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Resolved display values: prefer fresh API data, fall back to session
    const displayName = profile?.parentName ?? user?.name ?? '';
    const displayEmail = profile?.parentEmail ?? user?.email ?? '';
    const displayPhone = profile?.parentPhone ?? user?.phone ?? '';
    const displayChild = profile?.childName ?? user?.childName ?? '';
    const displayClass = profile?.childClass ?? user?.childClass ?? '';
    const displayAttendance = profile?.attendanceRate ?? user?.attendanceRate ?? 0;
    const displayPending = profile?.pendingFees ?? user?.pendingFees ?? 0;
    const displayTeacher = profile?.teacherName ?? user?.teacherName ?? null;

    const handleSaved = async (updated: { parentName: string; parentPhone: string; parentEmail: string }) => {
        // Update local state
        if (profile) {
            setProfile(prev => prev ? { ...prev, ...updated } : prev);
        }
        // Update session so other screens reflect the change immediately
        await updateUser({
            name: updated.parentName,
            phone: updated.parentPhone,
            email: updated.parentEmail,
        });
    };

    const handlePickAvatar = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        const isDemo = !profile.studentId || profile.studentId === 'demo';
        if (isDemo) {
            // Just update locally for demo
            setProfile(prev => ({ ...prev, avatarUrl: asset.uri }));
            return;
        }

        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('studentId', profile.studentId);
            formData.append('file', {
                uri: asset.uri,
                type: asset.mimeType ?? 'image/jpeg',
                name: `avatar-${profile.studentId}.jpg`,
            } as unknown as Blob);

            const res = await fetch(ENDPOINTS.avatarUpload, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        } catch (e: unknown) {
            Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Could not update profile picture.');
        } finally {
            setAvatarUploading(false);
        }
    };

    const confirmLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    // ── Teacher view (static, no API) ──────────────────────────────────────
    if (isTeacher) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                    <View style={[s.banner, { backgroundColor: BRAND.purple }]}>
                        <View style={s.bannerInner}>
                            <Image source={require('@/assets/images/logo.png')} style={s.bannerLogo} resizeMode="contain" />
                            <View style={s.avatarWrapper}>
                                <Image source={{ uri: 'https://i.pravatar.cc/150?u=teacher1' }} style={s.avatar} />
                                <View style={[s.rolePill, { backgroundColor: '#1d4ed8' }]}>
                                    <Text style={s.roleText}>👩‍🏫 Teacher</Text>
                                </View>
                            </View>
                            <Text style={s.profileName}>{user?.name || 'Teacher'}</Text>
                            <Text style={s.profileRole}>B.Ed · Early Childhood Education</Text>
                        </View>
                    </View>

                    <View style={s.statsRow}>
                        {[
                            { label: 'Classes', value: '2', icon: BookOpen, color: '#3b82f6', bg: '#eff6ff' },
                            { label: 'Children', value: '33', icon: Baby, color: '#f97316', bg: '#fff7ed' },
                            { label: 'Experience', value: '8 yrs', icon: ClipboardCheck, color: '#8b5cf6', bg: '#f5f3ff' },
                        ].map(s2 => (
                            <View key={s2.label} style={s.statCard}>
                                <View style={[s.statIcon, { backgroundColor: s2.bg }]}>
                                    <s2.icon size={18} color={s2.color} />
                                </View>
                                <Text style={[s.statValue, { color: s2.color }]}>{s2.value}</Text>
                                <Text style={s.statLabel}>{s2.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Contact Info</Text>
                        <View style={s.infoCard}>
                            {[
                                { icon: Mail, label: user?.email || 'teacher@aurralis.com', color: '#3b82f6' },
                                { icon: Phone, label: '+91 98765 43210', color: '#10b981' },
                            ].map((info, i) => (
                                <View key={i} style={[s.infoRow, i === 0 && s.infoRowBorder]}>
                                    <View style={[s.infoIcon, { backgroundColor: `${info.color}15` }]}>
                                        <info.icon size={16} color={info.color} />
                                    </View>
                                    <Text style={s.infoText}>{info.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
                        <LogOut size={18} color="#ef4444" />
                        <Text style={s.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={s.version}>Aurralis Preschool · v1.0.0</Text>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── Parent view ────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={s.safe}>
            {/* Edit modal — always rendered so it can open even before API data loads */}
            <EditProfileModal
                visible={editVisible}
                profile={profile}
                onClose={() => setEditVisible(false)}
                onSaved={handleSaved}
            />
            <ChangePasswordModal
                visible={changePwVisible}
                studentId={profile.studentId}
                onClose={() => setChangePwVisible(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

                {/* ── Banner ── */}
                <View style={[s.banner, { backgroundColor: bannerColor }]}>
                    <View style={s.bannerInner}>
                        <Image source={require('@/assets/images/logo.png')} style={s.bannerLogo} resizeMode="contain" />
                        <View style={s.avatarWrapper}>
                            <TouchableOpacity onPress={handlePickAvatar} disabled={avatarUploading} activeOpacity={0.8}>
                                <Image
                                    source={{ uri: profile.avatarUrl ?? `https://i.pravatar.cc/150?u=${displayEmail || 'parent'}` }}
                                    style={s.avatar}
                                />
                                <View style={s.cameraBadge}>
                                    {avatarUploading
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Camera size={14} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                            <View style={[s.rolePill, { backgroundColor: '#c2410c' }]}>
                                <Text style={s.roleText}>👨‍👩‍👧 Parent</Text>
                            </View>
                        </View>
                        <Text style={s.profileName}>{displayName || 'Parent'}</Text>
                        <Text style={s.profileRole}>
                            {displayChild ? `Parent of ${displayChild}` : 'Parent'}
                        </Text>
                    </View>
                </View>

                {/* ── Stats Row ── */}
                {loading ? (
                    <View style={s.loadingRow}>
                        <ActivityIndicator color={BRAND.teal} />
                        <Text style={s.loadingText}>Loading profile…</Text>
                    </View>
                ) : (
                    <View style={s.statsRow}>
                        {[
                            { label: 'Attendance', value: `${displayAttendance}%`, icon: ClipboardCheck, color: '#22c55e', bg: '#dcfce7' },
                            { label: 'Pending', value: displayPending > 0 ? `₹${displayPending.toLocaleString()}` : 'Clear', icon: Shield, color: displayPending > 0 ? '#ef4444' : '#22c55e', bg: displayPending > 0 ? '#fee2e2' : '#dcfce7' },
                            { label: 'Messages', value: '—', icon: MessageSquare, color: '#3b82f6', bg: '#eff6ff' },
                        ].map(s2 => (
                            <View key={s2.label} style={s.statCard}>
                                <View style={[s.statIcon, { backgroundColor: s2.bg }]}>
                                    <s2.icon size={18} color={s2.color} />
                                </View>
                                <Text style={[s.statValue, { color: s2.color }]}>{s2.value}</Text>
                                <Text style={s.statLabel}>{s2.label}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Child Card ── */}
                {displayChild ? (
                    <View style={s.childCard}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/150?u=child1' }}
                            style={s.childAvatar}
                        />
                        <View style={s.childInfo}>
                            <Text style={s.childName}>{displayChild}</Text>
                            <Text style={s.childMeta}>
                                {displayClass}{displayTeacher ? ` · ${displayTeacher}` : ''}
                            </Text>
                        </View>
                        <View style={s.childBadge}>
                            <Baby size={14} color="#f97316" />
                            <Text style={s.childBadgeText}>My Child</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Contact Info ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Contact Info</Text>
                    <View style={s.infoCard}>
                        {[
                            { icon: Mail, label: displayEmail || 'Not set', color: '#3b82f6' },
                            { icon: Phone, label: displayPhone || 'Not set', color: '#10b981' },
                        ].map((info, i) => (
                            <View key={i} style={[s.infoRow, i === 0 && s.infoRowBorder]}>
                                <View style={[s.infoIcon, { backgroundColor: `${info.color}15` }]}>
                                    <info.icon size={16} color={info.color} />
                                </View>
                                <Text style={s.infoText}>{info.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Notifications ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Notifications</Text>
                    <View style={s.infoCard}>
                        <View style={[s.switchRow, s.infoRowBorder]}>
                            <View style={s.switchLeft}>
                                <View style={[s.infoIcon, { backgroundColor: '#fff7ed' }]}>
                                    <Bell size={16} color="#f97316" />
                                </View>
                                <View>
                                    <Text style={s.switchLabel}>Push Notifications</Text>
                                    <Text style={s.switchSub}>Announcements & Messages</Text>
                                </View>
                            </View>
                            <Switch
                                value={notificationsOn}
                                onValueChange={setNotificationsOn}
                                trackColor={{ false: '#f1f5f9', true: BRAND.teal }}
                                thumbColor="#ffffff"
                            />
                        </View>
                        <View style={s.switchRow}>
                            <View style={s.switchLeft}>
                                <View style={[s.infoIcon, { backgroundColor: '#ecfdf5' }]}>
                                    <BookOpen size={16} color="#10b981" />
                                </View>
                                <View>
                                    <Text style={s.switchLabel}>Daily Diary Alerts</Text>
                                    <Text style={s.switchSub}>When teacher posts today's diary</Text>
                                </View>
                            </View>
                            <Switch
                                value={diaryAlertsOn}
                                onValueChange={setDiaryAlertsOn}
                                trackColor={{ false: '#f1f5f9', true: BRAND.teal }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>
                </View>

                {/* ── Account Actions ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Account</Text>
                    <View style={s.infoCard}>
                        <TouchableOpacity
                            style={[s.settingRow, s.infoRowBorder]}
                            onPress={() => setEditVisible(true)}>
                            <View style={[s.infoIcon, { backgroundColor: '#eff6ff' }]}>
                                <Edit3 size={16} color="#3b82f6" />
                            </View>
                            <Text style={s.settingLabel}>Edit Profile</Text>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.settingRow, s.infoRowBorder]}
                            onPress={fetchProfile}>
                            <View style={[s.infoIcon, { backgroundColor: '#f0fdf4' }]}>
                                <RefreshCw size={16} color="#22c55e" />
                            </View>
                            <Text style={s.settingLabel}>Refresh Profile</Text>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.settingRow}
                            onPress={() => setChangePwVisible(true)}>
                            <View style={[s.infoIcon, { backgroundColor: '#f5f3ff' }]}>
                                <Shield size={16} color="#8b5cf6" />
                            </View>
                            <Text style={s.settingLabel}>Change Password</Text>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Support ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Support</Text>
                    <View style={s.infoCard}>
                        <TouchableOpacity
                            style={[s.settingRow, s.infoRowBorder]}
                            onPress={() => Alert.alert('Help & FAQ', 'Contact the school office for assistance.\n📞 +91 80 1234 5678')}>
                            <View style={[s.infoIcon, { backgroundColor: '#fff7ed' }]}>
                                <HelpCircle size={16} color="#f97316" />
                            </View>
                            <Text style={s.settingLabel}>Help & FAQ</Text>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.settingRow}
                            onPress={() => Alert.alert('Contact School', 'Call us at +91 80 1234 5678\nor email info@aurralis.com')}>
                            <View style={[s.infoIcon, { backgroundColor: '#fdf2f8' }]}>
                                <MessageSquare size={16} color="#ec4899" />
                            </View>
                            <Text style={s.settingLabel}>Contact School</Text>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Sign Out ── */}
                <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
                    <LogOut size={18} color="#ef4444" />
                    <Text style={s.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={s.version}>Aurralis Preschool · v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BRAND.bg },
    content: { paddingBottom: 48 },

    // Banner
    banner: { paddingTop: 32, paddingBottom: 40 },
    bannerInner: { alignItems: 'center', paddingHorizontal: 24 },
    bannerLogo: { width: 120, height: 40, marginBottom: 16, tintColor: 'rgba(255,255,255,0.9)' },
    avatarWrapper: { position: 'relative', marginBottom: 14 },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    },
    rolePill: {
        position: 'absolute', bottom: -4, left: '50%',
        transform: [{ translateX: -48 }],
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    },
    roleText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    profileName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4, textAlign: 'center' },
    profileRole: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '500' },

    // Loading
    loadingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginHorizontal: 20, marginTop: -24, marginBottom: 16,
        backgroundColor: BRAND.white, borderRadius: 16, padding: 16,
        ...SHADOW,
    },
    loadingText: { fontSize: 13, color: BRAND.label, fontWeight: '500' },

    // Stats
    statsRow: {
        flexDirection: 'row', gap: 12, marginHorizontal: 20,
        marginTop: -24, marginBottom: 16,
    },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
        alignItems: 'center', gap: 6,
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
    statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

    // Child card
    childCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 8,
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    },
    childAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    childInfo: { flex: 1 },
    childName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    childMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
    childBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    childBadgeText: { fontSize: 11, fontWeight: '700', color: '#f97316' },

    // Sections
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

    // Info card
    infoCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoText: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },

    // Switches
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    switchLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    switchSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

    // Settings rows
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    settingLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 16,
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#fee2e2',
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },

    version: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 20, fontWeight: '500' },
});
