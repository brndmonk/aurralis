import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Home, BookOpen, Plus, Images, User } from 'lucide-react-native';
import { BRAND } from '@/constants/Brand';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.purple,
        tabBarInactiveTintColor: BRAND.muted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: BRAND.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: BRAND.white,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={{
              position: 'absolute',
              top: -15,
              backgroundColor: BRAND.purple,
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: BRAND.purple,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 5
            }}>
              <Plus size={32} color="#ffffff" strokeWidth={3} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color }) => <Images size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      {/* Hide unused screens from tab bar */}
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
