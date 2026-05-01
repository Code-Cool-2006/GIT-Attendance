import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace('/(tabs)');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="school" size={40} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
          </View>
          <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Academic Admin Hub</ThemedText>
        </View>

        <ThemedView style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <ThemedText style={[styles.cardTitle, { fontFamily: Fonts.semiBold }]}>Administrator Login</ThemedText>
          <ThemedText style={styles.cardSubtitle}>Enter your credentials to access the portal</ThemedText>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={themeColors.error} />
              <ThemedText style={[styles.errorText, { color: themeColors.error }]}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { fontFamily: Fonts.semiBold }]}>Email or Username</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColors.background, 
                  color: themeColors.text, 
                  borderColor: themeColors.border,
                  fontFamily: Fonts.sans 
                }
              ]}
              placeholder="admin@institution.edu"
              placeholderTextColor={themeColors.secondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { fontFamily: Fonts.semiBold }]}>Password</ThemedText>
              <TouchableOpacity onPress={() => alert('Forgot Password pressed')}>
                <ThemedText style={[styles.forgotLink, { color: themeColors.tertiary }]}>Forgot Password?</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { 
                    backgroundColor: themeColors.background, 
                    color: themeColors.text, 
                    borderColor: themeColors.border,
                    fontFamily: Fonts.sans 
                  }
                ]}
                placeholder="••••••••"
                placeholderTextColor={themeColors.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={themeColors.secondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: themeColors.primary, opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ThemedText style={[styles.loginButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                Verifying...
              </ThemedText>
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} style={styles.buttonIcon} />
                <ThemedText style={[styles.loginButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                  Secure Login
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ThemedView>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color={themeColors.secondary} />
          <ThemedText style={[styles.footerText, { color: themeColors.secondary }]}>
            Protected by Secure-Auth
          </ThemedText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
