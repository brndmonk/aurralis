import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { BRAND } from '@/constants/Brand';
import { ENDPOINTS } from '@/constants/api';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPass, setShowPass] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleLogin = async () => {
        const em = email.trim().toLowerCase();
        const pw = password;

        if (!em || !pw) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            // --- Try parent login first ---
            const res = await fetch(ENDPOINTS.mobileLogin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: em, password: pw }),
            });

            if (res.ok) {
                const data = await res.json();
                await login({
                    studentId: data.studentId,
                    name: data.parentName,
                    email: data.parentEmail,
                    phone: data.parentPhone,
                    role: 'parent',
                    childName: data.childName,
                    childClass: data.childClass,
                    childEnrollmentId: data.childEnrollmentId,
                    childGender: data.childGender ?? null,
                    childDob: data.childDob ?? null,
                    attendanceRate: data.attendanceRate,
                    pendingFees: data.pendingFees,
                    teacherName: data.teacherName,
                    teacherPhone: data.teacherPhone ?? null,
                    teacherEmail: data.teacherEmail ?? null,
                });
                return;
            }

            // --- Try teacher login ---
            const teacherRes = await fetch(ENDPOINTS.teacherLogin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: em, password: pw }),
            });

            if (teacherRes.ok) {
                const data = await teacherRes.json();
                await login({
                    userId: data.userId,
                    name: data.name,
                    email: data.email,
                    role: 'teacher',
                    classId: data.classId ?? null,
                    className: data.className ?? null,
                    classes: data.classes ?? [],
                });
                return;
            }

            // Both failed — try demo fallback
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Invalid credentials');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            Alert.alert('Sign in failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                {/* ── Logo Block ── */}
                <View style={s.logoBlock}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={s.logo}
                        resizeMode="contain"
                    />
                    <Text style={s.tagline}>Inspired by Nature</Text>
                </View>

                {/* ── Card ── */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Welcome back</Text>
                    <Text style={s.cardSub}>Sign in to your account</Text>

                    {/* Email */}
                    <Text style={s.label}>Email</Text>
                    <View style={s.inputRow}>
                        <Mail size={18} color={BRAND.muted} style={s.inputIcon} />
                        <TextInput
                            style={s.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@aurralis.com"
                            placeholderTextColor={BRAND.muted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password */}
                    <Text style={s.label}>Password</Text>
                    <View style={s.inputRow}>
                        <Lock size={18} color={BRAND.muted} style={s.inputIcon} />
                        <TextInput
                            style={[s.input, { flex: 1 }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={BRAND.muted}
                            secureTextEntry={!showPass}
                        />
                        <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                            {showPass ? <EyeOff size={18} color={BRAND.muted} /> : <Eye size={18} color={BRAND.muted} />}
                        </TouchableOpacity>
                    </View>

                    {/* Sign In */}
                    <TouchableOpacity style={s.signInBtn} onPress={() => handleLogin()} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.signInTxt}>Sign In</Text>}
                    </TouchableOpacity>
                </View>

                <Text style={s.footer}>Aurralis Montessori · Inspired by Nature 🌿</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BRAND.bg },
    scroll: { flexGrow: 1, padding: 24, paddingBottom: 48 },

    logoBlock: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
    logo: { width: 220, height: 100 },
    tagline: { fontSize: 13, color: BRAND.label, fontWeight: '500', marginTop: 6, fontStyle: 'italic' },

    card: {
        backgroundColor: BRAND.white, borderRadius: 24, padding: 24, marginBottom: 28,
        shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4,
    },
    cardTitle: { fontSize: 22, fontWeight: '800', color: BRAND.ink, marginBottom: 4 },
    cardSub: { fontSize: 14, color: BRAND.label, marginBottom: 24 },

    label: { fontSize: 13, fontWeight: '700', color: BRAND.ink, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.bg,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
        marginBottom: 16, borderWidth: 1, borderColor: BRAND.border,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: BRAND.ink },
    eyeBtn: { paddingLeft: 8 },

    signInBtn: {
        backgroundColor: BRAND.purple, borderRadius: 14, padding: 16,
        alignItems: 'center', marginTop: 8,
        shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
    },
    signInTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

    footer: { textAlign: 'center', fontSize: 12, color: BRAND.muted, marginTop: 28 },
});
