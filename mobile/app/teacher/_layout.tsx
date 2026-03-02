import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function TeacherLayout() {
    const { user } = useAuth();

    if (!user || user.role !== 'teacher') {
        return <Redirect href="/(auth)/login" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
