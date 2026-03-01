/**
 * Gallery Tab
 * Both roles use the shared PhotoViewer component for full gallery features.
 *
 * Teacher view:
 *   - Upload buttons
 *   - Full post feed with image grid
 *   - Delete post / delete individual image
 *   - Tap any image → PhotoViewer (swipe + save + share + like)
 *
 * Parent view:
 *   - Class photo feed
 *   - Tap any image → PhotoViewer (swipe + save + share + like)
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Image, Alert, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Camera, Images, Heart, Trash2, X, Plus } from 'lucide-react-native';
import PhotoViewer, { type PhotoPost } from '@/components/PhotoViewer';

const { width } = Dimensions.get('window');
const GRID_ITEM = (width - 48 - 8) / 3;

// ── Shared post data ────────────────────────────────────────────────────────
const ALL_POSTS: PhotoPost[] = [
    {
        id: '1', date: 'Today · Feb 28', activity: '🎨 Art & Craft', class: 'Nursery A',
        caption: 'Beautiful butterfly paintings! Each child chose their own colours. So proud! 🦋',
        images: [
            'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
            'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
            'https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=800',
        ],
        teacher: 'Mrs. Smith', likes: 12,
    },
    {
        id: '2', date: 'Yesterday · Feb 27', activity: '🌳 Outdoor Play', class: 'Nursery A',
        caption: 'Great energy during outdoor time! The sandbox and slides were a big hit. 🛝',
        images: [
            'https://images.unsplash.com/photo-1571722288626-6f0555d7b8c7?w=800',
            'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800',
        ],
        teacher: 'Mrs. Smith', likes: 8,
    },
    {
        id: '3', date: 'Feb 26', activity: '📖 Story Time', class: 'Nursery A',
        caption: '"The Very Hungry Caterpillar" — children loved acting it out. 🐛',
        images: ['https://images.unsplash.com/photo-1529148482759-b35b25c5f217?w=800'],
        teacher: 'Mrs. Smith', likes: 15,
    },
    {
        id: '4', date: 'Feb 25', activity: '🎵 Music & Rhymes', class: 'Nursery A',
        caption: 'Practicing with instruments — future musicians! 🎶',
        images: [
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            'https://images.unsplash.com/photo-1493828152-3f6a92d80f20?w=800',
        ],
        teacher: 'Mrs. Smith', likes: 20,
    },
];

// ── Shared: image grid inside a card ────────────────────────────────────────
type GridProps = {
    images: string[];
    onTap: (index: number) => void;
    onRemove?: (index: number) => void;  // teacher only
    onAddMore?: () => void;              // teacher only
};

function ImageGrid({ images, onTap, onRemove, onAddMore }: GridProps) {
    return (
        <View style={s.imgGrid}>
            {images.map((uri, i) => (
                <View key={i} style={s.imgWrapper}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => onTap(i)}>
                        <Image source={{ uri }} style={s.img} />
                    </TouchableOpacity>
                    {onRemove && (
                        <TouchableOpacity style={s.imgDelBtn} onPress={() => onRemove(i)}>
                            <X size={11} color="#fff" strokeWidth={3} />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
            {onAddMore && (
                <TouchableOpacity style={s.addMoreBtn} onPress={onAddMore}>
                    <Plus size={22} color="#94a3b8" />
                    <Text style={s.addMoreText}>Add</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ── Teacher Gallery ─────────────────────────────────────────────────────────
function TeacherGallery() {
    const router = useRouter();
    const [posts, setPosts] = useState<PhotoPost[]>(ALL_POSTS);
    const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
    const [viewer, setViewer] = useState<{ post: PhotoPost; idx: number } | null>(null);

    const openViewer = (post: PhotoPost, idx: number) => setViewer({ post, idx });
    const closeViewer = () => setViewer(null);

    const deletePost = (id: string) =>
        Alert.alert('Delete Post', 'Remove this photo post for all parents?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => setPosts(p => p.filter(x => x.id !== id)) },
        ]);

    const deleteImage = (postId: string, imgIdx: number) =>
        Alert.alert('Remove Photo', 'Remove just this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: () => setPosts(prev => prev.map(p => {
                    if (p.id !== postId) return p;
                    const imgs = p.images.filter((_: string, i: number) => i !== imgIdx);
                    return imgs.length ? { ...p, images: imgs } : null as any;
                }).filter(Boolean)),
            },
        ]);

    const handleLike = (postId: string, liked: boolean) =>
        setLikedMap(m => ({ ...m, [postId]: liked }));

    const totalPhotos = posts.reduce((a, p) => a + p.images.length, 0);

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Photo Gallery</Text>
                <Text style={s.headerSub}>{posts.length} posts · {totalPhotos} photos</Text>
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {/* Upload Strip */}
                <View style={s.uploadStrip}>
                    <TouchableOpacity style={s.uploadBtn} onPress={() => router.push('/teacher/photo-upload')}>
                        <Camera size={20} color="#fff" />
                        <Text style={s.uploadTxt}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.uploadBtn, { backgroundColor: '#8b5cf6' }]} onPress={() => router.push('/teacher/photo-upload')}>
                        <Images size={20} color="#fff" />
                        <Text style={s.uploadTxt}>Upload</Text>
                    </TouchableOpacity>
                </View>

                {posts.length === 0 && (
                    <View style={s.empty}>
                        <Images size={52} color="#cbd5e1" />
                        <Text style={s.emptyTitle}>No Photos Yet</Text>
                        <Text style={s.emptySub}>Upload photos to share moments with parents.</Text>
                    </View>
                )}

                {posts.map(post => (
                    <View key={post.id} style={s.postCard}>
                        <View style={s.cardHeader}>
                            <View style={s.cardHeaderLeft}>
                                <Text style={s.cardActivity}>{post.activity}</Text>
                                <Text style={s.cardMeta}>{post.class} · {post.date}</Text>
                            </View>
                            <TouchableOpacity style={s.deleteBtn} onPress={() => deletePost(post.id)}>
                                <Trash2 size={14} color="#ef4444" />
                                <Text style={s.deleteTxt}>Delete</Text>
                            </TouchableOpacity>
                        </View>

                        {post.caption ? <Text style={s.caption}>{post.caption}</Text> : null}

                        <ImageGrid
                            images={post.images}
                            onTap={i => openViewer(post, i)}
                            onRemove={i => deleteImage(post.id, i)}
                            onAddMore={() => router.push('/teacher/photo-upload')}
                        />

                        <View style={s.cardFooter}>
                            <TouchableOpacity style={s.footerLike} onPress={() => setLikedMap(m => ({ ...m, [post.id]: !m[post.id] }))}>
                                <Heart size={16} color={likedMap[post.id] ? '#ef4444' : '#94a3b8'} fill={likedMap[post.id] ? '#ef4444' : 'transparent'} />
                                <Text style={[s.footerTxt, likedMap[post.id] && { color: '#ef4444' }]}>
                                    {post.likes + (likedMap[post.id] ? 1 : 0)} likes
                                </Text>
                            </TouchableOpacity>
                            <Text style={s.footerTxt}>{post.images.length} photo{post.images.length !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <PhotoViewer
                post={viewer?.post ?? null}
                initialIndex={viewer?.idx ?? 0}
                visible={!!viewer}
                onClose={closeViewer}
                onLike={handleLike}
            />
        </SafeAreaView>
    );
}

// ── Parent Gallery ──────────────────────────────────────────────────────────
function ParentGallery() {
    const [posts] = useState<PhotoPost[]>(ALL_POSTS);
    const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
    const [viewer, setViewer] = useState<{ post: PhotoPost; idx: number } | null>(null);

    const handleLike = (postId: string, liked: boolean) =>
        setLikedMap(m => ({ ...m, [postId]: liked }));

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Class Photos</Text>
                <Text style={s.headerSub}>Nursery A · Aarav's class</Text>
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {posts.map(post => (
                    <View key={post.id} style={s.postCard}>
                        <View style={s.cardHeader}>
                            <Image source={{ uri: 'https://i.pravatar.cc/150?u=teacher1' }} style={s.teacherAvatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.cardActivity}>{post.activity}</Text>
                                <Text style={s.cardMeta}>{post.teacher} · {post.date}</Text>
                            </View>
                            <View style={s.classPill}>
                                <Text style={s.classPillTxt}>{post.class}</Text>
                            </View>
                        </View>

                        {post.caption ? <Text style={s.caption}>{post.caption}</Text> : null}

                        <ImageGrid
                            images={post.images}
                            onTap={i => setViewer({ post, idx: i })}
                        />

                        <View style={s.cardFooter}>
                            <TouchableOpacity style={s.footerLike} onPress={() => setLikedMap(m => ({ ...m, [post.id]: !m[post.id] }))}>
                                <Heart size={16} color={likedMap[post.id] ? '#ef4444' : '#94a3b8'} fill={likedMap[post.id] ? '#ef4444' : 'transparent'} />
                                <Text style={[s.footerTxt, likedMap[post.id] && { color: '#ef4444' }]}>
                                    {post.likes + (likedMap[post.id] ? 1 : 0)} likes
                                </Text>
                            </TouchableOpacity>
                            <Text style={s.footerTxt}>{post.images.length} photo{post.images.length !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <PhotoViewer
                post={viewer?.post ?? null}
                initialIndex={viewer?.idx ?? 0}
                visible={!!viewer}
                onClose={() => setViewer(null)}
                onLike={handleLike}
            />
        </SafeAreaView>
    );
}

// ── Export ──────────────────────────────────────────────────────────────────
export default function GalleryTab() {
    const { user } = useAuth();
    return user?.role === 'parent' ? <ParentGallery /> : <TeacherGallery />;
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },

    header: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

    content: { padding: 16, paddingBottom: 48 },

    // Upload
    uploadStrip: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    uploadBtn: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    uploadTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#94a3b8' },
    emptySub: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', maxWidth: 240 },

    // Post Card
    postCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    cardHeaderLeft: { flex: 1 },
    cardActivity: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
    cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    deleteTxt: { fontSize: 12, fontWeight: '700', color: '#ef4444' },

    caption: { fontSize: 13, color: '#475569', lineHeight: 19, paddingHorizontal: 14, paddingBottom: 12 },

    // Image Grid
    imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
    imgWrapper: { position: 'relative' },
    img: { width: GRID_ITEM, height: GRID_ITEM, borderRadius: 10 },
    imgDelBtn: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    addMoreBtn: { width: GRID_ITEM, height: GRID_ITEM, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', gap: 4 },
    addMoreText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

    // Footer
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6 },
    footerLike: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerTxt: { fontSize: 12, color: '#94a3b8' },

    // Parent card header extras
    teacherAvatar: { width: 36, height: 36, borderRadius: 18 },
    classPill: { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    classPillTxt: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
});
