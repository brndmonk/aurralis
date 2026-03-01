/**
 * Role-aware Home screen.
 * Shows TeacherDashboard or ParentDashboard based on user.role.
 * The TeacherDashboard content lives inline (already built).
 * The ParentDashboard content navigates to /parent/dashboard.
 */
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Teacher Dashboard content is the main index.tsx content — we keep it there.
// For Parents, we redirect them to the parent dashboard immediately.
import TeacherHome from '@/components/TeacherHome';
import ParentHome from '@/components/ParentHome';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#20e1d0" />
      </View>
    );
  }

  if (user?.role === 'parent') {
    return <ParentHome />;
  }

  return <TeacherHome />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
});
