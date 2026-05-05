import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { useAccountStore } from "../../store/useAccountStore";
import { useTransactionsStore } from "../../store/useTransactionsStore";
import { useGoalStore, Goal } from "../../store/useGoalStore";
import { useSecurityStore } from "../../store/useSecurityStore";
import {
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Plus,
  Trash2,
  X,
  Check,
  TrendingUp,
  Fingerprint,
} from "lucide-react-native";
import FlowChart from "../../components/dashboard/FlowChart";

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { tree, fetchAccounts } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionsStore();
  const { goals, isLoading, fetchGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  
  // Security config connection
  const { isBiometricEnabled, setBiometricEnabled, hasHardware, isEnrolled } = useSecurityStore();

  // Create Goal Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [deadline, setDeadline] = useState("");

  // Quick contribution Modal State
  const [contribModalVisible, setContribModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchGoals();
  }, []);

  // Compute dynamic totals from accounts tree
  const totalAssets = useMemo(() => {
    return tree
      .filter((n) => n.account_type === "checking" || n.account_type === "savings" || n.account_type === "investment")
      .reduce((sum, n) => sum + n.balance, 0);
  }, [tree]);

  const totalLiabilities = useMemo(() => {
    return tree
      .filter((n) => n.account_type === "credit" || n.account_type === "loan")
      .reduce((sum, n) => sum + n.balance, 0);
  }, [tree]);

  const netWorth = totalAssets - totalLiabilities;

  // Compute actual income and expenses from transactions list
  const totalsFromTransactions = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    transactions.forEach((t) => {
      if (t.type === "income") {
        incomeSum += t.amount;
      } else {
        expenseSum += t.amount;
      }
    });
    return { incomeSum, expenseSum };
  }, [transactions]);

  const handleToggleBiometrics = async () => {
    if (!hasHardware) {
      Alert.alert("Biometria Indisponível", "Este dispositivo não possui suporte a hardware de autenticação.");
      return;
    }
    if (!isEnrolled) {
      Alert.alert("Biometria Não Cadastrada", "Nenhuma impressão digital ou reconhecimento facial cadastrado no aparelho.");
      return;
    }

    try {
      const nextValue = !isBiometricEnabled;
      await setBiometricEnabled(nextValue);
      Alert.alert(
        "Segurança",
        nextValue ? "Bloqueio por biometria ativado com sucesso!" : "Bloqueio biométrico desativado."
      );
    } catch (err) {
      Alert.alert("Erro", "Erro ao alterar configuração.");
    }
  };

  const handleOpenCreateGoalModal = () => {
    setEditingId(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setEmoji("🎯");
    setDeadline("");
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!name || !targetAmount) {
      Alert.alert("Erro", "Por favor, insira o nome e a meta financeira.");
      return;
    }

    const target = parseFloat(targetAmount.replace(",", "."));
    const current = parseFloat((currentAmount || "0").replace(",", "."));

    if (isNaN(target) || target <= 0) {
      Alert.alert("Erro", "Meta financeira inválida.");
      return;
    }

    try {
      if (editingId) {
        await updateGoal(editingId, {
          name,
          target_amount: target,
          current_amount: current,
          emoji,
          deadline: deadline || null,
        });
        Alert.alert("Sucesso", "Meta atualizada!");
      } else {
        await addGoal({
          name,
          target_amount: target,
          current_amount: current,
          currency: "BRL",
          emoji,
          deadline: deadline || null,
        });
        Alert.alert("Sucesso", "Meta criada!");
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const handleOpenContribModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setContribAmount("");
    setContribModalVisible(true);
  };

  const handleSaveContribution = async () => {
    if (!selectedGoal || !contribAmount) return;

    const contrib = parseFloat(contribAmount.replace(",", "."));
    if (isNaN(contrib) || contrib <= 0) {
      Alert.alert("Erro", "Valor de aporte inválido.");
      return;
    }

    const newAmount = Number(selectedGoal.current_amount) + contrib;
    try {
      await updateGoal(selectedGoal.id, { current_amount: newAmount });
      setContribModalVisible(false);
      Alert.alert("Sucesso", `Aporte de R$ ${contrib.toFixed(2)} registrado!`);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const handleDeleteGoal = (id: string, goalName: string) => {
    Alert.alert("Excluir Meta", `Tem certeza que deseja excluir a meta "${goalName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoal(id);
            Alert.alert("Sucesso", "Meta excluída.");
          } catch (error: any) {
            Alert.alert("Erro", error.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-muted-foreground text-sm uppercase tracking-wider font-bold">
              Visão Geral
            </Text>
            <Text className="text-foreground text-2xl font-black mt-1">
              Olá, {user?.name?.split(" ")[0] || "Usuário"}
            </Text>
          </View>
          <View className="flex-row gap-x-2.5">
            {/* Biometrics configuration toggle */}
            <TouchableOpacity
              onPress={handleToggleBiometrics}
              className={`p-3 rounded-xl border ${
                isBiometricEnabled
                  ? "bg-primary/10 border-primary/20 shadow-glow"
                  : "bg-card border-border/40"
              }`}
              style={isBiometricEnabled ? { shadowColor: "#4ade80", shadowOpacity: 0.1, shadowRadius: 8 } : {}}
            >
              <Fingerprint size={20} color={isBiometricEnabled ? "#4ade80" : "#94A3B8"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={logout}
              className="bg-card p-3 rounded-xl border border-border/40"
            >
              <LogOut size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Balance Card */}
        <View className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] mb-6 shadow-glow"
              style={{ shadowColor: "#4ade80", shadowOpacity: 0.1, shadowRadius: 15 }}>
          <View className="flex-row items-center mb-2">
            <Activity size={18} color="#4ade80" className="mr-2" />
            <Text className="text-primary font-semibold text-sm">Patrimônio Líquido</Text>
          </View>
          <Text className="text-foreground text-4xl font-black tracking-tight mb-1">
            R$ {netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-muted-foreground text-xs">Atualizado em tempo real</Text>
        </View>

        {/* Mini Stats (Receita vs Despesa reais) */}
        <View className="flex-row justify-between mb-8 gap-x-4">
          <View className="flex-1 bg-card border border-border/40 p-5 rounded-[24px]">
            <View className="bg-emerald-500/10 self-start p-2 rounded-xl mb-3">
              <ArrowUpRight size={20} color="#10b981" />
            </View>
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
              Receitas (Mês)
            </Text>
            <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
              R$ {totalsFromTransactions.incomeSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View className="flex-1 bg-card border border-border/40 p-5 rounded-[24px]">
            <View className="bg-rose-500/10 self-start p-2 rounded-xl mb-3">
              <ArrowDownRight size={20} color="#f43f5e" />
            </View>
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
              Despesas (Mês)
            </Text>
            <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
              R$ {totalsFromTransactions.expenseSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Evolução do Fluxo - Gráfico */}
        <FlowChart />

        {/* --- FINANCIAL GOALS SECTION --- */}
        <View className="mb-10">
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center">
              <TrendingUp size={18} color="#4ade80" className="mr-2" />
              <Text className="text-foreground text-lg font-black uppercase tracking-wider text-xs">
                Metas de Economia
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenCreateGoalModal}
              className="bg-primary/15 border border-primary/20 px-3.5 py-2 rounded-xl flex-row items-center"
            >
              <Plus size={14} color="#4ade80" className="mr-1.5" />
              <Text className="text-primary font-bold text-xs uppercase tracking-wider">Criar Meta</Text>
            </TouchableOpacity>
          </View>

          {isLoading && goals.length === 0 ? (
            <ActivityIndicator size="small" color="#4ade80" />
          ) : goals.length === 0 ? (
            <View className="bg-card border border-border/40 p-8 rounded-[24px] items-center justify-center">
              <Text className="text-muted-foreground text-xs text-center">
                Nenhuma meta criada ainda. Defina seu primeiro objetivo financeiro!
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {goals.map((goal) => {
                const percentage = Math.min(
                  Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) || 0,
                  100
                );
                return (
                  <View
                    key={goal.id}
                    className="bg-card border border-border/30 p-5 rounded-[28px] shadow-sm relative overflow-hidden mb-4"
                  >
                    {/* Header Card Meta */}
                    <View className="flex-row justify-between items-start mb-3.5">
                      <View className="flex-row items-center flex-1 pr-4">
                        <Text className="text-2xl mr-3">{goal.emoji || "🎯"}</Text>
                        <View className="flex-1">
                          <Text className="text-foreground font-black text-sm" numberOfLines={1}>
                            {goal.name}
                          </Text>
                          <Text className="text-muted-foreground text-[10px] mt-0.5">
                            Meta: R$ {Number(goal.target_amount).toLocaleString("pt-BR")}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-x-2.5">
                        <TouchableOpacity onPress={() => handleOpenContribModal(goal)}
                                          className="bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                          <Text className="text-emerald-400 font-bold text-[10px] uppercase">Aportar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteGoal(goal.id, goal.name)}>
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="w-full h-3.5 bg-muted/25 rounded-full overflow-hidden flex-row items-center p-0.5 mb-2.5 border border-border/5">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </View>

                    {/* Footer values and percentage indicator */}
                    <View className="flex-row justify-between items-center">
                      <Text className="text-muted-foreground text-[10px] font-semibold">
                        Acumulado: R$ {Number(goal.current_amount).toLocaleString("pt-BR")}
                      </Text>
                      <Text className="text-primary font-black text-xs">{percentage}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- CREATE / EDIT GOAL MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background border-t border-border/40 rounded-t-[36px] p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-xl font-black">Nova Meta Financeira</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-card p-2 rounded-full border border-border/40"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
              {/* Name input */}
              <View>
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Nome do Objetivo
                </Text>
                <TextInput
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="Ex: Reserva, Viagem, Carro..."
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Emoji input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Emoji de Destaque
                </Text>
                <View className="flex-row gap-x-2">
                  {["🎯", "🚗", "🏠", "✈️", "💰", "🎓"].map((em) => {
                    const isSelected = emoji === em;
                    return (
                      <TouchableOpacity
                        key={em}
                        onPress={() => setEmoji(em)}
                        className={`p-3 rounded-2xl text-xl ${
                          isSelected ? "bg-primary border border-primary/20 shadow-glow" : "bg-card border border-border/20"
                        }`}
                      >
                        <Text className="text-xl">{em}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Target amount input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Valor Alvo (R$)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="0,00"
                  placeholderTextColor="#64748B"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />
              </View>

              {/* Current amount input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Saldo Inicial Acumulado
                </Text>
                <TextInput
                  keyboardType="numeric"
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="0,00"
                  placeholderTextColor="#64748B"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                />
              </View>

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleSaveGoal}
                className="bg-primary py-4 rounded-2xl flex-row items-center justify-center shadow-glow mt-8"
              >
                <Check size={18} color="#000000" className="mr-2" />
                <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">
                  Salvar Meta
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- QUICK CONTRIBUTION MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={contribModalVisible}
        onRequestClose={() => setContribModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-background border border-border/40 rounded-[32px] p-6 w-full max-w-sm">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-lg font-black">Aporte Rápido</Text>
              <TouchableOpacity
                onPress={() => setContribModalVisible(false)}
                className="bg-card p-1.5 rounded-full border border-border/40"
              >
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text className="text-muted-foreground text-xs mb-4">
              Adicione economias na meta: <Text className="text-foreground font-bold">"{selectedGoal?.name}"</Text>
            </Text>

            <TextInput
              keyboardType="numeric"
              className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-black text-center text-lg mb-6"
              placeholder="R$ 100,00"
              placeholderTextColor="#64748B"
              value={contribAmount}
              onChangeText={setContribAmount}
              autoFocus
            />

            <TouchableOpacity
              onPress={handleSaveContribution}
              className="bg-primary py-3.5 rounded-2xl flex-row items-center justify-center shadow-glow"
            >
              <Check size={16} color="#000000" className="mr-2" />
              <Text className="text-primary-foreground font-bold text-xs uppercase tracking-wider">
                Confirmar Aporte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
