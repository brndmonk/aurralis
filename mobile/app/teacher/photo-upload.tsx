import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
    Image, TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Images, X, Send, Plus, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/constants/api';

const ACTIVITIES = ['Circle Time', 'Art & Craft', 'Story Time', 'Outdoor Play', 'Music & Rhymes', 'Show & Tell', 'Maths', 'Special Event'];

const { width } = Dimensions.get('window');
const THUMB = (width - 48 - 12) / 3;

export default function PhotoUploadScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const classes = user?.classes?.map(c => c.displayName) ?? [];
    const [images, setImages] = useState<string[]>([]);
    const [caption, setCaption] = useState('');
    const [selectedClass, setSelectedClass] = useState(classes[0] ?? '');
    const [selectedActivity, setSelectedActivity] = useState('Art & Craft');
    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 10,
        });
        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 10));
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow camera access.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) {
            setImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
        }
    };

    const removeImage = (uri: string) => setImages(prev => prev.filter(u => u !== uri));

    const handlePost = async () => {
        if (images.length === 0) { Alert.alert('No photos', 'Add at least one photo to post.'); return; }
        setPosting(true);
        try {
            const uploadResults: string[] = [];
            for (const uri of images) {
                const filename = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
                const formData = new FormData();
                formData.append('file', {
                    uri,
                    name: filename,
                    type: 'image/jpeg',
                } as unknown as Blob);

                const res = await fetch(ENDPOINTS.teacherUpload, {
                    method: 'POST',
                    body: formData,
                    // Do NOT set Content-Type — React Native sets it automatically with the correct boundary
                });
                if (!res.ok) throw new Error(`Upload failed for ${filename}`);
                const data = await res.json();
                uploadResults.push(data.objectName ?? uri);
            }

            await fetch(ENDPOINTS.teacherEvents, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: caption || `${selectedActivity} – ${selectedClass}`,
                    description: `${images.length} photo${images.length > 1 ? 's' : ''} uploaded for ${selectedActivity} | ${selectedClass}`,
                    startDate: new Date().toISOString(),
                    type: 'ACTIVITY',
                    location: selectedClass,
                }),
            });

            setPosting(false);
            setPosted(true);
            setTimeout(() => router.back(), 1500);
        } catch (e: unknown) {
            setPosting(false);
            Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Please try again.');
        }
    };

    if (posted) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successScreen}>
                    <CheckCircle2 size={64} color="#22c55e" />
                    <Text style={styles.successTitle}>Posted! 🎉</Text>
                    <Text style={styles.successSub}>Parents will be notified about the new photos.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Photos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.uploadRow}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                        <Camera size={28} color="#3b82f6" />
                        <Text style={styles.uploadBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.uploadBtn, { borderColor: '#8b5cf6' }]} onPress={pickImages}>
                        <Images size={28} color="#8b5cf6" />
                        <Text style={[styles.uploadBtnText, { color: '#8b5cf6' }]}>Choose from Gallery</Text>
                    </TouchableOpacity>
                </View>

                {images.length > 0 && (
                    <View style={styles.previewSection}>
                        <Text style={styles.previewLabel}>{images.length} photo{images.length > 1 ? 's' : ''} selected</Text>
                        <View style={styles.grid}>
                            {images.map(uri => (
                                <View key={uri} style={styles.thumbWrapper}>
                                    <Image source={{ uri }} style={styles.thumb} />
                                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                                        <X size={12} color="#fff" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 10 && (
                                <TouchableOpacity style={styles.addMoreThumb} onPress={pickImages}>
                                    <Plus size={24} color="#94a3b8" />
                                    <Text style={styles.addMoreText}>Add More</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {classes.length > 0 && (
                    <>
                        <Text style={styles.fieldLabel}>Class</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {classes.map(cls => (
                                <TouchableOpacity
                                    key={cls}
                                    style={[styles.chip, selectedClass === cls && styles.chipActive]}
                                    onPress={() => setSelectedClass(cls)}>
                                    <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                <Text style={styles.fieldLabel}>Activity</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {ACTIVITIES.map(act => (
                        <TouchableOpacity
                            key={act}
                            style={[styles.chip, selectedActivity === act && styles.chipActiveAlt]}
                            onPress={() => setSelectedActivity(act)}>
                            <Text style={[styles.chipText, selectedActivity === act && styles.chipTextActive]}>{act}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Caption (optional)</Text>
                <TextInput
                    style={styles.captionInput}
                    value={caption}
                    onChangeText={setCaption}
                    placeholder="e.g. Look at these beautiful butterfly paintings! 🦋"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                {images.length > 0 && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Ready to post</Text>
                        <Text style={styles.summaryLine}>📸 {images.length} photo{images.length > 1 ? 's' : ''}</Text>
                        <Text style={styles.summaryLine}>👥 {selectedClass || 'All classes'} parents will be notified</Text>
                        <Text style={styles.summaryLine}>🎨 Activity: {selectedActivity}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.postBtn, (images.length === 0 || posting) && styles.postBtnDisabled]}
                    onPress={handlePost}
                    disabled={images.length === 0 || posting}>
                    {posting
                        ? <ActivityIndicator color="#0f172a" />
                        : <><Send size={18} color="#0f172a" /><Text style={styles.postBtnText}>Post to Parents</Text></>
                    }
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    content: { padding: 20, paddingBottom: 100 },

    uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    uploadBtn: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20,
        alignItems: 'center', gap: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#3b82f6',
        shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4,
    },
    uploadBtnText: { fontSize: 13, fontWeight: '700', color: '#3b82f6', textAlign: 'center' },

    previewSection: { marginBottom: 24 },
    previewLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    thumbWrapper: { width: THUMB, height: THUMB, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    thumb: { width: '100%', height: '100%' },
    removeBtn: {
        position: 'absolute', top: 4, right: 4,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    },
    addMoreThumb: {
        width: THUMB, height: THUMB, borderRadius: 12,
        backgroundColor: '#f1f5f9', borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    addMoreText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 10 },
    chipScroll: { marginBottom: 20, flexGrow: 0 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    chipActiveAlt: { backgroundColor: '#f5f3ff', borderColor: '#8b5cf6' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    chipTextActive: { color: '#0f172a', fontWeight: '700' },

    captionInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a', minHeight: 90, marginBottom: 20 },

    summaryCard: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#22c55e' },
    summaryTitle: { fontSize: 14, fontWeight: '800', color: '#16a34a', marginBottom: 8 },
    summaryLine: { fontSize: 13, color: '#166534', marginBottom: 4 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    postBtn: {
        backgroundColor: '#20e1d0', padding: 16, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    postBtnDisabled: { opacity: 0.5 },
    postBtnText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

    successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    successTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
    successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', maxWidth: 260 },
});
