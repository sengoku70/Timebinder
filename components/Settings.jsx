import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native';
import { AntDesign,Feather } from '@expo/vector-icons';
import {setProfileimg,setUsername} from "../src/store";
import { useDispatch } from "react-redux";

const AVATARS = [
    require('../assets/img.jpg'),
    require('../assets/img2.jpg'),
    require('../assets/img3.jpg'),
];

export default function Settings() {
    const [profilePic, setProfilePic] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [theme, setTheme] = useState('light');
    const [uploadedImages, setUploadedImages] = useState([]);
    const dispatch = useDispatch();

    
    const THEMES = [
        { key: 'light', label: 'Light', backgroundColor: '#fff', textColor: '#000' },
        { key: 'dark', label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
    ];


  useEffect(() => {
    async function savetheme() {
        if (theme) {
            await AsyncStorage.setItem('theme', theme);
        }
    }
    savetheme();
}, [theme]);

    
useEffect(() => {
    (async () => {
    
        const savedProfilePic = await AsyncStorage.getItem('profilePic');
        if (savedProfilePic) {
            setProfilePic(savedProfilePic);
            setSelectedAvatar(null);
        }
    })();
}, []);

useEffect(() => {
    //console.log(setProfilePic(profilePic));
    dispatch(setProfileimg(profilePic));
    if (profilePic) {   
        AsyncStorage.setItem('profilePic', profilePic);
        
    }
    
}, [profilePic]);

const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"], // ✅ new way (array of strings)
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    setProfilePic(result.assets[0].uri);
    setSelectedAvatar(null);

    const newImages = [...uploadedImages, { uri: result.assets[0].uri }];
    setUploadedImages(newImages);
    await AsyncStorage.setItem("uploadedImages", JSON.stringify(newImages));
  }
};



    const renderAvatar = ({ item, index }) => (
        <TouchableOpacity
            onPress={() => {
                if (item.uri) {
                    setProfilePic(item.uri);
                    setSelectedAvatar(null);
                } else {
                    setSelectedAvatar(index);
                    setProfilePic(null);
                }
            }}
            className="mx-2 "
        >
            <Image
                source={item.uri ? { uri: item.uri } : item}
                className={`w-[50px] h-[50px] rounded-full border-2 ${((item.uri && profilePic === item.uri) || (!item.uri && selectedAvatar === index)) ? 'border-blue-500' : 'border-gray-300'}`}
            />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 items-center px-6 py-6 mt-[30px]">
            {/* Profile Section */}
            <View className="w-full mb-4 flex flex-row h-[200px] bg-indigo-100 rounded-2xl p-5 shadow items-start">
                <View className="items-center mr-4 relative">
                    {profilePic ? (
                        <Image
                            source={{ uri: profilePic }}
                            className="w-[70px] h-[70px] rounded-full border-2 flex justify-center items-center border-gray-400"
                        />
                    ) : selectedAvatar !== null ? (
                        <Image
                            source={AVATARS[selectedAvatar]}
                            className="w-[70px] h-[70px] rounded-full border-2 border-gray-400"
                        />
                    ) : (
                        <View className="w-[70px] h-[70px] rounded-full border-2 border-gray-400 bg-gray-200 items-center justify-center">
                            <Text style={{ color: theme.textColor }}>No Image</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={pickImage}
                        className="absolute top-20 right-0  rounded-full bg-blue-500 h-[30px] w-[30px] p-1 flex items-center justify-center"
                    >
                        <Text className='rounded-full'><AntDesign name="upload" color="white" size={20}/></Text>
                    </TouchableOpacity>
                </View>

                {/* Name and Avatars */}
                <View className="flex-1 ml-2 ">
                    <View className="mb-2">
                        <Text className="text-lg font-bold mb-1" style={{ color: theme.textColor }}>
                            Name
                        </Text>
                        <NameInput />
                    </View>
                    <Text className="text-lg font-bold mb-1" >
                        Select Avatar
                    </Text>
                    <FlatList
                        data={[...AVATARS, ...uploadedImages]}
                        renderItem={renderAvatar}
                        keyExtractor={(_, idx) => idx.toString()}
                        horizontal
                        className="my-2 "
                        contentContainerStyle={{ alignItems: 'center' }}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            </View>

            {/* Data Management Section */}
            <View className="w-full flex-row justify-between mt-4">
                <TouchableOpacity
                    className="flex-1 mr-2 bg-blue-500 py-3 rounded-xl items-center"
                    onPress={async () => {
                        const allKeys = await AsyncStorage.getAllKeys();
                        const allData = {};
                        for (const key of allKeys) {
                            allData[key] = await AsyncStorage.getItem(key);
                        }
                        // eslint-disable-next-line no-console
                        console.log('%c' + JSON.stringify(allData, null, 2), 'color: #2563eb; font-weight: bold;');
                    }}
                >
                    <Text className="text-white font-bold">Console Log All Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 ml-2 bg-red-500 py-3 rounded-xl items-center"
                    onPress={async () => {
                        await AsyncStorage.clear();
                        setProfilePic(null);
                        setSelectedAvatar(null);
                        setUploadedImages([]);
                        
                    }}
                >
                    <Text className="text-white font-bold">Erase All Data</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function NameInput() {
    const [name, setName] = React.useState('');
    const dispatch = useDispatch();
    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem('profileName');
            if (saved) setName(saved);
        })();
    }, []);
    const onChange = async (val) => {
        setName(val);
        console.log(val)
        await AsyncStorage.setItem('profileName', val);
        dispatch(setUsername(val))
        console.log(setUsername(val));
        
    };
    return (
        <TextInput
            value={name}
            onChangeText={onChange}
            placeholder="Enter your name"
            className="bg-white rounded px-3 py-2 border border-gray-300 text-gray-900"
        />
    );
}
