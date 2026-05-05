import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface ChartDataPoint {
  value: number;
  label: string;
}

interface FlowChartProps {
  data?: ChartDataPoint[];
}

const defaultData: ChartDataPoint[] = [
  { value: 12000, label: "Jan" },
  { value: 15000, label: "Fev" },
  { value: 13500, label: "Mar" },
  { value: 18000, label: "Abr" },
  { value: 22000, label: "Mai" },
  { value: 20500, label: "Jun" },
];

export default function FlowChart({ data = defaultData }: FlowChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 72; // Padding screen + padding card

  return (
    <View className="bg-card border border-border/40 p-5 rounded-[28px] shadow-2xl mb-6">
      <View className="mb-4">
        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Evolução do Fluxo
        </Text>
        <Text className="text-foreground text-lg font-black mt-0.5">
          Movimentações Acumuladas
        </Text>
      </View>

      <View className="items-center justify-center -ml-6 mt-2">
        <LineChart
          areaChart
          data={data}
          width={chartWidth}
          height={180}
          spacing={chartWidth / (data.length - 0.8)}
          color="rgba(74, 222, 128, 1)" // Esmeralda/Mint principal
          thickness={3.5}
          startFillColor="rgba(74, 222, 128, 0.35)"
          endFillColor="rgba(74, 222, 128, 0.0)"
          startOpacity={0.4}
          endOpacity={0.01}
          initialSpacing={15}
          noOfSections={4}
          yAxisColor="transparent"
          xAxisColor="rgba(228, 231, 233, 0.1)"
          yAxisTextStyle={{ color: "#64748B", fontSize: 10, fontWeight: "600" }}
          xAxisLabelTextStyle={{ color: "#64748B", fontSize: 10, fontWeight: "600" }}
          rulesColor="rgba(228, 231, 233, 0.05)"
          rulesType="solid"
          hideDataPoints={false}
          dataPointsColor="rgba(74, 222, 128, 1)"
          dataPointsRadius={4}
          focusedDataPointColor="rgba(255, 255, 255, 1)"
          focusedDataPointRadius={6}
          showStripOnFocus
          stripColor="rgba(74, 222, 128, 0.2)"
          stripThickness={2.5}
          pointerConfig={{
            pointerStripUptoDataPoint: true,
            pointerStripColor: "rgba(74, 222, 128, 0.4)",
            pointerStripWidth: 2,
            strokeDashArray: [2, 5],
            pointerColor: "rgba(74, 222, 128, 1)",
            radius: 5,
            pointerLabelComponent: (items: any) => {
              return (
                <View className="bg-[#1E293B] border border-border/50 px-3 py-1.5 rounded-xl shadow-xl -ml-12 -mt-10">
                  <Text className="text-foreground text-xs font-black">
                    R$ {items[0].value.toLocaleString("pt-BR")}
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
}
