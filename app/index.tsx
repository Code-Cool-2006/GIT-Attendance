import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getAuthState } from '@/utils/auth-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const status = await getAuthState();
      console.log('🔐 [Gatekeeper] Login status:', status);
      setIsLoggedIn(status);
    } catch (e) {
      console.error('Error checking login status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? "/(tabs)/dashboard" : "/login"} />;
}
