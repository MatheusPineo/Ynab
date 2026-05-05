import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useTransactionsStore } from "../../store/useTransactionsStore";
import {
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Trash2,
  RefreshCw,
  WifiOff,
} from "lucide-react-native";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function TransactionsScreen() {
  const { 
    transactions, 
    offlineQueue, 
    isLoading, 
    fetchTransactions, 
    deleteTransaction, 
    toggleStatus, 
    loadOfflineQueue 
  } = useTransactionsStore();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");

  // Load physical offline queue storage on focus/mount
  useEffect(() => {
    loadOfflineQueue();
    fetchTransactions(selectedMonth + 1, selectedYear);
  }, [selectedMonth, selectedYear]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      "Excluir Transação",
      `Tem certeza que deseja excluir "${description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch (error: any) {
              Alert.alert("Erro", error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: "realized" | "pending") => {
    try {
      await toggleStatus(id, currentStatus);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-muted-foreground text-sm uppercase tracking-wider font-bold">
              Histórico
            </Text>
            <Text className="text-foreground text-3xl font-black mt-1">
              Transações
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              loadOfflineQueue();
              fetchTransactions(selectedMonth + 1, selectedYear);
            }}
            className="bg-card p-3 rounded-xl border border-border/40"
          >
            <RefreshCw size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* BACKGROUND OFFLINE QUEUE STATUS BANNER */}
        {offlineQueue.length > 0 && (
          <View className="bg-amber-500/10 border border-amber-500/20 px-5 py-3.5 rounded-[22px] flex-row items-center justify-between mb-5">
            <View className="flex-row items-center flex-1 pr-3">
              <WifiOff size={16} color="#f59e0b" className="mr-2.5" />
              <Text className="text-amber-400 font-bold text-xs leading-normal">
                {offlineQueue.length} {offlineQueue.length === 1 ? "lançamento pendente" : "lançamentos pendentes"} offline. Aguardando conexão...
              </Text>
            </View>
            <ActivityIndicator size="small" color="#f59e0b" />
          </View>
        )}

        {/* Search Bar */}
        <View className="flex-row items-center bg-card border border-border/40 rounded-2xl px-4 h-12 mb-6">
          <Search size={18} color="#64748B" />
          <TextInput
            className="flex-1 text-foreground ml-3 h-full"
            placeholder="Buscar por descrição..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Scrollable Month Selector */}
        <View className="h-12 mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {months.map((month, index) => {
              const isSelected = selectedMonth === index;
              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => setSelectedMonth(index)}
                  className={`px-5 py-2.5 rounded-full mr-2 h-10 justify-center ${
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
                    {month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Transactions List */}
        {isLoading && transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8 bg-card/10 rounded-[32px] border border-border/20 mb-8">
            <Text className="text-muted-foreground text-base text-center font-semibold">
              Nenhuma transação encontrada para este período.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isIncome = item.type === "income";
              return (
                <View className={`flex-row items-center bg-card p-4 rounded-[24px] mb-3 border ${
                  item.isOffline ? "border-amber-500/30 bg-amber-500/5" : "border-border/30"
                }`}>
                  {/* Type Icon */}
                  <View
                    className={`h-11 w-11 rounded-xl items-center justify-center ${
                      item.isOffline 
                        ? "bg-amber-500/10" 
                        : isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
                    }`}
                  >
                    {item.isOffline ? (
                      <WifiOff size={18} color="#f59e0b" />
                    ) : isIncome ? (
                      <TrendingUp size={18} color="#10b981" />
                    ) : (
                      <TrendingDown size={18} color="#f43f5e" />
                    )}
                  </View>

                  {/* Transaction Info */}
                  <View className="flex-1 ml-4 pr-2">
                    <View className="flex-row items-center">
                      <Text
                        className="text-foreground font-black text-sm flex-1"
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                      {item.isOffline && (
                        <View className="bg-amber-500/20 px-2 py-0.5 rounded-md ml-1.5">
                          <Text className="text-amber-400 font-bold text-[8px] uppercase">Offline</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold mt-1 tracking-wider">
                      {item.category_name || "Sem Categoria"} • {item.date}
                    </Text>
                  </View>

                  {/* Amount and Actions */}
                  <View className="items-end">
                    <Text
                      className={`font-black text-base ${
                        item.isOffline
                          ? "text-amber-400"
                          : isIncome ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"} R${" "}
                      {Math.abs(item.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    
                    {/* Tiny Actions Row */}
                    <View className="flex-row items-center mt-2 gap-x-3">
                      <TouchableOpacity
                        disabled={!!item.isOffline}
                        onPress={() => handleToggleStatus(item.id, item.status)}
                        style={item.isOffline ? { opacity: 0.3 } : {}}
                      >
                        {item.isOffline ? (
                          <Clock size={16} color="#f59e0b" />
                        ) : item.status === "realized" ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : (
                          <Clock size={16} color="#eab308" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.description)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
