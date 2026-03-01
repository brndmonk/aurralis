import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const router = useRouter();

    const handleSend = () => {
        if (!email) { Alert.alert('Error', 'Please enter your email'); return; }
        setSent(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Mail size={32} color="#20e1d0" />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

                {!sent ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="you@aurralis.com"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                        <TouchableOpacity style={styles.button} onPress={handleSend}>
                            <Send size={18} color="#0f172a" strokeWidth={2.5} />
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.successCard}>
                        <Text style={styles.successTitle}>Check your inbox!</Text>
                        <Text style={styles.successText}>
                            We sent a password reset link to {email}. It will expire in 15 minutes.
                        </Text>
                        <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/(auth)/login')}>
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    backBtn: { padding: 20 },
    content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 24 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 40, maxWidth: 280 },
    inputGroup: { width: '100%', marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: {
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 12, padding: 16, fontSize: 15, color: '#0f172a', width: '100%',
    },
    button: {
        backgroundColor: '#20e1d0', padding: 16, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, width: '100%',
    },
    buttonText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
    successCard: {
        backgroundColor: '#f0fdf4', borderRadius: 20, padding: 24,
        alignItems: 'center', width: '100%',
    },
    successTitle: { fontSize: 20, fontWeight: '800', color: '#16a34a', marginBottom: 12 },
    successText: { fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    backToLogin: { backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
    backToLoginText: { color: '#ffffff', fontWeight: '700' },
});
