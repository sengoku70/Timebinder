import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Routine = () => {
  const [rtitle, setRtitle] = useState(Array(24).fill(''));
  const [form, setForm] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [title, setTitle] = useState('');
  const [fromTime, setFromTime] = useState('AM');
  const [toTime, setToTime] = useState('AM');

  const currentHour = new Date().getHours() + 1; // Make 1–24 based

  // ✅ Convert 12-hour + AM/PM to 24-hour index (1–24)
  const to24Hour = (hour, period) => {
    
    console.log("hour:",period == "AM" ?  hour : Number(hour) + Number(12) );
    
    return period == "AM" ?  hour : Number(hour) + Number(12);
  };

  

  // ✅ Save the routine
  const saveRoutine = () => {
    if (!title || from === '' || to === '') return;
   
    const start = to24Hour(from, fromTime);
    const end = to24Hour(to, toTime); 
    const arr = [...rtitle];
    console.log("start:",start,"end:",end);

    // Only fill the exact range, not extra
    for (let i = start-1; i <= end-1; i++) {
      arr[i] = title;
      
    }
    
    console.log(arr);                          
    setRtitle(arr);
    setForm(false);
    setTitle('');
    setFrom('');
    setTo('');
  };

  // ✅ Clear the selected range
  const clearRoutine = () => {
    if (!from || !to) return;

    const start = to24Hour(from, fromTime);
    const end = to24Hour(to, toTime);
    const arr = [...rtitle];

    for (let i = start - 1; i <= end - 1; i++) {
      arr[i] = '';
      console.log(i);
    }

    setRtitle(arr);
    setForm(false);
    setTitle('');
    setFrom('');
    setTo('');
  };

  // ✅ Card color logic
  const getItemColor = (hour) => {
    if (hour === currentHour-1) return 'bg-blue-400';
    if (rtitle[hour - 1] !== '') return 'bg-indigo-300';
    return 'bg-white';
  };

  // ✅ Load from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('rtitle');
        if (stored) setRtitle(JSON.parse(stored));
      } catch (e) {
        console.log('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  // ✅ Save to storage
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('rtitle', JSON.stringify(rtitle));
      } catch (e) {
        console.log('Failed to save data', e);
      }
    };
    saveData();
  }, [rtitle]);

  return (
    
    <View className="">
      
      <ScrollView className="w-screen h-screen overflow-hidden">
        <View className="flex flex-col flex-wrap gap-2 mt-[50px] pl-[3%] h-screen w-screen">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i + 1;
            const hour12 = hour > 12 ? hour - 12 : hour;
            const period = hour > 12 ? 'PM' : 'AM';
            return (
              <TouchableOpacity
                key={hour}
                className={`flex flex-row rounded-md overflow-hidden justify-start items-center px-[15px] ${getItemColor(hour)} border-neutral-400 shadow-lg w-[48%] h-[7.5%]`}
                onPress={() => {setFrom(hour <= 12 ? hour : hour-12),setFromTime(hour <= 12 ? "AM" : "PM"),setTo(hour <= 12 ? hour : hour-12),setToTime(hour+1 <= 12 ? "AM" : "PM"),setForm((prev) => !prev)}}
              >
                <View className="bg-blue-500 rounded-full w-[50px] h-[50px] flex justify-center items-center shadow-2xl">
                  <Text className="text-white">
                    {hour12 === 0 ? 12 : hour12} {period}
                  </Text>
                </View>
                <Text className="ml-[10px] w-[67%]">{rtitle[hour - 1]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ✅ Form */}
      {form && (
        <View className="absolute self-center rounded-md p-[10px] mt-[50%] bg-gray-100 flex justify-evenly gap-2 w-[200px] z-10">
          <TextInput
            
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            className="w-full h-[50px] pl-2 bg-neutral-300 rounded-md"
          />

          {/* From */}
          <View className="flex-row">
            <TextInput
              value={from.toString()}
              onChangeText={(text) => {text <= 12 ? setFrom(text) : ""}}
              placeholder="From"
              keyboardType="numeric"
              className="w-[80%] h-[50px] pl-2 bg-neutral-300 rounded-l-md"
            />
            <Pressable
              onPress={() => setFromTime((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
              className="flex justify-center items-center bg-blue-500 w-[20%] rounded-r-md"
            >
              <Text className="text-white">{fromTime}</Text>
            </Pressable>
          </View>

          {/* To */}
          <View className="flex-row">
            <TextInput
              value={to.toString()}
              onChangeText={(text) => {text <= 12 ? setTo(text) : ""}}
              placeholder="To"
              keyboardType="numeric"
              className="w-[80%] h-[50px] pl-2 bg-neutral-300 rounded-l-md"
            />
            <Pressable
              onPress={() => setToTime((prev) => (prev === 'AM' ? 'PM' : fromTime == 'AM' ? 'AM' : 'PM'))}
              className="flex justify-center items-center bg-blue-500 w-[20%] rounded-r-md"
            >
              <Text className="text-white">{toTime}</Text>
            </Pressable>
          </View>

          {/* Buttons */}
          <View className="flex flex-row justify-between gap-2 items-center">
            <Pressable className="bg-blue-500 w-[48%] h-[50px] rounded-md" onPress={saveRoutine}>
              <Text className="py-4 text-center text-white">Save</Text>
            </Pressable>
            <Pressable className="bg-red-300 w-[48%] h-[50px] rounded-md" onPress={clearRoutine}>
              <Text className="py-4 text-center text-white">Remove</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ✅ Floating Button */}
      <Pressable
        onPress={() => setForm((prev) => !prev)}
        className="absolute bg-gray-200 border-blue-500 border-[3px] bottom-28 right-7 flex justify-center items-center h-[60px] w-[60px] rounded-full shadow-2xl"
      >
        <AntDesign name="plus" size={40} color="#3b82f6" />
      </Pressable>
    </View>
  );
};

export default Routine;
