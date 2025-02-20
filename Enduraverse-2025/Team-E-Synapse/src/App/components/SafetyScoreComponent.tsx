import React, { memo } from "react";
import { View, Text } from "react-native";
import { ProgressCircle } from "react-native-svg-charts";

interface SafetyScoreComponentProps {
  safetyScore: number;
  speed: number;
  getProgressColor: (progress: number) => string;
}

const SafetyScoreComponent: React.FC<SafetyScoreComponentProps> = ({ safetyScore, speed, getProgressColor }) => {
  return (
    <View style={{ flexDirection: "column", alignItems: "center", marginTop: 20 }}>
      <ProgressCircle
        style={{ height: 150, width: 150 }}
        progress={safetyScore / 100}
        progressColor={getProgressColor(safetyScore / 100)}
        backgroundColor={"#e0e0e0"}
        startAngle={-Math.PI * 0.8}
        endAngle={Math.PI * 0.8}
      />
      <Text style={{ fontSize: 20, fontFamily: "Rubik-Bold", color: "#4a4a4a", marginTop: 10 }}>
        Safety Score: {safetyScore}%
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, width: "100%", paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: "Rubik-Medium", color: "#4a4a4a" }}>
          Speed: {speed} km/h
        </Text>
        <Text style={{ fontSize: 16, fontFamily: "Rubik-Medium", color: "#4a4a4a" }}>
          Mileage: -- km/l
        </Text>
      </View>
    </View>
  );
};

export default memo(SafetyScoreComponent);
