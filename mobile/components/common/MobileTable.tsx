import React from "react";
import { View, Text, FlatList, ListRenderItem, StyleSheet } from "react-native";

export interface ColumnConfig {
  key: string;
  title: string;
  flex: number; // For styling flex grow / width ratio
  align?: "left" | "center" | "right";
}

interface MobileTableProps<T> {
  columns: ColumnConfig[];
  data: T[];
  renderRow: (item: T, columns: ColumnConfig[]) => React.ReactElement;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export default function MobileTable<T>({
  columns,
  data,
  renderRow,
  keyExtractor,
  emptyMessage = "Nenhum registro encontrado.",
}: MobileTableProps<T>) {
  return (
    <View className="flex-1 bg-card/40 border border-border/40 rounded-[24px] overflow-hidden">
      {/* Table Header */}
      <View className="flex-row bg-muted/30 border-b border-border/30 px-4 py-3.5">
        {columns.map((col) => {
          const alignmentClass =
            col.align === "right"
              ? "text-right"
              : col.align === "center"
              ? "text-center"
              : "text-left";

          return (
            <View key={col.key} style={{ flex: col.flex }}>
              <Text className={`text-muted-foreground text-xs font-bold uppercase tracking-wider ${alignmentClass}`}>
                {col.title}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Table Body */}
      {data.length === 0 ? (
        <View className="p-8 items-center justify-center">
          <Text className="text-muted-foreground text-sm">{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderRow(item, columns)}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-border/20 mx-4" />}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Disable inner scroll so parent ScrollView can handle it, or enable if needed
        />
      )}
    </View>
  );
}
