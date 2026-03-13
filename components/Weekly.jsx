import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from "react-redux";


const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Generate 12-hour format time ranges like "12 AM - 1 AM", "1 AM - 2 AM", etc.
const hours = Array.from({ length: 24 }, (_, i) => {
  const start = i % 12 === 0 ? 12 : i % 12;
  const end = (i + 1) % 12 === 0 ? 12 : (i + 1) % 12;
  const periodStart = i < 12 ? "AM" : "PM";
  const periodEnd = i + 1 < 12 ? "AM" : "PM";
  return `${start} ${periodStart} - ${end} ${periodEnd}`;
});

export default function Weekly() {
  const [routine, setRoutine] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState({ day: "", hour: "" });
  const [tempText, setTempText] = useState("");
  const [currentTime, setCurrentTime] = useState({ day: "", hourIndex: null });
  const [loading, setLoading] = useState(true);
  const Theme = useSelector((state) => state.profile.theme);
  const THEMES = {
    light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
    dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
  };



  // Determine current day and hour index every minute
  useEffect(() => {
    // Load routine from AsyncStorage on mount
    const loadRoutine = async () => {
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem("weeklyRoutine");
        if (stored) setRoutine(JSON.parse(stored));
      } catch (e) {
        // handle error if needed
      } finally {
        setLoading(false);
      }
    };
    loadRoutine();
  }, []);

  useEffect(() => {
    // Save routine to AsyncStorage whenever it changes
    const saveRoutine = async () => {
      //console.log(routine);
      try {
        await AsyncStorage.setItem("weeklyRoutine", JSON.stringify(routine));

      } catch (e) {
        console.error("Error saving routine:", e);
      }
    };
    if (Object.keys(routine).length > 0) {
      saveRoutine();
    }
  }, [routine]);
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dayIndex = (now.getDay() + 6) % 7; // Sunday=0, we want Monday=0
      const hourIndex = now.getHours();
      setCurrentTime({ day: days[dayIndex], hourIndex });
    };

    updateTime();
    const interval = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openEdit = (day, hour) => {
    setSelected({ day, hour });
    setTempText(routine[`${day}-${hour}`] || "");
    setModalVisible(true);
  };

  const saveEdit = () => {
    setRoutine((prev) => ({
      ...prev,
      [`${selected.day}-${selected.hour}`]: tempText,
    }));
    setModalVisible(false);
  };

  return (
    <View style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor }} className="flex-1 pt-12">
      {loading && (
        <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
      <Text className="text-2xl font-bold text-center text-blue-500 mb-3">
        Weekly Routine
      </Text>


      <ScrollView horizontal>
        <View>
          {/* Header Row */}
          <View className="flex-row">
            <View className="w-20" />
            {days.map((day) => (
              <View
                key={day}
                className={`w-28 p-2 border bg-blue-500 rounded-xl border-white`}
              >
                <Text className="text-center text-white font-semibold">{day}</Text>
              </View>
            ))}

          </View>



          {/* Body */}
          <ScrollView style={{ height: "85%" }}>

            {hours.map((hour, hourIndex) => (
              <View key={hour} className="flex-row" >
                {/* Time Label */}
                <View className="w-20 bg-blue-100 border border-gray-200 items-center justify-center px-1 py-2">
                  <Text className="text-blue-800 text-xs text-center">{hour}</Text>
                </View>

                {/* Cells for each day */}
                {days.map((day) => {
                  const key = `${day}-${hour}`;
                  //console.log(day);
                  const isCurrent =
                    currentTime.day === day && currentTime.hourIndex === hourIndex;

                  return (
                    <TouchableOpacity
                      key={key}
                      className={`w-28 h-14 border border-gray-200 items-center justify-center ${isCurrent ? "bg-blue-500" : currentTime.day == day ? "bg-blue-200" : "bg-white/40"
                        } rounded-sm`}
                      onPress={() => openEdit(day, hour)}
                    >
                      <Text
                        className={`text-center px-1 ${isCurrent
                          ? "text-white font-semibold"
                          : routine[key]
                            ? `text-${Theme === "dark" ? "white" : "blue-500"} `
                            : "text-black/20"
                          }`}
                        numberOfLines={2}
                      >
                        {routine[key] || "Edit"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md h-1/2 shadow-lg">
            <Text className="font-semibold text-blue-700 mb-3 text-lg text-center">
              Edit Routine ({selected.day} - {selected.hour})
            </Text>

            <ScrollView className="flex-1 mb-3">

              <TextInput
                value={tempText}
                onChangeText={setTempText}
                placeholder="Write your activity, goals, or notes here..."
                multiline
                textAlignVertical="top"
                className="border border-gray-300 rounded-lg p-3 min-h-[200px] text-base"
              />
            </ScrollView>

            <View className="flex-row justify-end items-center gap-4 space-x-5">
              <TouchableOpacity

                className="border-[1px] rounded-xl p-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-500 text-base">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-500 rounded-xl p-2"
                onPress={saveEdit}
              >
                <Text className="text-white font-bold text-base">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
