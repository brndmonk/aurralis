/**
 * PhotoViewer — Full-featured fullscreen photo viewer
 * Features:
 *  • Swipe left/right to change image (FlatList pagingEnabled)
 *  • Dot indicators + "N / total" counter
 *  • Like button (per-image)
 *  • Save to device (expo-media-library)
 *  • Share (expo-sharing)
 *  • Download with progress
 *  • Close button
 */
import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Modal, FlatList, Image, TouchableOpacity,
    Dimensions, Alert, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { X, Heart, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export type PhotoPost = {
    id: string;
    date: string;
    activity: string;
    class: string;
    caption?: string;
    images: string[];
    teacher: string;
    likes: number;
};

type Props = {
    post: PhotoPost | null;
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
    /** Optional: called when user likes/unlikes from viewer */
    onLike?: (postId: string, liked: boolean) => void;
};

export default function PhotoViewer({ post, initialIndex = 0, visible, onClose, onLike }: Props) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [liked, setLiked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sharing, setSharing] = useState(false);
    const listRef = useRef<FlatList>(null);

    const images = post?.images ?? [];

    // Scroll to initialIndex when opened
    const handleOpen = useCallback(() => {
        setCurrentIndex(initialIndex);
        setLiked(false);
        setTimeout(() => {
            listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
        }, 50);
    }, [initialIndex]);

    // ── Save to device ─────────────────────────────────────────────────────
    const handleSave = async () => {
        const uri = images[currentIndex];
        if (!uri) return;
        setSaving(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow access to save photos.');
                return;
            }
            // Download first (for remote URLs)
            const localUri = FileSystem.cacheDirectory + `photo_${Date.now()}.jpg`;
            await FileSystem.downloadAsync(uri, localUri);
            await MediaLibrary.saveToLibraryAsync(localUri);
            Alert.alert('Saved! ✓', 'Photo saved to your device gallery.');
        } catch (e) {
            Alert.alert('Error', 'Could not save the photo. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Share ──────────────────────────────────────────────────────────────
    const handleShare = async () => {
        const uri = images[currentIndex];
        if (!uri) return;
        setSharing(true);
        try {
            const available = await Sharing.isAvailableAsync();
            if (!available) { Alert.alert('Sharing unavailable on this device'); return; }
            const localUri = FileSystem.cacheDirectory + `share_${Date.now()}.jpg`;
            await FileSystem.downloadAsync(uri, localUri);
            await Sharing.shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: post?.activity ?? 'Class Photo' });
        } catch (e) {
            Alert.alert('Error', 'Could not share the photo. Please try again.');
        } finally {
            setSharing(false);
        }
    };

    // ── Like ───────────────────────────────────────────────────────────────
    const handleLike = () => {
        const next = !liked;
        setLiked(next);
        onLike?.(post?.id ?? '', next);
    };

    // ── Dot Indicator ──────────────────────────────────────────────────────
    const Dots = () => (
        <View style={styles.dotsRow}>
            {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
        </View>
    );

    if (!post) return null;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            statusBarTranslucent
            onShow={handleOpen}
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>

                {/* ── Top Bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.topBtn} onPress={onClose}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.topCenter}>
                        <Text style={styles.topActivity}>{post.activity}</Text>
                        <Text style={styles.topMeta}>{post.class} · {post.date}</Text>
                    </View>

                    <View style={[styles.topBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20 }]}>
                        <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
                    </View>
                </View>

                {/* ── Image Swipe List ── */}
                <FlatList
                    ref={listRef}
                    data={images}
                    keyExtractor={(_, i) => String(i)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    onMomentumScrollEnd={e => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                        setCurrentIndex(idx);
                    }}
                    renderItem={({ item }) => (
                        <View style={styles.page}>
                            <Image
                                source={{ uri: item }}
                                style={styles.fullImg}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                />

                {/* ── Prev / Next Arrows ── */}
                {images.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <TouchableOpacity
                                style={[styles.arrow, styles.arrowLeft]}
                                onPress={() => {
                                    const next = currentIndex - 1;
                                    listRef.current?.scrollToIndex({ index: next, animated: true });
                                    setCurrentIndex(next);
                                }}>
                                <ChevronLeft size={28} color="#fff" />
                            </TouchableOpacity>
                        )}
                        {currentIndex < images.length - 1 && (
                            <TouchableOpacity
                                style={[styles.arrow, styles.arrowRight]}
                                onPress={() => {
                                    const next = currentIndex + 1;
                                    listRef.current?.scrollToIndex({ index: next, animated: true });
                                    setCurrentIndex(next);
                                }}>
                                <ChevronRight size={28} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* ── Dots ── */}
                {images.length > 1 && <Dots />}

                {/* ── Caption ── */}
                {post.caption ? (
                    <View style={styles.captionBar}>
                        <Text style={styles.captionText} numberOfLines={2}>{post.caption}</Text>
                        <Text style={styles.captionTeacher}>— {post.teacher}</Text>
                    </View>
                ) : null}

                {/* ── Bottom Action Bar ── */}
                <View style={styles.actionBar}>
                    {/* Like */}
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                        <Heart
                            size={26} strokeWidth={2}
                            color={liked ? '#ef4444' : '#fff'}
                            fill={liked ? '#ef4444' : 'transparent'}
                        />
                        <Text style={[styles.actionLabel, liked && { color: '#ef4444' }]}>
                            {liked ? post.likes + 1 : post.likes}
                        </Text>
                    </TouchableOpacity>

                    {/* Save */}
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving}>
                        {saving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Download size={26} color="#fff" strokeWidth={2} />
                        }
                        <Text style={styles.actionLabel}>Save</Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={sharing}>
                        {sharing
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Share2 size={26} color="#fff" strokeWidth={2} />
                        }
                        <Text style={styles.actionLabel}>Share</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    topCenter: { flex: 1, alignItems: 'center' },
    topActivity: { fontSize: 14, fontWeight: '700', color: '#fff' },
    topMeta: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    counterText: { fontSize: 12, fontWeight: '700', color: '#fff', paddingHorizontal: 8, paddingVertical: 4 },

    page: { width, height, justifyContent: 'center', alignItems: 'center' },
    fullImg: { width, height: height * 0.72 },

    arrow: {
        position: 'absolute', top: '50%', marginTop: -24, zIndex: 10,
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    arrowLeft: { left: 12 },
    arrowRight: { right: 12 },

    dotsRow: {
        position: 'absolute', bottom: 160, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
    dotActive: { width: 20, backgroundColor: '#fff' },

    captionBar: {
        position: 'absolute', bottom: 112, left: 0, right: 0,
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    captionText: { fontSize: 13, color: '#fff', lineHeight: 19 },
    captionTeacher: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontStyle: 'italic' },

    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    },
    actionBtn: { alignItems: 'center', gap: 6, minWidth: 64 },
    actionLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
});
