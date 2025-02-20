import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapViewComponent from "@/components/MapViewComponent";
import { ProgressCircle } from "react-native-svg-charts";
import * as Location from "expo-location";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import { Card } from "@/components/Cards";
import { useAppwrite } from "@/lib/useappwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { getProperties } from "@/lib/appwrite";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCERIhE_mz6mX3_-oOAXlalDwyp2548P_Q",
  authDomain: "test-endurance.firebaseapp.com",
  databaseURL: "https://test-endurance-default-rtdb.firebaseio.com",
  projectId: "test-endurance",
  storageBucket: "test-endurance.firebasestorage.app",
  messagingSenderId: "969810682887",
  appId: "1:969810682887:web:7ee34a84248b85622136a2",
  measurementId: "G-GBVSS29BR0",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const dummyParameters = [
  {
    id: "1",
    name: "Brake Efficiency",
    value: "85%",
    icon: icons.shield, // Replace with an existing property from the icons object
  },
  {
    id: "2",
    name: "Tire Pressure",
    value: "32 PSI",
    icon: icons.wifi, // Replace with an existing property from the icons object
  },
  {
    id: "3",
    name: "Engine Health",
    value: "Good",
    icon: icons.carPark,
  },
  {
    id: "4",
    name: "Battery Status",
    value: "75%",
    icon: icons.language,
  },
];

const filterOptions = ["All", "Brake", "Tire", "Engine", "Battery"];

const filterParameters = (filter: string) => {
  if (!filter || filter === "All") return dummyParameters;
  return dummyParameters.filter((param) =>
    param.name.toLowerCase().includes(filter.toLowerCase())
  );
};

const alertMessages = [
  "Please drive carefully!",
  "Check your vehicle's condition!",
  "Slow down and stay safe!",
];

const getRandomAlert = () => {
  const randomIndex = Math.floor(Math.random() * alertMessages.length);
  return alertMessages[randomIndex];
};

const Home = () => {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();

  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredParameters = filterParameters(selectedFilter);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const { data: properties, refetch, loading } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
      limit: 6,
    },
    skip: true,
  });

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState("");
  const [safetyScore, setSafetyScore] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [mileage, setMileage] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [rideHistory, setRideHistory] = useState<any[]>([]);

  let prevSpeed = 0;
  let totalDistance = 0;
  const fuelEfficiencyFactor = 15;

  useEffect(() => {
    refetch({
      filter: params.filter!,
      query: params.query!,
      limit: 6,
    });
  }, [params.filter, params.query]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  useEffect(() => {
    const sensorRef = ref(database, "sensorData");

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        let latestData = data;
        if (typeof data === "object" && !data.accelX) {
          latestData = Object.values(data).pop();
        }

        const accel = latestData.accelX || 0;
        const timeInterval = 1;

        const currentSpeed = prevSpeed + accel * timeInterval;
        totalDistance += currentSpeed * timeInterval;
        setDistance(parseFloat(totalDistance.toFixed(2)));

        const estimatedMileage = fuelEfficiencyFactor / (Math.abs(accel) + 1);
        setMileage(parseFloat(estimatedMileage.toFixed(2)));

        const newSafetyScore = Math.max(
          0,
          Math.min(100, safetyScore - Math.abs(accel) * 5)
        );
        setSafetyScore(parseFloat(newSafetyScore.toFixed(2)));

        const updatedAlerts = [];
        if (Math.abs(accel) > 2) updatedAlerts.push("High acceleration detected!");
        if (currentSpeed > 120) updatedAlerts.push("Overspeeding detected!");
        if (newSafetyScore < 50) updatedAlerts.push(getRandomAlert());
        setAlerts(updatedAlerts);

        prevSpeed = currentSpeed;
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        const { coords } = newLocation;
        setSpeed(coords.speed || 0);
      }
    );

    return () => {
      locationSubscription.then((subscription) => subscription.remove());
    };
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 0.75) return "#4caf50";
    if (progress > 0.60) return "yellow";
    return "red";
  };

  const getEmoji = (progress: number) => {
    if (progress >= 0.75) return "😊";
    if (progress > 0.50) return "😟";
    return "☠️";
  };

  const handleCardPress = (id: string) => router.push(`/parameters/${id}`);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12 && hour > 5) return "Good Morning";
    if (hour < 18 && hour >= 12) return "Good Afternoon";
    return "Good Evening";
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRideHistory([]);
    Alert.alert("Journey Started", "Your journey has started.");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const newRide = {
      id: (rideHistory.length + 1).toString(),
      name: `Ride on ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleString(),
      image: "https://via.placeholder.com/150",
      mileage: `${mileage.toFixed(2)} km/l`,
    };
    setRideHistory((prevHistory) => [...prevHistory, newRide]);
    Alert.alert("Journey Ended", "Your journey has ended.");
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item }) => (
          <Card item={item} onPress={() => handleCardPress(item.$id)} />
        )}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : (
            <NoResults />
          )
        }
        ListHeaderComponent={() => (
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row">
                <Image
                  source={{ uri: user?.avatar }}
                  className="size-12 rounded-full"
                />
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">
                    {getGreeting()}
                  </Text>
                  <Text className="text-base font-rubik-medium text-black-300">
                    {user?.name}
                  </Text>
                </View>
              </View>
              <Image source={icons.bell} className="size-6" />
            </View>
            <Search />
            <View className="my-5">
              <Text className="text-xl font-rubik-bold text-black-300">
                Current Location
              </Text>
              <MapViewComponent
                location={location}
                errorMsg={locationError || "Location unavailable"}
              />
            </View>
            <View className="flex flex-col items-center mt-5">
              <ProgressCircle
                style={{ height: 150, width: 150 }}
                progress={safetyScore / 100}
                progressColor={getProgressColor(safetyScore / 100)}
                backgroundColor={"#e0e0e0"}
                startAngle={-Math.PI * 0.8}
                endAngle={Math.PI * 0.8}
              >
                <Text
                  style={{
                    position: "relative",
                    left: "90%",
                    top: "0%",
                    transform: [{ translateX: "-50%" }, { translateY: "35%" }],
                  }}
                  className="text-3xl"
                >
                  {getEmoji(safetyScore / 100)}
                </Text>
              </ProgressCircle>
              <Text className="text-xl font-rubik-bold text-black-300 mt-3">
                Safety Score: {safetyScore}%
              </Text>
              <View className="flex flex-row items-center justify-between mt-3 w-full px-5">
                <Text className="text-base font-rubik-medium text-black-300">
                  Speed: {speed.toFixed(2)} m/s
                </Text>
                <Text className="text-base font-rubik-medium text-black-300">
                  Mileage: {mileage} km/l
                </Text>
              </View>
              <View className="mt-5 w-full px-5">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Real-time Alerts
                </Text>
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <Text
                      key={index}
                      className="text-base font-rubik-medium text-red-500 mt-2"
                    >
                      {alert}
                    </Text>
                  ))
                ) : (
                  <Text className="text-base font-rubik-medium text-black-300 mt-2">
                    No alerts
                  </Text>
                )}
              </View>
              <View className="flex flex-row mt-5">
                <TouchableOpacity
                  onPress={handleStartRecording}
                  className="bg-green-500 px-4 py-2 rounded-full mr-2"
                  disabled={isRecording}
                >
                  <Text className="text-white font-rubik-bold">Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStopRecording}
                  className="bg-red-500 px-4 py-2 rounded-full"
                  disabled={!isRecording}
                >
                  <Text className="text-white font-rubik-bold">Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="mt-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Vehicle Safety Parameters
                </Text>
                <TouchableOpacity>
                  <Text className="text-base font-rubik-bold text-primary-300">
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex flex-row justify-around mt-3">
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleFilterChange(option)}
                    className={`px-4 py-2 rounded-full ${
                      selectedFilter === option
                        ? "bg-gray-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-base font-rubik-bold ${
                        selectedFilter === option
                          ? "text-black-300"
                          : "text-black-300"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <FlatList
                data={filteredParameters}
                horizontal
                renderItem={({ item }) => (
                  <View className="flex flex-col items-center m-2">
                    <Image
                      source={item.icon}
                      className="size-24 rounded-full"
                    />
                    <Text className="text-base font-rubik-medium text-black-300 mt-2">
                      {item.name}
                    </Text>
                    <Text className="text-base font-rubik-medium text-black-300">
                      {item.value}
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;