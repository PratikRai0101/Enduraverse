import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Client, Databases } from "appwrite"; // Import Appwrite client and databases

// Mock implementation of calculateSafetyScore function
const calculateSafetyScore = (accel_x: number, accel_y: number, accel_z: number, param1: any, param2: any) => {
  // Replace this with the actual logic to calculate the safety score
  const score = 100 - (Math.abs(accel_x) + Math.abs(accel_y) + Math.abs(accel_z));
  return { score: Math.max(0, score) };
};

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
  .setProject('67b57be1003052aa6282'); // Your project ID

const databases = new Databases(client);

const pastRides = [
  {
    id: "1",
    name: "Ride to Downtown",
    date: "2023-10-01",
    image: "https://via.placeholder.com/150",
    mileage: "15 km/l",
  },
  {
    id: "2",
    name: "Ride to Airport",
    date: "2023-09-25",
    image: "https://via.placeholder.com/150",
    mileage: "12 km/l",
  },
];

const drivingBehavior = [
  {
    id: "1",
    type: "Braking",
    severity: "Moderate",
  },
  {
    id: "2",
    type: "Acceleration",
    severity: "Severe",
  },
];

const safetyScores = [
  {
    id: "1",
    parameter: "Overall Safety",
    score: "85%",
  },
  {
    id: "2",
    parameter: "Speeding",
    score: "90%",
  },
];

const screenWidth = Dimensions.get("window").width;

const History = () => {
  const [realTimeSafetyScore, setRealTimeSafetyScore] = useState<number>(100);

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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderRideItem = ({ item }: { item: { id: string; name: string; date: string; image: string; mileage: string } }) => (
    <View className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
      <Image source={{ uri: item.image }} className="w-16 h-16 rounded-lg" />
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold">{item.name}</Text>
        <Text className="text-sm text-gray-500">{item.date}</Text>
      </View>
      <Text className="text-sm font-bold text-primary-300">{item.mileage}</Text>
    </View>
  );

  const renderBehaviorItem = ({ item }: { item: { id: string; type: string; severity: string } }) => (
    <View className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
      <Text className="text-lg font-bold">{item.type}</Text>
      <Text className="text-sm text-gray-500">{item.severity}</Text>
    </View>
  );

  const renderScoreItem = ({ item }: { item: { id: string; parameter: string; score: string } }) => (
    <View className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
      <Text className="text-lg font-bold">{item.parameter}</Text>
      <Text className="text-sm text-gray-500">{item.score}</Text>
    </View>
  );

  return (
    <SafeAreaView className="h-full bg-white">
      <FlatList
        ListHeaderComponent={
          <>
            <View className="px-5 py-4">
              <Text className="text-2xl font-bold text-black-300">Past Rides</Text>
              <FlatList
                data={pastRides}
                renderItem={renderRideItem}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-4"
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View className="px-5 py-4">
              <Text className="text-2xl font-bold text-black-300">Driving Behavior</Text>
              <FlatList
                data={drivingBehavior}
                renderItem={renderBehaviorItem}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-4"
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View className="px-5 py-4">
              <Text className="text-2xl font-bold text-black-300">Safety Scores</Text>
              <FlatList
                data={safetyScores}
                renderItem={renderScoreItem}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-4"
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View className="px-5 py-4">
              <Text className="text-2xl font-bold text-black-300">Real-time Safety Score</Text>
              <LineChart
                data={{
                  labels: ["0s", "1s", "2s", "3s", "4s", "5s"],
                  datasets: [
                    {
                      data: [
                        realTimeSafetyScore || 0,
                        realTimeSafetyScore - 5 || 0,
                        realTimeSafetyScore - 10 || 0,
                        realTimeSafetyScore - 15 || 0,
                        realTimeSafetyScore - 20 || 0,
                        realTimeSafetyScore - 25 || 0,
                      ],
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
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
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </>
        }
        data={[]}
        renderItem={null}
        contentContainerStyle={{ paddingBottom: 100 }} // Allow more scrolling
      />
    </SafeAreaView>
  );
};

export default History;
