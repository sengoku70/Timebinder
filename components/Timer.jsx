import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Feather, AntDesign, FontAwesome, Ionicons } from 'react-native-vector-icons';

// This component uses Tailwind classes (NativeWind) for styling.
// Make sure your project has nativewind and react-native-vector-icons set up.

export default function Timer() {
  const [mode, setMode] = useState('time'); // 'time' | 'timer' | 'stopwatch'

  // --- Time (clock) ---
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- Stopwatch ---
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // ms
  const swRef = useRef(null);
  useEffect(() => {
    if (swRunning) {
      const start = Date.now() - swElapsed;
      swRef.current = setInterval(() => setSwElapsed(Date.now() - start), 100);
    } else {
      if (swRef.current) {
        clearInterval(swRef.current);
        swRef.current = null;
      }
    }
    return () => clearInterval(swRef.current);
  }, [swRunning]);
  const formatMs = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const centis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${centis}`;
  };

  // --- Timer (countdown) ---
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60); // default 1 minute
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setTimerRunning(false);

            // Notification Alert and Vibration
            Vibration.vibrate([500, 500, 500]); // Vibrate pattern
            Notifications.scheduleNotificationAsync({
              content: {
                title: "Timer Finished!",
                body: "Your focus session has ended. Take a break!",
                sound: true,
              },
              trigger: null, // Send immediately
            });

            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);
  const formatTimer = (s) => {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <View className="bg-blue-600 pl-2 pt-2 m-2 rounded-xl overflow-hidden">
      {/* Header: mode switch */}
      <Text className='text-white text-[15px]'>Focus mode</Text>
      <View className="flex-row space-x-2 mt-2">
        <View className="flex-row items-center  justify-between">
          <TouchableOpacity onPress={() => setMode('time')} className={`px-3 py-1 rounded-full ${mode === 'time' ? 'bg-white/20' : ''}`}>
            <Feather name="clock" color="white" size={15} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('timer')} className={`px-3 py-1 rounded-full ${mode === 'timer' ? 'bg-white/20' : ''}`}>
            <Ionicons name="hourglass" color="white" size={15} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('stopwatch')} className={`px-3 py-1 rounded-full ${mode === 'stopwatch' ? 'bg-white/20' : ''}`}>
            <Feather name="pause-circle" color="white" size={15} />
          </TouchableOpacity>

        </View>
      </View>

      {/* Content area */}
      <View className="mt-4 mb-20"> {/* leave space for bottom buttons */}
        {mode === 'time' && (
          <View className="items-center">
            <Text className="text-white text-4xl font-mono">{now.toLocaleTimeString()}</Text>
            <Text className="text-white/80 mt-2">{now.toLocaleDateString()}</Text>
          </View>
        )}

        {mode === 'timer' && (
          <View className="items-center">
            <Text className="text-white text-5xl font-mono">{formatTimer(timerSeconds)}</Text>
            <View className="flex-row items-center mt-3 space-x-3 gap-1">
              <TouchableOpacity onPress={() => { setTimerSeconds((s) => Math.max(0, s - 60)); }} className="px-3 py-1 rounded-md bg-white/10">
                <Text className="text-white">-1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTimerSeconds((s) => s + 60); }} className="px-3 py-1 rounded-md bg-white/10">
                <Text className="text-white">+1</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setTimerSeconds((s) => s + 60 * 10); }} className="px-3 py-1 rounded-md bg-white/10">
                <Text className="text-white">+10</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {mode === 'stopwatch' && (
          <View className="items-center">
            <Text className="text-white text-5xl font-mono">{formatMs(swElapsed)}</Text>
            <View className="flex-row items-center mt-3 space-x-3">
              {/* <TouchableOpacity onPress={() => { setSwElapsed(0); setSwRunning(false); }} className="px-3 py-1 rounded-md bg-white/10">
                    <Feather name="refresh-cw" color="white" size={15} />
              </TouchableOpacity> */}
              {/* <TouchableOpacity onPress={() => setSwRunning((r) => !r)} className="px-3 py-1 rounded-md bg-white/10">
                <Feather name={swRunning ? 'pause' : 'play'} color = />
              </TouchableOpacity> */}
            </View>
          </View>
        )}
      </View>

      {/* Bottom buttons */}
      <View className="absolute bottom-3 left-3 right-3 flex-row justify-end ">
        {/* Left: action (depends on mode) */}
        <View className="flex-row ">
          {mode === 'timer' ? (
            <View className='flex-row gap-2'>
              <TouchableOpacity onPress={() => setTimerRunning((r) => !r)} className="flex-row ml-auto items-center px-3 py-2 rounded-lg bg-white/10">
                <Feather name={timerRunning ? 'pause' : 'play'} size={18} color="#fff" />
                <Text className="ml-2 text-white">{timerRunning ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setTimerSeconds(60); setTimerRunning(false); }} className="px-3 py-1 rounded-md flex justify-center bg-white/10">
                <Feather name="refresh-cw" color="white" size={15} />
              </TouchableOpacity>
            </View>
          ) : mode === 'stopwatch' ? (
            <View className='flex-row gap-2'>
              <TouchableOpacity onPress={() => setSwRunning((r) => !r)} className="flex-row  ml-auto items-center px-3 py-2 rounded-lg bg-white/10">
                <Feather name={swRunning ? 'pause' : 'play'} size={18} color="#fff" />
                <Text className="ml-2 text-white">{swRunning ? 'Stop' : 'Start'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setSwElapsed(0); setSwRunning(false); }} className="px-3 flex items-center justify-center py-1 rounded-md bg-white/10">
                <Feather name="refresh-cw" color="white" size={15} />
              </TouchableOpacity>
            </View>

          ) : (
            // <TouchableOpacity onPress={() => {}} className="flex-row items-center px-3 py-2 rounded-lg bg-white/10">
            //   <Feather name="clock" size={18} color="#fff" />
            //   <Text className="ml-2 text-white">Clock</Text>
            // </TouchableOpacity>
            null
          )}

        </View>

        {/* Right: secondary */}
        <View className="flex-row space-x-2">

          {/* <TouchableOpacity  className="px-3 py-2 rounded-lg bg-white/10 flex-row items-center">
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
}
