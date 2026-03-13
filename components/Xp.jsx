
import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Image, Animated, Dimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';

import Home from "./Home";
import Settings from "./Settings";
import Syllabus from "./Syllabus";
import Daytime from "./Daytime";
import Routine from "./Routine";
import Weekly from "./Weekly";
import StudyPlan from "./StudyPlan";
import { setProfileimg, setTheme, setUsername } from "../src/store";
import { navigationRef } from "../src/navigation";

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();

const AVATARS = [
  require('../assets/img.jpg'),
  require('../assets/img2.jpg'),
  require('../assets/img3.jpg'),
];

function Menu({ navigation, toggleBottom, retract }) {
  const profileimg = useSelector((state) => state.profile.profileimg);
  const username = useSelector((state) => state.profile.username);
  const Theme = useSelector((state) => state.profile.theme);
  const dispatch = useDispatch();

  const getProfileSource = () => {
    if (!profileimg) return null;
    if (typeof profileimg === 'string' && profileimg.startsWith('avatar:')) {
      const index = parseInt(profileimg.split(':')[1]);
      return AVATARS[index];
    }
    return typeof profileimg === 'string' ? { uri: profileimg } : profileimg;
  };

  const [quoteData, setQuoteData] = useState(null);
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -5, duration: 1000, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    const fetchQuote = async () => {
      try {
        const res = await axios.get('https://raw.githubusercontent.com/sengoku70/TimeBinder_syllabus/main/great_quotes.json');
        const quotes = res.data;
        if (quotes && quotes.length > 0) {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          setQuoteData(quotes[randomIndex]);
        }
      } catch (error) {
        console.error("Failed to fetch quotes", error);
      }
    };
    fetchQuote();
  }, []);

  return (
    <View className="flex flex-col flex-1 mt-[20px] gap-3 px-2">
      <View className="mb-6">
        <View className="flex-row items-center justify-between">
          <Text className={`text-2xl font-bold ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Menu</Text>
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }} className="bg-blue-500/20 px-2 py-1 rounded-full">
            <Text className={`text-xs flex items-center justify-center font-bold ${Theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>← slide left</Text>
          </Animated.View>
        </View>
        <Text className={`text-sm ${Theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Navigate through TimeBinder</Text>
      </View>

      <TouchableOpacity
        className="bg-blue-500/10 flex-row items-center h-[60px] px-5 rounded-2xl border border-blue-500/20"
        onPress={() => { navigationRef.navigate("Home"); toggleBottom(); }}
      >
        <View className="bg-blue-500 p-2 rounded-xl">
          <Feather name="home" size={20} color="white" />
        </View>
        <Text className={`font-semibold ml-4 ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-500/10 flex-row items-center h-[60px] px-5 rounded-2xl border border-blue-500/20"
        onPress={() => { navigationRef.navigate("Weekly"); toggleBottom(); }}
      >
        <View className="bg-blue-500 p-2 rounded-xl">
          <Feather name="calendar" size={20} color="white" />
        </View>
        <Text className={`font-semibold ml-4 ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Weekly Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-500/10 flex-row items-center h-[60px] px-5 rounded-2xl border border-blue-500/20"
        onPress={() => { navigationRef.navigate("Routine"); toggleBottom(); }}
      >
        <View className="bg-blue-500 p-2 rounded-xl">
          <Feather name="clock" size={20} color="white" />
        </View>
        <Text className={`font-semibold ml-4 ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Routine</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-500/10 flex-row items-center h-[60px] px-5 rounded-2xl border border-blue-500/20"
        onPress={() => { navigationRef.navigate("Syllabus"); toggleBottom(); }}
      >
        <View className="bg-blue-500 p-2 rounded-xl">
          <Feather name="book" size={20} color="white" />
        </View>
        <Text className={`font-semibold ml-4 ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Syllabus</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-500/10 flex-row items-center h-[60px] px-5 rounded-2xl border border-blue-500/20"
        onPress={() => { navigationRef.navigate("StudyPlan"); toggleBottom(); }}
      >
        <View className="bg-blue-500 p-2 rounded-xl">
          <View style={{ position: 'relative' }}>
            <Feather name="book-open" size={20} color="white" />
            <Ionicons name="sparkles" size={10} color="#fde68a" style={{ position: 'absolute', top: -4, right: -5 }} />
          </View>
        </View>
        <Text className={`font-semibold ml-4 ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Study Planner</Text>
      </TouchableOpacity >

      {quoteData && (
        <View className={`mt-auto flex-col justify-start mb-2 p-4 rounded-3xl border ${Theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
          <Feather name="message-square" size={16} color={Theme === 'dark' ? '#60a5fa' : '#3b82f6'} className="mb-1" />
          <Text className={`text-sm italic mb-2 ${Theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {`"${quoteData.quote}"`}
          </Text>
          <Text className={`text-xs font-semibold text-right ${Theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {`- ${quoteData.author}`}
          </Text>
        </View>
      )
      }

      <View className={`mb-20 p-4 rounded-3xl flex-row items-center justify-between ${Theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} ${!quoteData ? 'mt-auto' : ''}`}>
        <View className="flex-row items-center gap-3">
          <Image
            className="h-12 w-12 rounded-full border-2 border-blue-500"
            source={getProfileSource()}
          />
          <View>
            <Text className={`font-bold ${Theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{username}</Text>
            <Text className={`text-xs ${Theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Online</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => { navigationRef.navigate("Settings"); toggleBottom(); }}
            className={`p-3 rounded-xl ${Theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm'}`}
          >
            <Feather name="settings" size={20} color={Theme === 'dark' ? 'white' : '#334155'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Theme === "light" ? dispatch(setTheme("dark")) : dispatch(setTheme("light")); }}
            className={`p-3 rounded-xl ${Theme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm'}`}
          >
            <Ionicons name={Theme === 'light' ? "moon-outline" : "sunny-outline"} size={20} color={Theme === 'dark' ? 'white' : '#334155'} />
          </TouchableOpacity>
        </View>
      </View>
    </View >
  );
}

function Layout() {
  const [retract, setRetract] = useState(false);
  const bottomAnim = useState(new Animated.Value(0))[0];
  const OpacityAnim = useState(new Animated.Value(1))[0];
  const Theme = useSelector((state) => state.profile.theme);
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      const route = navigationRef.getCurrentRoute();
      if (route) setActiveTab(route.name);
    });
    return unsubscribe;
  }, []);

  const THEMES = {
    light: {
      label: 'Light',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      barBg: ['#ffffff', '#f1f5f9'],
      activeColor: '#3b82f6',
      inactiveColor: '#94a3b8'
    },
    dark: {
      label: 'Dark',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      barBg: ['#1e293b', '#0f172a'],
      activeColor: '#60a5fa',
      inactiveColor: '#64748b'
    },
  };

  const toggleBottom = () => {
    const isVisible = bottomAnim.__getValue() === 0;

    if (!retract && isVisible) {
      setRetract(true);
    } else {
      setRetract(false);
    }

    Animated.sequence([
      Animated.timing(bottomAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(retract ? 0 : 2500),
      Animated.timing(bottomAnim, {
        toValue: retract ? 0 : -width * 0.75,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    Animated.timing(OpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Syllabus" component={Syllabus} />
        <Stack.Screen name="Routine" component={Routine} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Weekly" component={Weekly} />
        <Stack.Screen name="StudyPlan" component={StudyPlan} />
      </Stack.Navigator>

      {retract && (
        <GestureHandlerRootView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
          <PanGestureHandler
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.END) {
                // Close menu on left swipe (translationX < -50)
                if (nativeEvent.translationX < -50) {
                  toggleBottom();
                }
              }
            }}
          >
            <View style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor, flex: 1 }} className="px-4 pt-20">
              <Menu navigation={navigationRef} toggleBottom={toggleBottom} Theme={Theme} retract={retract} />
            </View>
          </PanGestureHandler>
        </GestureHandlerRootView>
      )}

      {/* Bottom Bar */}
      <Animated.View
        style={{
          transform: [{ translateX: bottomAnim }],
          opacity: OpacityAnim,
          bottom: 25,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 15,
        }}
        className="absolute w-[92%] self-center h-16 rounded-[30px] overflow-hidden"
      >
        <LinearGradient
          colors={retract ? ['#3b82f6', '#2563eb'] : THEMES[Theme || 'light'].barBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 }}
        >
          <TouchableOpacity
            className="flex-1 items-center justify-center py-2"
            onPress={() => { navigationRef.navigate("Home"); setRetract(false); }}
          >
            <View style={activeTab === 'Home' && !retract ? { backgroundColor: THEMES[Theme || 'light'].activeColor, borderRadius: 999, padding: 10 } : { padding: 10 }}>
              <Feather
                name="home"
                size={22}
                color={retract ? 'white' : (activeTab === 'Home' ? 'white' : THEMES[Theme || 'light'].inactiveColor)}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center py-2"
            onPress={() => { navigationRef.navigate("StudyPlan"); setRetract(false); }}
          >
            <View style={activeTab === 'StudyPlan' && !retract ? { backgroundColor: THEMES[Theme || 'light'].activeColor, borderRadius: 999, padding: 10 } : { padding: 10 }}>
              <View style={{ position: 'relative' }}>
                <Feather
                  name="book-open"
                  size={22}
                  color={retract ? 'white' : (activeTab === 'StudyPlan' ? 'white' : THEMES[Theme || 'light'].inactiveColor)}
                />
                <Ionicons
                  name="sparkles"
                  size={10}
                  color={retract ? '#fde68a' : (activeTab === 'StudyPlan' ? '#fde68a' : THEMES[Theme || 'light'].inactiveColor)}
                  style={{ position: 'absolute', top: -5, right: -6 }}
                />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center py-2"
            onPress={() => { navigationRef.navigate("Routine"); setRetract(false); }}
          >
            <View style={activeTab === 'Routine' && !retract ? { backgroundColor: THEMES[Theme || 'light'].activeColor, borderRadius: 999, padding: 10 } : { padding: 10 }}>
              <Feather
                name="clock"
                size={22}
                color={retract ? 'white' : (activeTab === 'Routine' ? 'white' : THEMES[Theme || 'light'].inactiveColor)}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center py-2"
            onPress={() => { navigationRef.navigate("Syllabus"); setRetract(false); }}
          >
            <View style={activeTab === 'Syllabus' && !retract ? { backgroundColor: THEMES[Theme || 'light'].activeColor, borderRadius: 999, padding: 10 } : { padding: 10 }}>
              <Feather
                name="book"
                size={22}
                color={retract ? 'white' : (activeTab === 'Syllabus' ? 'white' : THEMES[Theme || 'light'].inactiveColor)}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center py-2"
            onPress={toggleBottom}
          >
            <View className={`p-2 rounded-full ${retract ? 'bg-white/20' : ''}`}>
              <Feather
                name={retract ? "x" : "menu"}
                size={22}
                color={retract ? "white" : THEMES[Theme || 'light'].inactiveColor}
              />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export default function Xp() {
  const dispatch = useDispatch();
  const Theme = useSelector((state) => state.profile.theme);

  const THEMES = {
    light: { label: 'Light', backgroundColor: '#f8fafc', textColor: '#0f172a' },
    dark: { label: 'Dark', backgroundColor: '#0f172a', textColor: '#f8fafc' },
  };

  useEffect(() => {
    (async () => {
      const savedname = await AsyncStorage.getItem('profileName');
      const savedimg = await AsyncStorage.getItem('profilePic');
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedname && savedname.trim() !== "") { dispatch(setUsername(savedname)); }
      if (savedimg) dispatch(setProfileimg(savedimg));
      if (savedTheme) dispatch(setTheme(savedTheme));
    })();
  }, [dispatch]);

  const isDark = Theme === 'dark';
  const MyTheme = {
    dark: isDark,
    colors: {
      primary: '#3b82f6',
      background: THEMES[Theme || 'light'].backgroundColor,
      card: THEMES[Theme || 'light'].backgroundColor,
      text: THEMES[Theme || 'light'].textColor,
      border: 'transparent',
      notification: '#3b82f6',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
      // React Navigation v7 also expects these:
      labelLarge: { fontFamily: 'System', fontWeight: '500', fontSize: 14, letterSpacing: 0.1, lineHeight: 20 },
      labelMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 12, letterSpacing: 0.5, lineHeight: 16 },
      labelSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 11, letterSpacing: 0.5, lineHeight: 16 },
      bodyLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 16, letterSpacing: 0.15, lineHeight: 24 },
      bodyMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 14, letterSpacing: 0.25, lineHeight: 20 },
      bodySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 12, letterSpacing: 0.4, lineHeight: 16 },
      titleLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 22, letterSpacing: 0, lineHeight: 28 },
      titleMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 16, letterSpacing: 0.15, lineHeight: 24 },
      titleSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 14, letterSpacing: 0.1, lineHeight: 20 },
      headlineLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 32, letterSpacing: 0, lineHeight: 40 },
      headlineMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 28, letterSpacing: 0, lineHeight: 36 },
      headlineSmall: { fontFamily: 'System', fontWeight: '400', fontSize: 24, letterSpacing: 0, lineHeight: 32 },
      displayLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 57, letterSpacing: -0.25, lineHeight: 64 },
      displayMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 45, letterSpacing: 0, lineHeight: 52 },
      displaySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 36, letterSpacing: 0, lineHeight: 44 },
    },
  };

  return (
    <NavigationContainer theme={MyTheme} ref={navigationRef}>
      <Layout />
    </NavigationContainer>
  );
}
