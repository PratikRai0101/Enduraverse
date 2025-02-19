import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as tf from "@tensorflow/tfjs";
import * as np from "numjs";
import { Client, Databases } from "appwrite"; // Import Appwrite client and databases

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

export const calculateSafetyScore = (
  accel_x: number,
  accel_y: number,
  accel_z: number,
  prev_accel_magnitude: number | null,
  prev_time: number | null
) => {
  const current_time = Date.now() / 1000;
  const time_diff = prev_time ? current_time - prev_time : 1;

  const accel_magnitude = Math.sqrt(accel_x ** 2 + accel_y ** 2 + accel_z ** 2);
  const jerk = prev_accel_magnitude
    ? (accel_magnitude - prev_accel_magnitude) / time_diff
    : 0;
  const braking_force = -accel_z;
  let score = 100;

  if (accel_magnitude > 3) {
    score -= 10;
  }
  if (braking_force > 2) {
    score -= 10;
  }
  if (Math.abs(jerk) > 2) {
    score -= 15;
  }

  score = Math.max(0, score);
  return { score, accel_magnitude, current_time };
};

export const useSafetyScore = () => {
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [prevAccelMagnitude, setPrevAccelMagnitude] = useState<number | null>(null);
  const [prevTime, setPrevTime] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await databases.listDocuments('67b57da3000fd43c619a', '67b5a262002bc11c0b92');
        const data = response.documents[0]; // Assuming you want the first document

        const accel_x = data.accel_x;
        const accel_y = data.accel_y;
        const accel_z = data.accel_z;

        const { score, accel_magnitude, current_time } = calculateSafetyScore(
          accel_x,
          accel_y,
          accel_z,
          prevAccelMagnitude,
          prevTime
        );

        setSafetyScore(score);
        setPrevAccelMagnitude(accel_magnitude);
        setPrevTime(current_time);

        console.log(`Real-time Safety Score: ${score}`);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, [prevAccelMagnitude, prevTime]);

  return safetyScore;
};

const History = () => {
  // const safetyScore = useSafetyScore();

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

          </>
        }
        data={[]}
        renderItem={null}
        // ListFooterComponent={
        //   <View className="px-5 py-4">
        //     <Text className="text-2xl font-bold text-black-300">
        //       Real-time Safety Score
        //     </Text>
        //     <Text className="text-lg font-bold text-primary-300 justify-center align-middle">
        //       {safetyScore.toFixed(2)}
        //     </Text>
        //   </View>
        // }
      />
    </SafeAreaView>
  );
};

export default History;
