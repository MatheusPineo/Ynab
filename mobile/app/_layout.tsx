import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useSecurityStore } from "../store/useSecurityStore";
import { useAuthStore } from "../store/useAuthStore";
import { Fingerprint, Lock } from "lucide-react-native";
import "../global.css";

export default function RootLayout() {
  const {
    isBiometricEnabled,
    isUnlocked,
    isLoading,
    initSecurity,
    authenticate,
  } = useSecurityStore();

  const { isAuthenticated } = useAuthStore();

  // Initialize biometric configuration on app start
  useEffect(() => {
    initSecurity();
  }, []);

  // Trigger biometric prompt automatically on app launch/resume if enabled and locked
  useEffect(() => {
    if (isAuthenticated && isBiometricEnabled && !isUnlocked && !isLoading) {
      authenticate();
    }
  }, [isAuthenticated, isBiometricEnabled, isUnlocked, isLoading]);

  // Show generic loader while loading keys
  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  // RENDER GLOBAL BIOMETRIC LOCK SCREEN
  if (isAuthenticated && isBiometricEnabled && !isUnlocked) {
    return (
      <View className="flex-1 bg-background justify-between px-6 py-16 items-center">
        <StatusBar style="light" />
        
        {/* Top Empty spacing / brand */}
        <View className="items-center mt-12">
          <Text className="text-primary font-black tracking-[4px] uppercase text-xs">VAULT FINANCE OS</Text>
        </View>

        {/* Center lock visual */}
        <View className="items-center space-y-6">
          <View
            className="bg-primary/10 p-8 rounded-full border border-primary/20 shadow-glow mb-6"
            style={{ shadowColor: "#4ade80", shadowRadius: 20, shadowOpacity: 0.15 }}
          >
            <Fingerprint size={72} color="#4ade80" />
          </View>
          <Text className="text-foreground text-2xl font-black text-center">Aplicativo Bloqueado</Text>
          <Text className="text-muted-foreground text-sm text-center px-6 leading-relaxed">
            Utilize a biometria cadastrada (FaceID, TouchID ou Senha) para acessar seu painel financeiro.
          </Text>
        </View>

        {/* Bottom unlock triggers */}
        <View className="w-full space-y-4">
          <TouchableOpacity
            onPress={() => authenticate()}
            className="w-full bg-primary py-4.5 rounded-[22px] flex-row items-center justify-center shadow-glow"
          >
            <Lock size={18} color="#000000" className="mr-2" />
            <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">
              Desbloquear App
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#121417" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
