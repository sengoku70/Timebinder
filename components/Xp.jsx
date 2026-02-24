
import React, { useState,useEffect } from "react";
import { Text, View, TouchableOpacity, Image, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import {AntDesign,Feather,Ionicons} from '@expo/vector-icons';
import Home from "./Home";
import Settings from "./Settings";
import Syllabus from "./Syllabus";
import Daytime from "./Daytime";
import Routine from "./Routine";
import Weekly from "./Weekly";
//import Report from "./Report";

import { useDispatch } from "react-redux";
import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();

function Menu({ navigation, toggleBottom, retract }) {
 
  const profileimg = useSelector((state) => state.profile.profileimg);
  const username = useSelector((state) => state.profile.username);
  const Theme = useSelector((state) => state.profile.theme);
  const dispatch = useDispatch();
  


  
  return (
    <View 
     onRequestClose={() => {
          toggleBottom();
   
      }}
    
    className="flex flex-col h-[89%] mt-[10px] gap-2 px-1" >
      <TouchableOpacity
        className="bg-blue-500 flex-row items-center h-[50px] px-5 py-3 rounded-xl"
        onPress={() => { navigation.navigate("Home"); toggleBottom(); }}
      >
        <Feather name="home" size={30} color="white"/>
        <Text className="text-white font-semibold ml-[20px]"> Home</Text>
      </TouchableOpacity>
       <TouchableOpacity
        className="bg-blue-500 flex-row items-center h-[50px] px-5 py-3 rounded-xl"
        onPress={() => { navigation.navigate("Weekly"); toggleBottom(); }}
      >
        <Feather name="calendar" size={30} color="white"/>
        <Text className="text-white font-semibold ml-[20px]">weekly calendar</Text>
      </TouchableOpacity> 
      {/* <TouchableOpacity
        className="bg-blue-500 flex-row items-center h-[50px] px-5 py-3 rounded-xl"
        onPress={() => { navigation.navigate("Daytime"); toggleBottom(); }}
      >
        <Feather name="sun" size={30} color="white" />
        <Text className="text-white font-semibold ml-[20px]"> Day Time</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        className="bg-blue-500 flex-row items-center px-5 h-[50px] py-3 rounded-xl"
        onPress={() => { navigation.navigate("Routine"); toggleBottom(); }}
      >
        <Feather name="clock" size={30} color="white" />
        <Text className="text-white  font-semibold ml-[20px]"> Routine</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        className="bg-blue-500 flex-row items-center px-5 py-3 h-[50px] rounded-xl"
        onPress={() => { navigation.navigate("Report"); toggleBottom(); }}
      >
        <Feather name="book" color="white" size={30}/>
        <Text className="text-white  font-semibold ml-[20px]">Report</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        className="bg-blue-500 flex-row items-center px-5 py-3 h-[50px] rounded-xl"
        onPress={() => { navigation.navigate("Syllabus"); toggleBottom(); }}
      >
        <Feather name="book" color="white" size={30}/>
        <Text className="text-white  font-semibold ml-[20px]">Syllabus</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-blue-500 flex-row items-center justify-between px-5 h-[50px] mt-auto rounded-xl"
        
      >
        <View className="flex-row items-center gap-3">
          
          <Image
            className="h-10 w-10 rounded-full bg-gray-300"
            
            source={{ uri: profileimg }}
          />
          <Text className="text-white font-semibold ml-[10px]">{username}</Text>
        </View>
        <View className="flex-row items-center gap-4 ">
          <Text onPress={() => { navigation.navigate("Settings"); toggleBottom(); }} className="text-white "><Feather name="settings" size={30}/></Text>
          <TouchableOpacity  onPress={() => {Theme === "light"? dispatch(setTheme("dark")): dispatch(setTheme("light"));}} className="text-white "><Ionicons name="contrast-outline" size={30} color='white'/></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function Layout() {
  const [retract, setRetract] = useState(false);
  const bottomAnim = useState(new Animated.Value(0))[0];
  const OpacityAnim = useState(new Animated.Value(1))[0];
  const Theme = useSelector((state) => state.profile.theme);
  
 const THEMES = {
  light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
  dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};
   

  const toggleBottom = () => {
   
   
    
    //console.log(retract,bottomAnim );
    !retract && bottomAnim.__getValue() ==0 ? setRetract(true) :setRetract(false);
    Animated.timing(bottomAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      
      Animated.timing(bottomAnim, {
        toValue: -305,
        delay: 1500,
        duration: 300,
        useNativeDriver: true,
      }
    ).start();

    })
    
    Animated.timing(OpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      
      Animated.timing(OpacityAnim, {
        toValue: 0.4,
        delay: 1500,
        duration: 300,
        useNativeDriver: true,
      }).start();

      
    });

    
    
  };

  

  return (
    <View className="flex-1">
      {/* Screens */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Syllabus" component={Syllabus} />
        {/* <Stack.Screen name="Daytime" component={Daytime} /> */}
        <Stack.Screen name="Routine" component={Routine} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Weekly" component={Weekly} />
        {/* <Stack.Screen name="Report" component={Report} /> */}
      </Stack.Navigator>

      {/* Menu overlay (shows when retract=true) */}
      {retract && (
        
        <View style={{ backgroundColor : THEMES[Theme].backgroundColor}}  className={`absolute top-0 left-0 right-0 bottom-16 h-screen px-4 pt-20`}>
          <Menu navigation={navigationRef} toggleBottom={toggleBottom} Theme={Theme} retract={retract}/>
        </View>
      )}

      {/* Bottom Bar */}
      <Animated.View style={{ transform: [{ translateX: bottomAnim }], opacity: OpacityAnim, backgroundColor: retract ? "rgb(59, 130, 246)" : "rgb(219, 234, 254)"}} className="absolute bottom-0 w-[96%] self-center flex-row items-center justify-around py-3 bg-blue-100 h-[50px] rounded-2xl">
        <TouchableOpacity  className="flex justify-center h-full items-center w-1/5" onPress={() => {navigationRef.navigate("Home");setRetract(false);}}>
           <Feather name="home" size={20} color="black" />
        </TouchableOpacity>
         <TouchableOpacity className="flex justify-center h-full items-center w-1/5" onPress={() => {navigationRef.navigate("Weekly");setRetract(false);}}>
          <Feather name="calendar" size={20} color="black" />
        </TouchableOpacity> 
        <TouchableOpacity className="flex justify-center h-full items-center w-1/5" onPress={() => {navigationRef.navigate("Routine");setRetract(false);}}>
          <Feather name="sun" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity className="flex justify-center h-full items-center w-1/5"  onPress={() => {navigationRef.navigate("Syllabus");setRetract(false);}}>
          <Feather name="book"  size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity className="flex justify-center items-center w-1/5" style={{backgroundColor : retract? "": "transparent", }} onPress={toggleBottom}>
          <Feather name="menu" size={20} color={retract? "white": "black"} />
        </TouchableOpacity>
        
      </Animated.View>
    </View>
  );
}


// Global navigation ref so bottom bar can control navigation
import { createNavigationContainerRef } from "@react-navigation/native";
import { setProfileimg, setTheme, setUsername } from "../src/store";
export const navigationRef = createNavigationContainerRef();



export default function Xp() {
  
  const despatch = useDispatch();
  const Theme = useSelector((state) => state.profile.theme);
    
 const THEMES = {
  light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
  dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};  
useEffect(() => {
      (async () => {
            const savedname = await AsyncStorage.getItem('profileName');
            const savedimg = await AsyncStorage.getItem('profilePic');
            const savedTheme = await AsyncStorage.getItem('theme')
            if (savedname.trim() != ""){ despatch(setUsername(savedname));}
            despatch(setProfileimg(savedimg));
            despatch(setTheme(savedTheme));
        })();
  }, []);
  return (
    <NavigationContainer style={{ backgroundColor : THEMES[Theme].backgroundColor}} ref={navigationRef}>
       
      <Layout />
    </NavigationContainer>
  );
}
