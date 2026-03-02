import { Platform } from 'react-native';

/**
 * API base URL for the Aurralis Next.js backend.
 *
 * Set EXPO_PUBLIC_API_URL in your .env file:
 *   Development (physical device): EXPO_PUBLIC_API_URL=http://192.168.1.x:3000
 *   Production:                    EXPO_PUBLIC_API_URL=https://your-domain.com
 *
 * Simulator/emulator fallbacks are used only when the env var is not set.
 */
const DEV_FALLBACK =
    Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'   // Android emulator → host machine
        : 'http://localhost:3000';  // iOS simulator

export const API_BASE: string = process.env.EXPO_PUBLIC_API_URL ?? DEV_FALLBACK;

export const ENDPOINTS = {
    mobileLogin: `${API_BASE}/api/mobile/auth/login`,
    teacherLogin: `${API_BASE}/api/mobile/teacher/login`,
    teacherClasses: (userId: string) => `${API_BASE}/api/mobile/teacher/classes?userId=${userId}`,
    teacherAttendance: `${API_BASE}/api/mobile/teacher/attendance`,
    teacherAttendanceGet: (classId: string) => `${API_BASE}/api/mobile/teacher/attendance?classId=${classId}`,
    teacherEvents: `${API_BASE}/api/events`,
    teacherUpload: `${API_BASE}/api/upload`,
    parentProfile: (studentId: string) =>
        `${API_BASE}/api/mobile/parent/profile?studentId=${studentId}`,
    parentAttendance: (studentId: string) =>
        `${API_BASE}/api/mobile/parent/attendance?studentId=${studentId}`,
    parentFees: (studentId: string) =>
        `${API_BASE}/api/mobile/parent/fees?studentId=${studentId}`,
    parentPhotos: (studentId: string) =>
        `${API_BASE}/api/mobile/parent/photos?studentId=${studentId}`,
    events: `${API_BASE}/api/mobile/events`,
    changePassword: `${API_BASE}/api/mobile/parent/change-password`,
    avatarUpload: `${API_BASE}/api/mobile/parent/avatar`,
    forgotPassword: `${API_BASE}/api/mobile/auth/forgot-password`,
};
