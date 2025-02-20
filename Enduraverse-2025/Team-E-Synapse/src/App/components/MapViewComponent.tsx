import React, { memo } from "react";
import { ActivityIndicator, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import icons from "@/constants/icons";
import * as Location from "expo-location";

interface MapViewComponentProps {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({ location, errorMsg }) => {
  if (location) {
    return (
      <MapView
        style={{ width: "100%", height: 200, marginTop: 10 }}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="You are here"
          image={icons.carPark}
        />
      </MapView>
    );
  } else if (errorMsg) {
    return (
      <Text className="text-base font-rubik text-red-500 mt-5">
        {errorMsg}
      </Text>
    );
  } else {
    return (
      <ActivityIndicator
        size="large"
        className="text-primary-300 mt-5"
      />
    );
  }
};

export default memo(MapViewComponent);
