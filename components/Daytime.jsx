import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

const THEMES = {
  light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
  dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};


export default function Daytime() {
  const [date, setDate] = useState(new Date());

  React.useEffect(() => {
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000;

    const timeout = setTimeout(() => {
      setDate(new Date());
      const interval = setInterval(() => {
        setDate(new Date());
      }, 60000);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const hour = date.getHours();
  const minute = date.getMinutes();
  const time = 778 * (((hour * 60) + minute) / 1440);

  const [waketime, setWaketime] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [study, setstudy] = useState(0);
  const Theme = useSelector((state) => state.profile.theme);

  //  console.log(waketime, study)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const waketime = await AsyncStorage.getItem('waketime');
        const study = await AsyncStorage.getItem('study');
        setWaketime(JSON.parse(waketime));
        setstudy(JSON.parse(study));
        //console.log('waketime', waketime);

      } catch (e) {
        //        console.log('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  React.useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('waketime', JSON.stringify(waketime));
        await AsyncStorage.setItem('study', JSON.stringify(study));

      } catch (e) {
        //        console.log('Failed to save data', e);
      }
    };
    saveData();
  }, [waketime, study]);




  return (
    <View className="flex-1 items-center justify-end" style={{ backgroundColor: THEMES[Theme].backgroundColor }}>
      {/* Sleep time */}
      <View className="bg-neutral-950/60 mt-[25px] z-10 border-y-2 mb-auto border-dashed  border-red-500 h-[120px] w-full" />

      {/* Passed time */}
      <View className="absolute mt-auto w-screen items-start pt-[120px] bg-blue-600 border-t " style={{ height: time }}>
        {/* Time remaining */}
        <View className="bg-white h-[40px] ml-[10px] mb-5 z-10 pl-[10px] w-[40%] flex items-start justify-center rounded-md">
          <Text>{23 - hour} hr {60 - minute} min    Left</Text>
        </View>

        {/* Time now */}
        <View className="bg-white h-[40px] ml-[10px] w-[40%] z-10 pl-[10px] mb-5 flex items-start justify-center rounded-md">
          <Text>{hour} hr {minute} min   Passed</Text>
        </View>

        {/* study time block */}

        <View className="mt-auto mb-[0px] absolute bottom-0 w-screen ">
          {
            study === 0 ? (
              <View className="bg-white w-[70%] ml-[10px] h-[50px] rounded-md flex-row items-center overflow-hidden mb-5">
                <AntDesign name="book" className=' h-full w-[15%] text-center top-4' size={20} color="black" />
                <TextInput
                  keyboardType="numeric"
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="Set study time"
                  className="flex-1 pl-2"
                />
                <TouchableOpacity
                  onPress={() => {
                    const value = parseInt(inputValue);
                    setstudy(value);
                    setInputValue('');
                  }}
                  className=" w-[40px] h-full items-center justify-center"
                >
                  <AntDesign name="upload" size={20} color="black" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-green-200 w-screen items-center justify-center p-2" style={{ height: study * 34 }}>
                <Text>Study time: {study}</Text>
                <TouchableOpacity
                  onPress={() => setstudy(0)}
                  className="bg-green-400 mt-2 px-4 py-1 rounded-md"
                >
                  <Text>Reset</Text>
                </TouchableOpacity>
              </View>
            )
          }
          {/* wake time */}

          {
            waketime === 0 ? (
              <View className="bg-white ml-[10px] w-[70%] h-[50px] rounded-md flex-row items-center overflow-hidden mb-5">
                <Feather name="sun" className='h-full w-[15%] text-center top-4' size={20} color="black" />
                <TextInput
                  keyboardType="numeric"
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="Set wake time"
                  className="flex-1 pl-2"
                />
                <TouchableOpacity

                  onPress={() => {
                    const value = parseInt(inputValue);
                    setWaketime(value);
                    setInputValue('');
                  }}

                  className=" w-[40px] h-full items-center justify-center"
                >
                  <AntDesign name="arrowup" size={20} color="black" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-yellow-200  w-screen items-center justify-center p-2" style={{ height: waketime * 34 }}>
                <Text>Wake time: {waketime}</Text>
                <TouchableOpacity
                  onPress={() => setWaketime(0)}
                  className="bg-green-400 mt-2 px-4 py-1 rounded-md"
                >
                  <Text>Reset</Text>
                </TouchableOpacity>
              </View>
            )
          }
        </View>
      </View>
    </View>
  );
}

