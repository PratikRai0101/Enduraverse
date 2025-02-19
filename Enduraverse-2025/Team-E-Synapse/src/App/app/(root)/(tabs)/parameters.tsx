import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Client, Databases } from "appwrite"; // Import Appwrite client and databases

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
  .setProject('67b57be1003052aa6282'); // Your project ID

const databases = new Databases(client);

const safetyParameters = [
  {
    id: "1",
    parameter: "Braking",
    description: "Measures the severity of braking events.",
    score: "Moderate",
  },
  {
    id: "2",
    parameter: "Acceleration",
    description: "Measures the severity of acceleration events.",
    score: "Severe",
  },
  {
    id: "3",
    parameter: "Cornering",
    description: "Measures the severity of cornering events.",
    score: "Mild",
  },
  {
    id: "4",
    parameter: "Speeding",
    description: "Measures the frequency and severity of speeding events.",
    score: "Low",
  },
];

const screenWidth = Dimensions.get("window").width;

const calculateSafetyScore = (accel_x: number, accel_y: number, accel_z: number, gyro_x: number | null, gyro_y: number | null) => {
  // Placeholder logic for calculating safety score
  const score = 100 - (Math.abs(accel_x) + Math.abs(accel_y) + Math.abs(accel_z)) / 3;
  return { score: Math.max(0, Math.min(100, score)) }; // Ensure score is between 0 and 100
};

const Parameters = () => {
  const [realTimeSafetyScore, setRealTimeSafetyScore] = useState<number>(100);
  const [chartData, setChartData] = useState<number[]>([100, 95, 90, 85]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await databases.listDocuments('67b57da3000fd43c619a', '67b5a262002bc11c0b92');
        const data = response.documents[0]; // Assuming you want the first document

        const accel_x = parseFloat(data.accel_x) || 0;
        const accel_y = parseFloat(data.accel_y) || 0;
        const accel_z = parseFloat(data.accel_z) || 0;

        const { score } = calculateSafetyScore(
          accel_x,
          accel_y,
          accel_z,
          null,
          null
        );

        setRealTimeSafetyScore(score);
        setChartData([score, score - 5, score - 10, score - 15]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderParameterItem = ({ item }: { item: { id: string; parameter: string; description: string; score: string } }) => (
    <View className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="text-lg font-bold">{item.parameter}</Text>
        <Text className="text-sm text-gray-500 pl-5 justify-center align-middle">{item.description}</Text>
      </View>
      <Text className="text-sm font-bold text-primary-300 align-middle">{item.score}</Text>
    </View>
  );

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-black-300">Safety Parameters</Text>
        <FlatList
          data={safetyParameters}
          renderItem={renderParameterItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        />
      </View>
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-black-300">Real-time Safety Score</Text>
        <BarChart
          data={{
            labels: ["Braking", "Acceleration", "Cornering", "Speeding"],
            datasets: [
              {
                data: chartData.map(value => isNaN(value) ? 0 : value), // Ensure no NaN values
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Parameters;
