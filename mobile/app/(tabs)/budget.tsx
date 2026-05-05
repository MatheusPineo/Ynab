import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useBudgetStore, CategoryNode } from "../../store/useBudgetStore";
import { Coins, Check, ArrowRight, ChevronDown, ChevronUp } from "lucide-react-native";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function BudgetScreen() {
  const { categoryGroups, isLoading, fetchCategoryGroups, assignMoney } = useBudgetStore();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState("");

  useEffect(() => {
    fetchCategoryGroups(selectedMonth + 1, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleAssign = async (categoryId: string) => {
    const parsedAmount = parseFloat(assignValue.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert("Erro", "Insira um valor numérico válido.");
      return;
    }

    try {
      await assignMoney(categoryId, parsedAmount, selectedMonth + 1, selectedYear);
      setEditingCategoryId(null);
      setAssignValue("");
      Alert.alert("Sucesso", "Orçamento atualizado!");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-muted-foreground text-sm uppercase tracking-wider font-bold">
            Planejamento
          </Text>
          <Text className="text-foreground text-3xl font-black mt-1">
            Orçamento
          </Text>
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

        {/* Categories List */}
        {isLoading && categoryGroups.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : categoryGroups.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8 bg-card/10 rounded-[32px] border border-border/20 mb-8">
            <Text className="text-muted-foreground text-base text-center font-semibold">
              Nenhum grupo de categoria configurado.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {categoryGroups.map((group) => {
              const isExpanded = expandedGroupId === group.id;
              return (
                <View
                  key={group.id}
                  className="bg-card border border-border/30 rounded-[24px] overflow-hidden mb-4"
                >
                  {/* Group Header */}
                  <TouchableOpacity
                    onPress={() => toggleGroup(group.id)}
                    className="flex-row justify-between items-center px-5 py-4 bg-card"
                  >
                    <View className="flex-row items-center">
                      <Coins size={18} color="#4ade80" className="mr-3" />
                      <Text className="text-foreground font-black text-sm uppercase tracking-wider">
                        {group.name}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#94A3B8" />
                    ) : (
                      <ChevronDown size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>

                  {/* Subcategories (Expanded) */}
                  {isExpanded && (
                    <View className="border-t border-border/20 bg-card/50">
                      {group.children && group.children.length > 0 ? (
                        group.children.map((cat) => {
                          const isEditing = editingCategoryId === cat.id;
                          const available = cat.assigned_amount - cat.spent_amount;
                          const isOverspent = available < 0;

                          return (
                            <View key={cat.id} className="border-b border-border/10">
                              <TouchableOpacity
                                onPress={() => {
                                  if (isEditing) {
                                    setEditingCategoryId(null);
                                  } else {
                                    setEditingCategoryId(cat.id);
                                    setAssignValue(cat.assigned_amount.toString());
                                  }
                                }}
                                className="flex-row justify-between items-center px-5 py-4"
                              >
                                <View className="flex-1 pr-4">
                                  <Text className="text-foreground font-bold text-sm">
                                    {cat.name}
                                  </Text>
                                  <Text className="text-muted-foreground text-[10px] mt-0.5">
                                    Reservado: R$ {cat.assigned_amount.toLocaleString("pt-BR")}
                                  </Text>
                                </View>
                                
                                <View className="items-end">
                                  <View
                                    className={`px-3 py-1.5 rounded-xl ${
                                      isOverspent
                                        ? "bg-rose-500/20 border border-rose-500/30"
                                        : available > 0
                                        ? "bg-emerald-500/20 border border-emerald-500/30"
                                        : "bg-muted/40 border border-border/30"
                                    }`}
                                  >
                                    <Text
                                      className={`font-black text-xs ${
                                        isOverspent
                                          ? "text-rose-400"
                                          : available > 0
                                          ? "text-emerald-400"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      R$ {available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>

                              {/* Inline Editing Alocation Drawer */}
                              {isEditing && (
                                <View className="bg-background/80 px-5 py-4 flex-row items-center gap-x-3 border-t border-border/10">
                                  <Text className="text-muted-foreground text-xs font-bold uppercase">
                                    Alocar:
                                  </Text>
                                  <TextInput
                                    keyboardType="numeric"
                                    className="flex-1 bg-card border border-border/40 text-foreground px-3 py-2 rounded-xl text-sm font-bold"
                                    placeholder="R$ 0,00"
                                    placeholderTextColor="#64748B"
                                    value={assignValue}
                                    onChangeText={setAssignValue}
                                    autoFocus
                                  />
                                  <TouchableOpacity
                                    onPress={() => handleAssign(cat.id)}
                                    className="bg-primary px-4 py-2.5 rounded-xl flex-row items-center justify-center shadow-glow"
                                  >
                                    <Check size={16} color="#000000" />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <View className="px-5 py-4 items-center justify-center">
                          <Text className="text-muted-foreground text-xs">
                            Nenhuma categoria neste grupo.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
