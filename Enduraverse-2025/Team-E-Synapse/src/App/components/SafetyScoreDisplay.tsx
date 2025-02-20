import { View, Text } from "react-native";
import { ProgressCircle } from "react-native-svg-charts";
import React, { memo } from "react";

interface SafetyScoreDisplayProps {
  safetyScore: number;
  speed: number;
  getProgressColor: (progress: number) => string;
}

const getProgressColor = (progress: number) => {
  if (progress >= 0.75) return "#4caf50";
  if (progress > 0.60) return "yellow";
  return "red";
};

const SafetyScoreDisplay: React.FC<SafetyScoreDisplayProps> = ({ safetyScore, speed, getProgressColor }) => {
    return (
      <View className="flex flex-col items-center mt-5">
        <ProgressCircle
          style={{ height: 150, width: 150 }}
          progress={safetyScore / 100}
          progressColor={getProgressColor(safetyScore / 100)}
          backgroundColor={"#e0e0e0"}
          startAngle={-Math.PI * 0.8}
          endAngle={Math.PI * 0.8}
        />
        <Text className="text-xl font-rubik-bold text-black-300 mt-3">
          Safety Score: {safetyScore}%
        </Text>
        <View className="flex flex-row items-center justify-between mt-3 w-full px-5">
          <Text className="text-base font-rubik-medium text-black-300">
            Speed: {speed} km/h
          </Text>
          <Text className="text-base font-rubik-medium text-black-300">
            Mileage: -- km/l
          </Text>
        </View>
      </View>
    );
}

export default memo(SafetyScoreDisplay);
