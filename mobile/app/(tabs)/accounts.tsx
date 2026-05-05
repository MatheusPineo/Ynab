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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAccountStore, AccountNode } from "../../store/useAccountStore";
import { useDistributionStore, DistributionTemplate } from "../../store/useDistributionStore";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Building,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  X,
  Check,
  GitFork,
} from "lucide-react-native";

export default function AccountsScreen() {
  const { tree, isLoading, fetchAccounts, addAccount, updateAccount, deleteAccount } =
    useAccountStore();

  const { templates, fetchTemplates, executeDistribution } = useDistributionStore();

  const [activeExpanded, setActiveExpanded] = useState(true);
  const [passiveExpanded, setPassiveExpanded] = useState(true);

  // General Create/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [currency, setCurrency] = useState("BRL");
  const [parentId, setParentId] = useState<string | null>(null);

  // Distribution Modal State
  const [distributeModalVisible, setDistributeModalVisible] = useState(false);
  const [distributeFromAccountId, setDistributeFromAccountId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [distributeAmount, setDistributeAmount] = useState("");
  const [distributeDate, setDistributeDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
  }, []);

  // Flatten accounts tree
  const flattenedAccounts = useMemo(() => {
    const list: (AccountNode & { depth: number })[] = [];
    const walk = (nodes: AccountNode[], depth = 0) => {
      nodes.forEach((node) => {
        list.push({ ...node, depth });
        if (node.children && node.children.length > 0) {
          walk(node.children, depth + 1);
        }
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  // Assets and Liabilities list
  const assets = useMemo(() => {
    return flattenedAccounts.filter(
      (acc) =>
        acc.account_type === "checking" ||
        acc.account_type === "savings" ||
        acc.account_type === "investment"
    );
  }, [flattenedAccounts]);

  const liabilities = useMemo(() => {
    return flattenedAccounts.filter(
      (acc) => acc.account_type === "credit" || acc.account_type === "loan"
    );
  }, [flattenedAccounts]);

  // Totals calculations
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

  // Selected template object
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  // Real-time distribution calculations based on total entered amount
  const calculatedDistributions = useMemo(() => {
    if (!selectedTemplate || !distributeAmount) return [];
    const total = parseFloat(distributeAmount.replace(",", "."));
    if (isNaN(total) || total <= 0) return [];

    return selectedTemplate.items.map((item) => {
      let value = 0;
      if (item.percentage !== null) {
        value = (item.percentage / 100) * total;
      } else if (item.fixed_amount !== null) {
        value = Number(item.fixed_amount);
      }

      // Find destination account name
      const targetAcc = flattenedAccounts.find((a) => a.id === item.account);
      return {
        to_account: item.account,
        accountName: targetAcc ? targetAcc.name : "Conta desconhecida",
        amount: value,
      };
    });
  }, [selectedTemplate, distributeAmount, flattenedAccounts]);

  const totalAllocated = useMemo(() => {
    return calculatedDistributions.reduce((sum, d) => sum + d.amount, 0);
  }, [calculatedDistributions]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName("");
    setBalance("");
    setAccountType("checking");
    setCurrency("BRL");
    setParentId(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (acc: AccountNode) => {
    setEditingId(acc.id);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setAccountType(acc.account_type);
    setCurrency(acc.currency);
    setParentId(acc.parent);
    setModalVisible(true);
  };

  const handleOpenDistributeModal = () => {
    setDistributeFromAccountId("");
    setSelectedTemplateId("");
    setDistributeAmount("");
    setDistributeModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !balance) {
      Alert.alert("Erro", "Por favor, preencha o nome e o saldo inicial.");
      return;
    }

    const numericBalance = parseFloat(balance.replace(",", "."));
    if (isNaN(numericBalance)) {
      Alert.alert("Erro", "Saldo inicial inválido.");
      return;
    }

    try {
      if (editingId) {
        await updateAccount(editingId, {
          name,
          balance: numericBalance,
          account_type: accountType as any,
          currency: currency as any,
          parent: parentId,
        });
        Alert.alert("Sucesso", "Conta atualizada com sucesso!");
      } else {
        await addAccount({
          name,
          balance: numericBalance,
          account_type: accountType,
          currency,
          parent: parentId,
        });
        Alert.alert("Sucesso", "Conta criada com sucesso!");
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const handleDelete = (id: string, accName: string) => {
    Alert.alert(
      "Excluir Conta",
      `Tem certeza que deseja excluir "${accName}"? Todas as transações vinculadas serão afetadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount(id);
              Alert.alert("Sucesso", "Conta excluída.");
            } catch (error: any) {
              Alert.alert("Erro", error.message);
            }
          },
        },
      ]
    );
  };

  const handleRunDistribution = async () => {
    if (!distributeFromAccountId || !selectedTemplateId || !distributeAmount) {
      Alert.alert("Erro", "Preencha a conta de origem, escolha o modelo e informe o valor.");
      return;
    }

    const total = parseFloat(distributeAmount.replace(",", "."));
    if (isNaN(total) || total <= 0) {
      Alert.alert("Erro", "Informe um valor total de distribuição válido.");
      return;
    }

    if (calculatedDistributions.length === 0) {
      Alert.alert("Erro", "Nenhum repasse de destino calculado.");
      return;
    }

    try {
      const payload = {
        from_account: distributeFromAccountId,
        total_amount: total,
        date: distributeDate,
        distributions: calculatedDistributions.map((d) => ({
          to_account: d.to_account,
          amount: d.amount,
        })),
      };

      await executeDistribution(payload);
      await fetchAccounts();

      Alert.alert("Sucesso", "Distribuição realizada em lote com sucesso!");
      setDistributeModalVisible(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const getAccountIcon = (type: string) => {
    if (type === "credit") return <CreditCard size={18} color="#f43f5e" />;
    if (type === "savings") return <Wallet size={18} color="#10b981" />;
    return <Building size={18} color="#64748B" />;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-6">
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-muted-foreground text-sm uppercase tracking-wider font-bold">
              Minha Carteira
            </Text>
            <Text className="text-foreground text-3xl font-black mt-1">
              Contas
            </Text>
          </View>
          
          <View className="flex-row gap-x-2.5">
            {/* Action 1: Distribuir Receita */}
            <TouchableOpacity
              onPress={handleOpenDistributeModal}
              className="bg-primary/10 border border-primary/20 px-4 py-3 rounded-2xl flex-row items-center"
            >
              <GitFork size={18} color="#4ade80" className="mr-2" />
              <Text className="text-primary font-bold text-xs uppercase tracking-wider">Distribuir</Text>
            </TouchableOpacity>

            {/* Action 2: Criar Conta */}
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              className="bg-primary p-3.5 rounded-2xl shadow-glow"
            >
              <Plus size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Consolidated Balance Card */}
        <View className="bg-card border border-border/40 p-6 rounded-[32px] mb-6 shadow-xl">
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
            Patrimônio Líquido Consolidado
          </Text>
          <Text className="text-foreground text-3xl font-black tracking-tight mb-4">
            R$ {netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
          <View className="flex-row justify-between pt-4 border-t border-border/10">
            <View>
              <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Ativos Totais
              </Text>
              <Text className="text-emerald-400 font-bold text-sm mt-0.5">
                + R$ {totalAssets.toLocaleString("pt-BR")}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Passivos Totais
              </Text>
              <Text className="text-rose-400 font-bold text-sm mt-0.5">
                - R$ {totalLiabilities.toLocaleString("pt-BR")}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Lists */}
        {isLoading && tree.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            
            {/* 1. ATIVOS SECTION */}
            <View className="bg-card border border-border/30 rounded-[28px] overflow-hidden mb-5">
              <TouchableOpacity
                onPress={() => setActiveExpanded(!activeExpanded)}
                className="flex-row justify-between items-center px-5 py-4 bg-card"
              >
                <View className="flex-row items-center">
                  <TrendingUp size={18} color="#10b981" className="mr-3" />
                  <Text className="text-foreground font-black text-xs uppercase tracking-wider">
                    Contas Ativas ({assets.length})
                  </Text>
                </View>
                {activeExpanded ? (
                  <ChevronUp size={18} color="#94A3B8" />
                ) : (
                  <ChevronDown size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>

              {activeExpanded && (
                <View className="border-t border-border/20 bg-card/40">
                  {assets.length === 0 ? (
                    <View className="p-6 items-center justify-center">
                      <Text className="text-muted-foreground text-xs">Nenhum ativo cadastrado.</Text>
                    </View>
                  ) : (
                    assets.map((acc) => (
                      <View
                        key={acc.id}
                        style={{ paddingLeft: 16 + acc.depth * 16 }}
                        className="flex-row justify-between items-center pr-5 py-4 border-b border-border/10"
                      >
                        <View className="flex-row items-center flex-1 pr-4">
                          <View className="bg-muted/30 p-2.5 rounded-xl mr-3">
                            {getAccountIcon(acc.account_type)}
                          </View>
                          <View className="flex-1">
                            <Text className="text-foreground font-bold text-sm" numberOfLines={1}>
                              {acc.name}
                            </Text>
                            <Text className="text-muted-foreground text-[10px] capitalize mt-0.5">
                              {acc.account_type === "checking" ? "Conta Corrente" : acc.account_type === "savings" ? "Poupança" : "Investimentos"}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-emerald-400 font-black text-sm">
                            R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </Text>
                          <View className="flex-row items-center mt-1.5 gap-x-2.5">
                            <TouchableOpacity onPress={() => handleOpenEditModal(acc)}>
                              <Edit2 size={14} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(acc.id, acc.name)}>
                              <Trash2 size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* 2. PASSIVOS SECTION */}
            <View className="bg-card border border-border/30 rounded-[28px] overflow-hidden mb-8">
              <TouchableOpacity
                onPress={() => setPassiveExpanded(!passiveExpanded)}
                className="flex-row justify-between items-center px-5 py-4 bg-card"
              >
                <View className="flex-row items-center">
                  <TrendingDown size={18} color="#f43f5e" className="mr-3" />
                  <Text className="text-foreground font-black text-xs uppercase tracking-wider">
                    Contas Passivas ({liabilities.length})
                  </Text>
                </View>
                {passiveExpanded ? (
                  <ChevronUp size={18} color="#94A3B8" />
                ) : (
                  <ChevronDown size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>

              {passiveExpanded && (
                <View className="border-t border-border/20 bg-card/40">
                  {liabilities.length === 0 ? (
                    <View className="p-6 items-center justify-center">
                      <Text className="text-muted-foreground text-xs">Nenhum passivo cadastrado.</Text>
                    </View>
                  ) : (
                    liabilities.map((acc) => (
                      <View
                        key={acc.id}
                        style={{ paddingLeft: 16 + acc.depth * 16 }}
                        className="flex-row justify-between items-center pr-5 py-4 border-b border-border/10"
                      >
                        <View className="flex-row items-center flex-1 pr-4">
                          <View className="bg-muted/30 p-2.5 rounded-xl mr-3">
                            {getAccountIcon(acc.account_type)}
                          </View>
                          <View className="flex-1">
                            <Text className="text-foreground font-bold text-sm" numberOfLines={1}>
                              {acc.name}
                            </Text>
                            <Text className="text-muted-foreground text-[10px] capitalize mt-0.5">
                              {acc.account_type === "credit" ? "Cartão de Crédito" : "Empréstimo"}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-rose-400 font-black text-sm">
                            R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </Text>
                          <View className="flex-row items-center mt-1.5 gap-x-2.5">
                            <TouchableOpacity onPress={() => handleOpenEditModal(acc)}>
                              <Edit2 size={14} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(acc.id, acc.name)}>
                              <Trash2 size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

          </ScrollView>
        )}
      </View>

      {/* CREATE / EDIT ACCOUNT MODAL */}
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
          <View className="bg-background border-t border-border/40 rounded-t-[36px] p-6 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-xl font-black">
                {editingId ? "Editar Conta" : "Nova Conta"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-card p-2 rounded-full border border-border/40"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-5" showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View>
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Nome da Conta
                </Text>
                <TextInput
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="Ex: Nubank, Carteira..."
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Balance Input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Saldo Inicial / Atual
                </Text>
                <TextInput
                  keyboardType="numeric"
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="R$ 0,00"
                  placeholderTextColor="#64748B"
                  value={balance}
                  onChangeText={setBalance}
                />
              </View>

              {/* Type Select */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Tipo da Conta
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { key: "checking", label: "Conta Corrente" },
                    { key: "savings", label: "Poupança" },
                    { key: "investment", label: "Investimento" },
                    { key: "credit", label: "Cartão de Crédito" },
                    { key: "loan", label: "Empréstimo" },
                  ].map((t) => {
                    const isSelected = accountType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        onPress={() => setAccountType(t.key)}
                        className={`px-4 py-2.5 rounded-full ${
                          isSelected
                            ? "bg-primary shadow-glow"
                            : "bg-card border border-border/30"
                        }`}
                      >
                        <Text
                          className={`font-bold text-xs ${
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Currency Select */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Moeda
                </Text>
                <View className="flex-row gap-x-2">
                  {["BRL", "USD", "EUR"].map((cur) => {
                    const isSelected = currency === cur;
                    return (
                      <TouchableOpacity
                        key={cur}
                        onPress={() => setCurrency(cur)}
                        className={`px-5 py-2.5 rounded-full ${
                          isSelected
                            ? "bg-primary shadow-glow"
                            : "bg-card border border-border/30"
                        }`}
                      >
                        <Text
                          className={`font-bold text-xs ${
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {cur}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSave}
                className="bg-primary py-4 rounded-[20px] flex-row items-center justify-center shadow-glow mt-8"
              >
                <Check size={18} color="#000000" className="mr-2" />
                <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">
                  Salvar Alterações
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- AUTOMATED REVENUE DISTRIBUTION MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={distributeModalVisible}
        onRequestClose={() => setDistributeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-background border-t border-border/40 rounded-t-[36px] p-6 max-h-[92%]">
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground text-xl font-black">
                Distribuição de Receitas
              </Text>
              <TouchableOpacity
                onPress={() => setDistributeModalVisible(false)}
                className="bg-card p-2 rounded-full border border-border/40"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-5" showsVerticalScrollIndicator={false}>
              
              {/* Origin Account Selector */}
              <View>
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Conta de Origem (Saída)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                  {assets.map((acc) => {
                    const isSelected = distributeFromAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setDistributeFromAccountId(acc.id)}
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

              {/* Template Selector */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Modelo de Regra / Template
                </Text>
                {templates.length === 0 ? (
                  <Text className="text-muted-foreground text-xs p-3 bg-card border border-border/20 rounded-2xl">
                    Nenhum modelo cadastrado no Web. Crie regras na tela de configurações Web primeiro.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
                    {templates.map((temp) => {
                      const isSelected = selectedTemplateId === temp.id;
                      return (
                        <TouchableOpacity
                          key={temp.id}
                          onPress={() => setSelectedTemplateId(temp.id)}
                          className={`px-4 py-2.5 rounded-full mr-1.5 ${
                            isSelected ? "bg-primary shadow-glow" : "bg-card border border-border/30"
                          }`}
                        >
                          <Text
                            className={`font-bold text-xs ${
                              isSelected ? "text-primary-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {temp.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Amount Input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Valor Total a Distribuir (R$)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="Ex: 5000,00"
                  placeholderTextColor="#64748B"
                  value={distributeAmount}
                  onChangeText={setDistributeAmount}
                />
              </View>

              {/* Date Input */}
              <View className="mt-4">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                  Data das Transferências
                </Text>
                <TextInput
                  className="bg-card border border-border/40 text-foreground px-4 py-3 rounded-2xl font-bold"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                  value={distributeDate}
                  onChangeText={setDistributeDate}
                />
              </View>

              {/* REAL-TIME PREVIEW OF ALLOCATIONS */}
              {calculatedDistributions.length > 0 && (
                <View className="mt-5 bg-card/60 border border-border/20 p-5 rounded-[24px]">
                  <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-3">
                    Preview do Repasse Automático
                  </Text>
                  
                  <View className="space-y-3 mb-4">
                    {calculatedDistributions.map((dist, idx) => (
                      <View key={idx} className="flex-row justify-between items-center py-1 border-b border-border/5">
                        <Text className="text-foreground text-xs font-bold">{dist.accountName}</Text>
                        <Text className="text-emerald-400 font-black text-xs">
                          + R$ {dist.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row justify-between items-center pt-3 border-t border-border/10">
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Total Distribuído</Text>
                    <Text className="text-foreground font-black text-sm">
                      R$ {totalAllocated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              )}

              {/* Execute Button */}
              <TouchableOpacity
                onPress={handleRunDistribution}
                disabled={calculatedDistributions.length === 0}
                className={`py-4 rounded-[20px] flex-row items-center justify-center shadow-glow mt-6 ${
                  calculatedDistributions.length > 0 ? "bg-primary" : "bg-muted/20 border border-border/10"
                }`}
              >
                <GitFork size={18} color={calculatedDistributions.length > 0 ? "#000000" : "#64748B"} className="mr-2" />
                <Text
                  className={`font-black text-sm uppercase tracking-wider ${
                    calculatedDistributions.length > 0 ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Executar Distribuição em Lote
                </Text>
              </TouchableOpacity>
              
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
