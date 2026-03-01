import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, Modal, Dimensions, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/constants/api';
import { ArrowLeft, X, ImageOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ApiPhoto {
    id: string;
    name: string;
    url: string;
    uploadedBy: string | null;
    createdAt: string;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ParentPhotosScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [photos, setPhotos] = useState<ApiPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const isDemo = !user?.studentId || user.studentId === 'demo';

    const childClass = user?.childClass ?? '';
    const childName = user?.childName ?? 'Your Child';

    const fetchPhotos = useCallback(async () => {
        if (isDemo) { setLoading(false); return; }
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(ENDPOINTS.parentPhotos(user!.studentId!));
            if (res.ok) {
                const data = await res.json();
                setPhotos(data.photos ?? []);
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user?.studentId, isDemo]);

    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Class Photos</Text>
                    {childClass ? (
                        <Text style={styles.headerSub}>{childClass} · {childName}'s class</Text>
                    ) : null}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>Failed to load photos.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchPhotos}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : photos.length === 0 ? (
                <View style={styles.centerBox}>
                    <ImageOff size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No photos yet</Text>
                    <Text style={styles.emptySubtitle}>
                        {isDemo ? 'Demo accounts don\'t have photos.' : 'Your child\'s teacher will upload class photos here.'}
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {photos.map(photo => (
                        <View key={photo.id} style={styles.postCard}>
                            {/* Post Header */}
                            <View style={styles.postHeader}>
                                <Image
                                    source={{ uri: `https://i.pravatar.cc/150?u=${photo.uploadedBy ?? 'teacher'}` }}
                                    style={styles.teacherAvatar}
                                />
                                <View style={styles.postInfo}>
                                    <Text style={styles.postTeacher}>
                                        {photo.uploadedBy ?? 'Class Teacher'}
                                    </Text>
                                    <Text style={styles.postMeta}>{formatDate(photo.createdAt)}</Text>
                                </View>
                                {childClass ? (
                                    <View style={styles.classPill}>
                                        <Text style={styles.classPillText}>{childClass}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Caption — file name */}
                            <Text style={styles.caption} numberOfLines={1}>{photo.name}</Text>

                            {/* Image */}
                            <TouchableOpacity onPress={() => setLightboxImage(photo.url)}>
                                <Image
                                    source={{ uri: photo.url }}
                                    style={styles.singleImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>

                            {/* Footer */}
                            <View style={styles.postFooter}>
                                <Text style={styles.photoCount}>📸 Tap to view full size</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Lightbox */}
            <Modal visible={lightboxImage !== null} transparent animationType="fade">
                <View style={styles.lightbox}>
                    <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxImage(null)}>
                        <X size={28} color="#fff" />
                    </TouchableOpacity>
                    {lightboxImage && (
                        <Image
                            source={{ uri: lightboxImage }}
                            style={styles.lightboxImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
    content: { padding: 16, paddingBottom: 40 },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    errorText: { fontSize: 15, color: '#ef4444', fontWeight: '600', textAlign: 'center' },
    retryBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
    retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 8 },
    emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

    postCard: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden',
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    teacherAvatar: { width: 40, height: 40, borderRadius: 20 },
    postInfo: { flex: 1 },
    postTeacher: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    postMeta: { fontSize: 12, color: '#64748b', marginTop: 1 },
    classPill: { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    classPillText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },

    caption: { fontSize: 13, color: '#64748b', paddingHorizontal: 14, paddingBottom: 10 },
    singleImage: { width: '100%', height: 240 },

    postFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
        paddingHorizontal: 14, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#f8fafc',
    },
    photoCount: { fontSize: 12, color: '#94a3b8' },

    lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    lightboxClose: {
        position: 'absolute', top: 56, right: 20, zIndex: 10,
        width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    },
    lightboxImage: { width, height: height * 0.8 },
});
