import React from 'react';
import { View, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';

export default function Report() {
  return (
    <View className="bg-blue-500 p-3 mt-10 h-1/2 rounded-2xl overflow-hidden">
      {/* Image container */}
      <View className="relative rounded-2xl overflow-hidden">
        <Image
          source={require("./adaptive-icon.png")}
          className="w-full h-full rounded-2xl"
          resizeMode="cover"
        />

        {/* Fade from bottom */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Blur View at bottom */}
        <BlurView intensity={10} tint="light" className="absolute bottom-0 w-full h-20 rounded-2xl overflow-hidden" />

      </View>
    </View>
  );
}

