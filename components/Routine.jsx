import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../src/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp } from 'react-native-reanimated';

const THEMES = {
  light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
  dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};

const Routine = () => {
  const [rtitle, setRtitle] = useState(Array(24).fill(''));
  const [form, setForm] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [title, setTitle] = useState('');
  const [fromTime, setFromTime] = useState('AM');
  const [toTime, setToTime] = useState('AM');

  const currentHour = new Date().getHours() + 1; // Make 1–24 based
  const Theme = useSelector((state) => state.profile.theme);

  const [templatesModel, setTemplatesModel] = useState(false);
  const [routineFiles, setRoutineFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  const REPO_CONTENTS_URL = 'https://api.github.com/repos/sengoku70/TimeBinder_syllabus/contents/routine%20templates';

  const fetchRoutineFiles = async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await axios.get(REPO_CONTENTS_URL);
      const files = res.data
        .filter(item => item.type === 'file')
        .map(item => ({ name: item.name, downloadUrl: item.download_url }));
      setRoutineFiles(files);
    } catch (e) {
      setFilesError('Failed to load templates. Check your connection.');
    } finally {
      setFilesLoading(false);
    }
  };

  const loadRoutineTemplate = async (downloadUrl) => {
    try {
      setFilesLoading(true);
      const res = await axios.get(downloadUrl);
      let parsedData = res.data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch (e) { }
      }
      if (Array.isArray(parsedData) && parsedData.length === 24) {
        setRtitle(parsedData);
      } else {
        alert('Invalid routine format received.');
      }
      setTemplatesModel(false);
    } catch (e) {
      console.error('Error loading template:', e);
      alert('Failed to load template.');
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (templatesModel) {
      fetchRoutineFiles();
    }
  }, [templatesModel]);

  const newheight = useSharedValue(180);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      newheight.value = 180 - e.translationY > 180 ? (180 - e.translationY) * 2 : 180;
    });

  const style = useAnimatedStyle(() => ({
    height: newheight.value,
  }));

  // ✅ Convert 12-hour + AM/PM to 24-hour index (1–24)
  const to24Hour = (hour, period) => {

    let h = parseInt(hour);
    if (period === "AM") {
      return h === 12 ? 0 : h;
    } else {
      return h === 12 ? 12 : h + 12;
    }
  };



  // ✅ Save the routine
  const saveRoutine = () => {
    if (!title || from === '' || to === '') return;

    const start = to24Hour(from, fromTime);
    let end = to24Hour(to, toTime);
    const arr = [...rtitle];

    if (end <= start && end === 0) end = 24;

    // Only fill the exact range, not extra
    for (let i = start; i < end; i++) {
      if (i >= 0 && i < 24) arr[i] = title;
    }

    //    console.log(arr);
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
    let end = to24Hour(to, toTime);
    const arr = [...rtitle];

    if (end <= start && end === 0) end = 24;

    for (let i = start; i < end; i++) {
      if (i >= 0 && i < 24) arr[i] = '';
    }

    setRtitle(arr);
    setForm(false);
    setTitle('');
    setFrom('');
    setTo('');
  };

  // ✅ Card color logic
  const getItemColor = (hour24) => {
    if (hour24 === currentHour - 1) return 'bg-blue-500 shadow-blue-500/50';
    if (rtitle[hour24] !== '') return Theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100';
    return Theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  };

  // ✅ Load from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('rtitle');
        if (stored) setRtitle(JSON.parse(stored));
        console.log(stored);
      } catch (e) {
        //        console.log('Failed to load data', e);
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
        //        console.log('Failed to save data', e);
      }
    };
    saveData();
  }, [rtitle]);

  return (

    <View className="flex-1" style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor }}>
      <Text className="text-2xl font-bold mt-12 mb-4 mx-4" style={{ color: THEMES[Theme || 'light'].textColor }}>Routine</Text>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex flex-row justify-between gap-4 mt-[10px] px-[2%] w-full">
          {/* AM Column */}
          <View className="flex-1 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const hour24 = i;
              const hour12 = hour24 === 0 ? 12 : hour24;
              const period = 'AM';
              return (
                <TouchableOpacity
                  key={hour24}
                  className={`flex flex-row rounded-md overflow-hidden justify-start items-center px-[10px] ${getItemColor(hour24)} border-[1px] ${Theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} shadow-sm w-full h-[60px]`}
                  onPress={() => {
                    setFrom(hour12);
                    setFromTime(period);
                    const nextH = (hour24 + 1) % 24;
                    setTo(nextH % 12 === 0 ? 12 : nextH % 12);
                    setToTime(nextH < 12 ? "AM" : "PM");
                    setForm((prev) => !prev);
                  }}
                >
                  <View className="bg-blue-500 rounded-full w-[45px] h-[45px] min-w-[45px] flex justify-center items-center shadow-2xl">
                    <Text className="text-white text-sm">
                      {hour12} {period}
                    </Text>
                  </View>
                  <Text className={`ml-[10px] w-[67%] text-base ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`} numberOfLines={2}>
                    {rtitle[hour24]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PM Column */}
          <View className="flex-1 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const hour24 = i + 12;
              const hour12 = hour24 === 12 ? 12 : hour24 - 12;
              const period = 'PM';
              return (
                <TouchableOpacity
                  key={hour24}
                  className={`flex flex-row rounded-md overflow-hidden justify-start items-center px-[10px] ${getItemColor(hour24)} border-[1px] ${Theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} shadow-sm w-full h-[60px]`}
                  onPress={() => {
                    setFrom(hour12);
                    setFromTime(period);
                    const nextH = (hour24 + 1) % 24;
                    setTo(nextH % 12 === 0 ? 12 : nextH % 12);
                    setToTime(nextH < 12 ? "AM" : "PM");
                    setForm((prev) => !prev);
                  }}
                >
                  <View className="bg-blue-500 rounded-full w-[45px] h-[45px] min-w-[45px] flex justify-center items-center shadow-2xl">
                    <Text className="text-white text-sm">
                      {hour12} {period}
                    </Text>
                  </View>
                  <Text className={`ml-[10px] w-[67%] text-base ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`} numberOfLines={2}>
                    {rtitle[hour24]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              onChangeText={(text) => { text <= 12 ? setFrom(text) : "" }}
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
              onChangeText={(text) => { text <= 12 ? setTo(text) : "" }}
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
            <Pressable className="bg-red-300 w-[48%] h-[50px] rounded-md" onPress={clearRoutine}>
              <Text className="py-4 text-center text-white">Remove</Text>
            </Pressable>
            <Pressable className="bg-blue-500 w-[48%] h-[50px] rounded-md" onPress={saveRoutine}>
              <Text className="py-4 text-center text-white">Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ✅ Floating Buttons */}
      <View className="absolute bottom-[110px] right-7 flex-col items-center gap-4">
        <Pressable
          onPress={() => setTemplatesModel(true)}
          className="bg-blue-500 flex justify-center items-center h-[50px] w-[50px] rounded-full shadow-2xl"
        >
          <Feather name="list" size={24} color="white" />
        </Pressable>
        <Pressable
          onPress={() => navigationRef.navigate("Weekly")}
          className="bg-blue-500 flex justify-center items-center h-[50px] w-[50px] rounded-full shadow-2xl"
        >
          <Feather name="calendar" size={24} color="white" />
        </Pressable>

        <Pressable
          onPress={() => setForm((prev) => !prev)}
          className="bg-blue-500 flex justify-center items-center h-[50px] w-[50px] rounded-full shadow-2xl"
        >
          <AntDesign name="plus" size={30} color="white" />
        </Pressable>
      </View>

      <Modal transparent visible={templatesModel} onRequestClose={() => { setTemplatesModel(false); }} animationType="slide">
        <View className="flex-1 bg-black/40">
          <GestureHandlerRootView className="z-20">
            <GestureDetector gesture={drag}>
              <Animated.View style={[style]} className="mt-auto p-4 bg-white rounded-t-2xl">
                <TouchableOpacity className="w-[15%] bg-black h-2 rounded-full self-center" />
                <View className="flex-row items-center justify-between mt-4 mb-4">
                  <Text className="text-lg font-semibold">Preloaded Routine Templates</Text>
                  <TouchableOpacity onPress={() => setTemplatesModel(false)} className="p-1 rounded-full bg-gray-200">
                    <Feather name="x" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                {filesLoading ? (
                  <View className="flex-1 items-center justify-center py-6">
                    <Text className="text-indigo-500 font-semibold">Loading templates…</Text>
                  </View>
                ) : filesError ? (
                  <View className="items-center py-4">
                    <Text className="text-red-500 mb-3">{filesError}</Text>
                    <TouchableOpacity onPress={fetchRoutineFiles} className="bg-blue-500 px-4 py-2 rounded-xl">
                      <Text className="text-white font-bold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView>
                    {routineFiles.map(file => (
                      <TouchableOpacity
                        key={file.name}
                        onPress={() => loadRoutineTemplate(file.downloadUrl)}
                        className="bg-indigo-100 p-4 rounded-xl mb-3 border border-indigo-200 shadow-sm"
                      >
                        <Text className="text-indigo-900 font-bold text-lg mb-1 capitalize">{file.name.replace('.json', '').replace(/-/g, ' ')}</Text>
                        <Text className="text-indigo-700 text-sm">Tap to import the {file.name.replace('.json', '').replace(/-/g, ' ')} template.</Text>
                      </TouchableOpacity>
                    ))}
                    {routineFiles.length === 0 && (
                      <Text className="text-gray-400 text-center py-6">No templates found.</Text>
                    )}
                  </ScrollView>
                )}
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        </View>
      </Modal>

    </View>
  );
};

export default Routine;
