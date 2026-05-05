import React, { useState, useMemo, useEffect } from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Plus,
  X,
  Check,
  Calendar,
} from "lucide-react-native";
import {
  Platform,
  View,
  TouchableOpacity,
  Modal,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useAccountStore } from "../../store/useAccountStore";
import { useBudgetStore } from "../../store/useBudgetStore";
import { useTransactionsStore } from "../../store/useTransactionsStore";

export default function TabLayout() {
  const { tree, fetchAccounts } = useAccountStore();
  const { categoryGroups, fetchCategoryGroups } = useBudgetStore();
  const { addTransaction, addTransfer, loadOfflineQueue } = useTransactionsStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"transaction" | "transfer">("transaction");

  // Load offline queue and data on mount
  useEffect(() => {
    loadOfflineQueue();
    fetchAccounts();
    const now = new Date();
    fetchCategoryGroups(now.getMonth() + 1, now.getFullYear());
  }, [modalVisible]);

  // Flatten accounts tree
  const flatAccounts = useMemo(() => {
    const list: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        list.push(node);
        if (node.children && node.children.length > 0) {
          walk(node.children);
        }
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  // Flatten categories
  const leafCategories = useMemo(() => {
    const list: any[] = [];
    categoryGroups.forEach((group) => {
      if (group.children && group.children.length > 0) {
        group.children.forEach((child) => {
          list.push({ id: child.id, name: `${group.name} > ${child.name}` });
        });
      }
    });
    return list;
  }, [categoryGroups]);

  // Form states - Transaction
  const [isIncome, setIsIncome] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [status, setStatus] = useState<"realized" | "pending">("realized");

  // Form states - Transfer
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);

  const handleCreateTransaction = async () => {
    if (!description || !amount || !selectedAccountId) {
      Alert.alert("Erro", "Preencha a descrição, valor e selecione uma conta.");
      return;
    }

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Erro", "Valor de transação inválido.");
      return;
    }

    try {
      await addTransaction({
        description,
        amount: numericAmount,
        is_income: isIncome,
        date,
        account: selectedAccountId,
        category: isIncome ? null : selectedCategoryId || null,
        status,
      });

      // Sincronizar saldos das contas
      await fetchAccounts();

      Alert.alert("Sucesso", "Transação adicionada com sucesso!");
      setModalVisible(false);
      resetForms();
    } catch (error: any) {
      if (error.message === "offline_saved") {
        Alert.alert(
          "Modo Offline Ativo",
          "Sem conexão com a internet. O seu lançamento foi salvo localmente no dispositivo e será sincronizado de forma totalmente automática assim que a conexão retornar!"
        );
        setModalVisible(false);
        resetForms();
      } else {
        Alert.alert("Erro", error.message);
      }
    }
  };

  const handleCreateTransfer = async () => {
    if (!fromAccountId || !toAccountId || !transferAmount) {
      Alert.alert("Erro", "Selecione as contas de origem, destino e informe o valor.");
      return;
    }

    if (fromAccountId === toAccountId) {
      Alert.alert("Erro", "A conta de origem e destino não podem ser as mesmas.");
      return;
    }

    const numericAmount = parseFloat(transferAmount.replace(",", "."));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Erro", "Valor de transferência inválido.");
      return;
    }

    try {
      await addTransfer({
        from_account: fromAccountId,
        to_account: toAccountId,
        amount: numericAmount,
        description: transferDescription || "Transferência entre contas",
        date: transferDate,
      });

      // Sincronizar saldos das contas
      await fetchAccounts();

      Alert.alert("Sucesso", "Transferência realizada com sucesso!");
      setModalVisible(false);
      resetForms();
    } catch (error: any) {
      if (error.message === "offline_saved") {
        Alert.alert(
          "Modo Offline Ativo",
          "Sem conexão com a internet. A sua transferência foi salva localmente no dispositivo e será sincronizada de forma totalmente automática assim que a conexão retornar!"
        );
        setModalVisible(false);
        resetForms();
      } else {
        Alert.alert("Erro", error.message);
      }
    }
  };

  const resetForms = () => {
    setDescription("");
    setAmount("");
    setSelectedAccountId("");
    setSelectedCategoryId("");
    setIsIncome(false);
    setStatus("realized");

    setFromAccountId("");
    setToAccountId("");
    setTransferAmount("");
    setTransferDescription("");
  };

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#121417",
            borderTopColor: "#1E222B",
            height: Platform.OS === "ios" ? 88 : 68,
            paddingBottom: Platform.OS === "ios" ? 28 : 12,
            paddingTop: 12,
          },
          tabBarActiveTintColor: "#4ade80",
          tabBarInactiveTintColor: "#94a3b8",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <View className={`items-center justify-center p-1.5 rounded-xl ${focused ? "bg-primary/20" : ""}`}>
                <LayoutDashboard size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Contas",
            tabBarIcon: ({ color, focused }) => (
              <View className={`items-center justify-center p-1.5 rounded-xl ${focused ? "bg-primary/20" : ""}`}>
                <Wallet size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transações",
            tabBarIcon: ({ color, focused }) => (
              <View className={`items-center justify-center p-1.5 rounded-xl ${focused ? "bg-primary/20" : ""}`}>
                <ArrowLeftRight size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: "Orçamento",
            tabBarIcon: ({ color, focused }) => (
              <View className={`items-center justify-center p-1.5 rounded-xl ${focused ? "bg-primary/20" : ""}`}>
                <PieChart size={24} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* GLOBAL FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-[80px] right-6 bg-primary p-4 rounded-full shadow-glow z-50 items-center justify-center"
        style={{
          shadowColor: "#4ade80",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Plus size={24} color="#000000" />
      </TouchableOpacity>

      {/* QUICK LAUNCH MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-background border-t border-border/40 rounded-t-[36px] p-6 max-h-[92%]">
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-2xl font-black">Lançamento Rápido</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-card p-2 rounded-full border border-border/40"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Sub-tab Selectors */}
            <View className="flex-row bg-card p-1.5 rounded-2xl mb-6 border border-border/20">
              <TouchableOpacity
                onPress={() => setActiveTab("transaction")}
                className={`flex-1 py-3 items-center justify-center rounded-xl ${
                  activeTab === "transaction" ? "bg-background border border-border/10" : ""
                }`}
              >
                <Text
                  className={`font-bold text-xs ${
                    activeTab === "transaction" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Transação
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("transfer")}
                className={`flex-1 py-3 items-center justify-center rounded-xl ${
                  activeTab === "transfer" ? "bg-background border border-border/10" : ""
                }`}
              >
                <Text
                  className={`font-bold text-xs ${
                    activeTab === "transfer" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Transferência
                </Text>
              </TouchableOpacity>
            </View>

            {/* SCROLLABLE FORMS */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-grow-0 mb-4">
              
              {/* --- TAB 1: TRANSACTION FORM --- */}
              {activeTab === "transaction" && (
                <View className="space-y-5">
                  {/* Toggle Income vs Expense */}
                  <View className="flex-row bg-card/60 p-1 rounded-xl mb-4 border border-border/10">
                    <TouchableOpacity
                      onPress={() => setIsIncome(false)}
                      className={`flex-1 py-3 items-center justify-center rounded-lg ${
                        !isIncome ? "bg-rose-500/20 border border-rose-500/30" : ""
                      }`}
                    >
                      <Text className={`font-bold text-xs ${!isIncome ? "text-rose-400" : "text-muted-foreground"}`}>
                        Despesa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsIncome(true)}
                      className={`flex-1 py-3 items-center justify-center rounded-lg ${
                        isIncome ? "bg-emerald-500/20 border border-emerald-500/30" : ""
                      }`}
                    >
                      <Text className={`font-bold text-xs ${isIncome ? "text-emerald-400" : "text-muted-foreground"}`}>
                        Receita
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Description Input */}
                  <View>
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Descrição / Fornecedor
                    </Text>
                    <TextInput
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="Ex: Almoço, Salário..."
                      placeholderTextColor="#64748B"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  {/* Amount Input */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Valor (R$)
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="0,00"
                      placeholderTextColor="#64748B"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>

                  {/* Account Selector Chips */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Conta Origem/Destino
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                      {flatAccounts.map((acc) => {
                        const isSelected = selectedAccountId === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            onPress={() => setSelectedAccountId(acc.id)}
                            className={`px-4 py-2.5 rounded-full mr-1.5 ${
                              isSelected ? "bg-primary shadow-glow" : "bg-card border border-border/30"
                            }`}
                          >
                            <Text
                              className={`font-bold text-xs ${
                                isSelected ? "text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {acc.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Category Selector Chips (only shown for expense) */}
                  {!isIncome && (
                    <View className="mt-4">
                      <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                        Categoria Orçamentária
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                        {leafCategories.map((cat) => {
                          const isSelected = selectedCategoryId === cat.id;
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              onPress={() => setSelectedCategoryId(cat.id)}
                              className={`px-4 py-2.5 rounded-full mr-1.5 ${
                                isSelected ? "bg-primary shadow-glow" : "bg-card border border-border/30"
                              }`}
                            >
                              <Text
                                className={`font-bold text-xs ${
                                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Date Input */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Data do Lançamento
                    </Text>
                    <TextInput
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                      value={date}
                      onChangeText={setDate}
                    />
                  </View>

                  {/* Status Segment */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Status de Liquidação
                    </Text>
                    <View className="flex-row gap-x-2">
                      <TouchableOpacity
                        onPress={() => setStatus("realized")}
                        className={`px-5 py-2.5 rounded-full ${
                          status === "realized" ? "bg-primary shadow-glow" : "bg-card border border-border/30"
                        }`}
                      >
                        <Text
                          className={`font-bold text-xs ${
                            status === "realized" ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          Pago / Realizado
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setStatus("pending")}
                        className={`px-5 py-2.5 rounded-full ${
                          status === "pending" ? "bg-primary shadow-glow" : "bg-card border border-border/30"
                        }`}
                      >
                        <Text
                          className={`font-bold text-xs ${
                            status === "pending" ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          Pendente
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleCreateTransaction}
                    className="bg-primary py-4 rounded-2xl flex-row items-center justify-center shadow-glow mt-6"
                  >
                    <Check size={18} color="#000000" className="mr-2" />
                    <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">
                      Lançar Transação
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* --- TAB 2: TRANSFER FORM --- */}
              {activeTab === "transfer" && (
                <View className="space-y-5">
                  {/* From Account Chips */}
                  <View>
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      De Conta (Origem)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                      {flatAccounts.map((acc) => {
                        const isSelected = fromAccountId === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            onPress={() => setFromAccountId(acc.id)}
                            className={`px-4 py-2.5 rounded-full mr-1.5 ${
                              isSelected ? "bg-rose-500/20 border border-rose-500/30" : "bg-card border border-border/30"
                            }`}
                          >
                            <Text
                              className={`font-bold text-xs ${
                                isSelected ? "text-rose-400" : "text-muted-foreground"
                              }`}
                            >
                              {acc.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* To Account Chips */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Para Conta (Destino)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                      {flatAccounts.map((acc) => {
                        const isSelected = toAccountId === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            onPress={() => setToAccountId(acc.id)}
                            className={`px-4 py-2.5 rounded-full mr-1.5 ${
                              isSelected ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-card border border-border/30"
                            }`}
                          >
                            <Text
                              className={`font-bold text-xs ${
                                isSelected ? "text-emerald-400" : "text-muted-foreground"
                              }`}
                            >
                              {acc.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Amount Input */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Valor da Transferência (R$)
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="0,00"
                      placeholderTextColor="#64748B"
                      value={transferAmount}
                      onChangeText={setTransferAmount}
                    />
                  </View>

                  {/* Description Input */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Observação / Descrição
                    </Text>
                    <TextInput
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="Ex: Transferência mensal..."
                      placeholderTextColor="#64748B"
                      value={transferDescription}
                      onChangeText={setTransferDescription}
                    />
                  </View>

                  {/* Date Input */}
                  <View className="mt-4">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                      Data da Transferência
                    </Text>
                    <TextInput
                      className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                      value={transferDate}
                      onChangeText={setTransferDate}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleCreateTransfer}
                    className="bg-primary py-4 rounded-2xl flex-row items-center justify-center shadow-glow mt-6"
                  >
                    <Check size={18} color="#000000" className="mr-2" />
                    <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">
                      Realizar Transferência
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
