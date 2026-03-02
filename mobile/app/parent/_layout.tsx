import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ParentLayout() {
    const { user } = useAuth();

    if (!user || user.role !== 'parent') {
        return <Redirect href="/(auth)/login" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
