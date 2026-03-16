
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Platform, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';



export default function DateProgressBox() {
  const [goalDate, setGoalDate] = useState(null);
  const navigation = useNavigation();
  const [startDate,setstartDate]  = useState(null); 
  const [goalTitle,setGoalTitle]  = useState(null);




  function getProgressPercentage(startDate, goalDate) {
  if (!startDate || !goalDate) return 0; // safety check

  // Convert to Date objects (in case they are strings)
  const start = new Date(startDate);
  const goal = new Date(goalDate);
  const today = new Date();

  // Make sure time part doesn’t interfere
  start.setHours(0, 0, 0, 0);
  goal.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const totalDays = (goal - start) / (1000 * 60 * 60 * 24); // total days between start and goal
  const passedDays = (today - start) / (1000 * 60 * 60 * 24); // days passed from start

  // clamp value between 0 and 100
  const percentage = Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
  //console.log("Progress Percentage:", percentage+5);
  return  Number(percentage+1); // round to 2 decimals
} 


useEffect(() => {
  const loadData = async () => {
    const start = await AsyncStorage.getItem("startDate");
    const goaldate = await AsyncStorage.getItem("goalDate");
    const title = await AsyncStorage.getItem("goalTitle");
    setGoalDate(goaldate ? new Date(goaldate) : null);
    setstartDate(start ? new Date(start) : null);
    setGoalTitle(title ? title : null);
    //console.log("loaded:", start, goaldate);
  };
  loadData();
}, []);

useEffect(() => {
  const saveData = async () => {
    //console.log("change detected in goatitle0",goalTitle);
    await AsyncStorage.setItem("startDate", startDate ? startDate.toISOString() : "");
    await AsyncStorage.setItem("goalDate", goalDate ? goalDate.toISOString() : "");
    await AsyncStorage.setItem("goalTitle", goalTitle ? goalTitle : "");
    //console.log("saved date goal:", startDate, goalDate);
  };
  saveData();
}, [goalDate, startDate, goalTitle]);

  // format the selected date for display 
  const formattedDate = goalDate
    ? goalDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <View className="overflow-hidden rounded-xl bg-gray-300 justify-center h-[50px] mx-5">
      
      {goalDate ? (
        <View className="h-[50px] flex item-center">
        <View className="bg-blue-500 h-full mr-auto"  style={{ width: `${getProgressPercentage(startDate, goalDate)}%`}}>
         
        </View>
        <View className="absolute right-1 flex-row  justify-between items-center h-full flex ">

            <View className="bg-blue-200/80 mx-2 h-[40px] w-fit rounded-full flex items-center justify-center">
              
              <TextInput
                    className="placeholder:text-white rounded-xl p-3 text-base font-bold text-gray-800"
                    placeholder="Enter Goal Title"
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                    multiline
                    textAlignVertical="top"
                  />
            </View>

            <Text  className="p-1 text-[14px] font-semibold rounded-xl text-gray-800">
             Goal: {formattedDate}
            </Text>
          
        </View>
      </View>

      ) : (
        <Pressable onPress={() => navigation.navigate("StudyPlan")} className="w-full h-full">
          <View className="flex-row justify-center items-center gap-2 py-2 w-full h-full">
            <Feather name="target" size={22} color="#333" />
            <Text className="text-base text-gray-700">Generate a Study Plan to track your Goal</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
