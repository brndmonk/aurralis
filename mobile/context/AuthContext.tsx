import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

export interface SessionUser {
    studentId?: string;
    userId?: string;        // teacher's User.id
    name: string;
    email: string;
    phone?: string;
    role: 'parent' | 'teacher';
    // parent-specific
    childName?: string;
    childClass?: string;
    childEnrollmentId?: string;
    childGender?: string | null;
    childDob?: string | null;
    attendanceRate?: number;
    pendingFees?: number;
    teacherName?: string;
    teacherPhone?: string | null;
    teacherEmail?: string | null;
    // teacher-specific
    classId?: string | null;
    className?: string | null;
    classes?: { id: string; name: string; section: string | null; displayName: string; studentCount: number }[];
}

interface AuthContextType {
    login: (authData: SessionUser) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (partial: Partial<SessionUser>) => Promise<void>;
    user: SessionUser | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function useProtectedRoute(user: SessionUser | null, isLoading: boolean) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        SecureStore.getItemAsync('user-session').then(sess => {
            if (sess) {
                try {
                    setUser(JSON.parse(sess));
                } catch {
                    // corrupted — ignore
                }
            }
            setIsLoading(false);
        });
    }, []);

    useProtectedRoute(user, isLoading);

    const login = async (authData: SessionUser) => {
        setUser(authData);
        await SecureStore.setItemAsync('user-session', JSON.stringify(authData));
    };

    const logout = async () => {
        setUser(null);
        await SecureStore.deleteItemAsync('user-session');
    };

    const updateUser = async (partial: Partial<SessionUser>) => {
        if (!user) return;
        const updated = { ...user, ...partial };
        setUser(updated);
        await SecureStore.setItemAsync('user-session', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ login, logout, updateUser, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
