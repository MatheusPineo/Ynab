import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Sparkles, ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/useAuthStore";
import Svg, { Path } from "react-native-svg";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuthStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async () => {
    if (!email || !password || (isRegister && !name)) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // CADASTRO DE NOVA CONTA
        await register(email, password, name);
        Alert.alert("Sucesso", "Sua conta foi criada com sucesso!");
        router.replace("/(tabs)");
      } else {
        // LOGIN CONVENCIONAL
        const res = await login(email, password);
        if (res.twoFactorRequired) {
          Alert.alert("Atenção", "Autenticação 2FA necessária (não implementada nesta demo).");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error: any) {
      Alert.alert(isRegister ? "Erro de Cadastro" : "Erro de Autenticação", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      Alert.alert("Google Login", "Conectado via Google com sucesso!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Erro Google", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="items-center mt-12 mb-8">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow mb-4">
              <Sparkles size={32} color="#0D1117" strokeWidth={2.5} />
            </View>
            <Text className="text-4xl font-black tracking-tighter text-foreground">
              Vault
            </Text>
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-[0.4em] mt-1">
              Finance OS
            </Text>
          </View>

          {/* Card-like Form */}
          <View className="bg-card/50 border border-border/40 p-6 rounded-[32px] shadow-2xl">
            <Text className="text-2xl font-bold text-foreground mb-2">
              {isRegister ? "Criar sua Conta" : "Bem-vindo"}
            </Text>
            <Text className="text-muted-foreground text-sm mb-6 leading-normal">
              {isRegister 
                ? "Registre-se hoje mesmo para automatizar seus faturamentos e planejar metas."
                : "Insira suas credenciais para continuar sua jornada financeira."}
            </Text>

            {/* Name Field (Only in Register mode) */}
            {isRegister && (
              <View className="mb-4">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  Nome Completo
                </Text>
                <View className="flex-row items-center bg-muted/20 border border-border/30 rounded-2xl px-4 h-14">
                  <UserIcon size={20} color="#94A3B8" />
                  <TextInput
                    className="flex-1 text-foreground ml-3 h-full"
                    placeholder="Seu Nome"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                E-mail
              </Text>
              <View className="flex-row items-center bg-muted/20 border border-border/30 rounded-2xl px-4 h-14">
                <Mail size={20} color="#94A3B8" />
                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="seu@email.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2 ml-1">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  Senha
                </Text>
                {!isRegister && (
                  <TouchableOpacity>
                    <Text className="text-primary text-xs font-bold">Esqueceu?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row items-center bg-muted/20 border border-border/30 rounded-2xl px-4 h-14">
                <Lock size={20} color="#94A3B8" />
                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#94A3B8" />
                  ) : (
                    <Eye size={20} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAuthAction}
              disabled={loading}
              className="bg-primary h-14 rounded-2xl flex-row items-center justify-center shadow-glow mb-4"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0D1117" />
              ) : (
                <>
                  <Text className="text-primary-foreground font-black text-base mr-2">
                    {isRegister ? "Cadastrar Conta" : "Entrar"}
                  </Text>
                  <ArrowRight size={20} color="#0D1117" strokeWidth={3} />
                </>
              )}
            </TouchableOpacity>

            {/* Social Login Separator */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-[1px] bg-border/20" />
              <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest px-3">
                ou continue com
              </Text>
              <View className="flex-1 h-[1px] bg-border/20" />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              className="bg-card border border-border/40 h-14 rounded-2xl flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" className="mr-3">
                <Path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.14 1.14 2.97-.85 1.14-1.95 2.1-3.23 2.8v2.33h5.2c3.04-2.8 4.79-6.93 4.79-11.95z"
                />
                <Path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-5.2-4.03c-1.44.97-3.29 1.55-5.11 1.55-3.52 0-6.5-2.38-7.56-5.58H1.34v4.2A11.98 11.98 0 0 0 12 24z"
                />
                <Path
                  fill="#FBBC05"
                  d="M4.44 12.03A7.18 7.18 0 0 1 4 10c0-.7.12-1.39.34-2.03V3.77H1.34A11.97 11.97 0 0 0 0 10c0 2.27.63 4.4 1.74 6.23l2.7-4.2z"
                />
                <Path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.3 0 3.25 2.68 1.34 6.6l3.1 4.8c1.06-3.2 4.04-5.58 7.56-5.58z"
                />
              </Svg>
              <Text className="text-foreground font-bold text-sm">
                Conectar com o Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer toggling login vs register */}
          <View className="flex-row justify-center mt-6 pb-8">
            <Text className="text-muted-foreground text-sm">
              {isRegister ? "Já possui uma conta?" : "Não tem uma conta?"}{" "}
            </Text>
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text className="text-primary font-bold text-sm">
                {isRegister ? "Entrar agora" : "Criar agora"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
