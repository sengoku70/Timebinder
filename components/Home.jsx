import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Pressable, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather } from '@expo/vector-icons';
import Timetable from './Timetable';
import { useSelector } from "react-redux";
import Timer from './Timer';


// Helper to generate random light vibrant colors
const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 90%, 80%)`;
};

// Format a timestamp (ms) to a short date string like "Mar 6"
const formatDate = (ts) => {
    const d = new Date(parseInt(ts));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
};

const THEMES = {
    light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
    dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};


const NOTES_KEY = 'STICKY_NOTES';


export default function Home() {
    const [notes, setNotes] = useState([]);
    const [modalVisible, setModalVisible] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [Rdata, setRdata] = useState('No routine');
    const [wData, setWdata] = useState('No weekly routine');
    const [today, setToday] = useState('0');
    const [datetoday, setdatetoday] = useState();
    const [question, setQuestion] = useState('0');
    const [Xp, setXp] = useState(0);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const Theme = useSelector((state) => state.profile.theme);

    //////////////////////////////


    const incxp = () => {
        if (datetoday == new Date().getDate()) {
            setToday(prev => parseInt(prev) + 1);
        } else {

            setToday(1);
        }

        setdatetoday(new Date().getDate())
        setQuestion(prev => parseInt(prev) + 1);

        let newXp = 0;
        if (today < 30) {
            newXp = Xp + 4;

        } else if (today < 40 && today >= 30) {
            newXp = Xp + 5;

        } else {
            newXp = Xp + 6;

        }
        setXp(newXp);

    }


    ////////////////////////////////////////////////////////Load data
    React.useEffect(() => {

        let datetoday = new Date().getDate();
        const loadData = async () => {
            try {
                const storedToday = await AsyncStorage.getItem('today');
                const storedQuestion = await AsyncStorage.getItem('question');
                const storedXp = await AsyncStorage.getItem('Xp');
                const datetoday = await AsyncStorage.getItem('datetoday');
                if (storedToday !== null) setToday(storedToday);
                if (storedQuestion !== null) setQuestion(storedQuestion);
                if (storedXp !== null) setXp(parseInt(storedXp));
                if (datetoday !== null) setdatetoday(parseInt(datetoday));
            } catch (e) {
                //                console.log('Failed to load data', e);
            }
        };
        loadData();

    }, []);
    /////////////////////////////////////////////////////////////////////////
    React.useEffect(() => {

        const saveData = async () => {
            try {

                await AsyncStorage.setItem('today', today.toString());
                await AsyncStorage.setItem('question', question.toString());
                await AsyncStorage.setItem('Xp', Xp.toString());
                //await AsyncStorage.setItem('datetoday', datetoday.toString());//causing problem 
            } catch (e) {
                //                console.log('Failed to save data', e);
            }
        };
        saveData();
    }, [today, question, Xp, datetoday]);


    //////////////////// Load notes from AsyncStorage//////////////////////////////
    useEffect(() => {

        (async () => {
            const rtitleStr = await AsyncStorage.getItem('rtitle');
            const data = rtitleStr ? JSON.parse(rtitleStr) : null;

            const weeklyRoutineStr = await AsyncStorage.getItem('weeklyRoutine');
            const weeklydata = weeklyRoutineStr ? JSON.parse(weeklyRoutineStr) : null;

            const saved = await AsyncStorage.getItem(NOTES_KEY);
            let date = new Date()
            setRdata(data && data[date.getHours()] ? data[date.getHours()] : "No routine");
            setNotes(saved ? JSON.parse(saved) : []);

            let weekData = null;
            if (weeklydata) {
                const dayKey = date.toLocaleString('default', { weekday: 'short' });
                const hourKey = (date.getHours() % 12 || 12) + (date.getHours() >= 12 ? ' PM' : ' AM');
                const nextHourKey = ((date.getHours() + 1) % 12 || 12) + ((date.getHours() + 1) >= 12 ? ' PM' : ' AM');
                const key = `${dayKey}-${hourKey} - ${nextHourKey}`;
                weekData = weeklydata[key];
            }

            if (weekData && weekData.trim() !== '') {
                setWdata(weekData);
            } else {
                setWdata("No weekly routine");
            }

            //wData.trim() == '' ? setWdata("No weekly routine set ") : wData;

            //console.log("wdata: ",wData);

            // console.log(
            // "Current routine:", 

            // date.toLocaleString('default', { weekday: 'short' }) +
            //     ' - ' +
            //     // current hour with AM/PM
            //     ((date.getHours() % 12 || 12) + (date.getHours() >= 12 ? ' PM' : ' AM')) +
            //     ' - ' +
            //     // next hour with AM/PM
            //     (((date.getHours() + 1) % 12 || 12) + ((date.getHours() + 1) >= 12 ? ' PM' : ' AM'))
            // );



        })();
    }, [NOTES_KEY]);


    //////////////////////////////////// Save notes to AsyncStorage
    const saveNotes = async (newNotes) => {
        setNotes(newNotes);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    };

    const addNote = () => {


        const color = getRandomColor();
        const newNote = {
            id: Date.now().toString(),
            text: noteText.trim(),
            color,
            createdAt: Date.now(),
        };
        const updatedNotes = [newNote, ...notes];
        setNoteText('');
        saveNotes(updatedNotes);
        setEditingNoteId(newNote.id);

    };

    // Remove note by id
    const removeNote = (id) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        saveNotes(updatedNotes);
    };

    // Split notes into two columns based on index
    const leftNotes = notes.filter((_, idx) => idx % 2 === 0);
    const rightNotes = notes.filter((_, idx) => idx % 2 === 1);



    // Save edited note
    const saveEditedNote = () => {

        const updatedNotes = notes.map(note =>
            note.id === editingNoteId ? { ...note, text: noteText } : note
        );
        saveNotes(updatedNotes);
        setEditingNoteId(null);
        setNoteText('');


    };

    return (
        <View className="flex-1 pt-12" style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor }}>
            {/* Floating Add Note Button */}
            <TouchableOpacity
                className="absolute z-10 bg-gray-300 border-blue-500 border-[3px] h-16 w-16 justify-center items-center rounded-full bottom-[110px] right-6 shadow-lg"
                onPress={() => {
                    addNote();
                }}
            >
                <AntDesign name="plus" size={36} color="black" />
            </TouchableOpacity>
            <View className='w-screen'><Timetable /></View>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    flexDirection: 'row',
                    padding: 8,
                }}
            >
                {/* Left Column */}
                <View className="w-1/2">
                    {/* Stats Card */}
                    <View className="bg-blue-600 p-4 m-2 rounded-xl overflow-hidden relative">
                        <View className="gap-2">
                            <View className="flex-row items-center">
                                <Feather name="box" size={18} color="white" />
                                <Text className="text-[15px] text-white ml-2">Questions: {question}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Feather name="sun" size={18} color="orange" />
                                <Text className="text-[15px] text-white ml-2">Today: {today}</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <Feather name="star" size={18} color="yellow" />
                                <Text className="text-[15px] text-white ml-2">Xp: {Xp}</Text>
                            </View>
                        </View>
                        <Pressable
                            className="bg-white/20 rounded-xl h-10 w-10 absolute right-0 bottom-0 shadow-lg justify-center items-center"
                            onPress={incxp}
                        >
                            <AntDesign name="plus" size={20} color="white" />
                        </Pressable>
                    </View>
                    {/* Notes */}
                    {leftNotes.map(note => (
                        <TouchableOpacity
                            key={note.id}
                            onPress={() => {

                                setModalVisible(note.id);

                            }}
                            activeOpacity={0.8}
                        >
                            <View
                                className="m-2 rounded-2xl p-3 max-h-36 w-[92%] justify-center shadow"
                                style={{ backgroundColor: note.color }}
                            >
                                <View className="flex-col justify-between items-start h-full">
                                    <View className="flex-row justify-between w-full">
                                        <TouchableOpacity
                                            onPress={() => removeNote(note.id)}
                                            className="mb-2"
                                            accessibilityLabel="Cut note"
                                        >
                                            <AntDesign name="close" size={20} color="black" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setNoteText(note.text);
                                                setEditingNoteId(note.id);



                                            }}
                                            className="mb-2 ml-2"
                                            accessibilityLabel="Edit note"
                                        >
                                            <AntDesign name="edit" size={20} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-gray-800 flex-1">{note.text}</Text>
                                    <Text className="text-[10px] text-gray-500 mt-1">{formatDate(note.createdAt || note.id)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Right Column */}
                <View className="w-1/2 flex flex-col">

                    <Timer />
                    {/* Routine Card */}


                    <View className="h-fit flex-row justify-evenly items-center p-2 bg-indigo-300 m-2 rounded-xl shadow">
                        <View className="bg-blue-500 rounded-xl h-[75px] w-[50px] border-dotted border-2 border-white flex justify-center items-center">
                            <Text className="text-[30px] font-bold text-white">
                                {new Date().getHours() > 12 ? new Date().getHours() - 12 : new Date().getHours()}
                            </Text>
                            <Text className="text-[16px] font-semibold text-white">
                                {new Date().getHours() > 12 ? "PM" : "AM"}
                            </Text>
                        </View>
                        <View className='w-[75%] gap-1'>
                            <Text className="text-base overflow-hidden w-[86%] bg-white/50 rounded-lg px-1 font-normal ml-2">{Rdata}</Text>
                            <Text className="text-base overflow-hidden w-[86%] bg-white/50 rounded-lg px-1 font-normal ml-2">{wData}</Text>
                        </View>
                    </View>




                    {/* Notes */}
                    {rightNotes.map(note => (
                        <TouchableOpacity
                            key={note.id}
                            onPress={() => {

                                setModalVisible(note.id);
                            }}
                            activeOpacity={0.8}
                        >
                            <View
                                className="m-2 rounded-2xl p-3 max-h-36 w-[92%] justify-center shadow"
                                style={{ backgroundColor: note.color }}
                            >
                                <View className="flex-col justify-between items-start h-full">
                                    <View className="flex-row items-center justify-between w-full">
                                        <TouchableOpacity
                                            onPress={() => removeNote(note.id)}
                                            className="mb-2"
                                            accessibilityLabel="Cut note"
                                        >
                                            <AntDesign name="close" size={20} color="black" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingNoteId(note.id);
                                                setNoteText(note.text);


                                            }}
                                            className="mb-2 ml-2"
                                            accessibilityLabel="Edit note"
                                        >
                                            <AntDesign name="edit" size={20} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-gray-800 flex-1">{note.text}</Text>
                                    <Text className="text-[10px] text-gray-500 mt-1">{formatDate(note.createdAt || note.id)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Note View Modal */}





            <Modal
                visible={modalVisible !== null}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setModalVisible(null);
                    setEditingNoteId(null);

                }}
            >
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View
                        className="w-4/5 max-w-[380px] min-w-[320px] max-h-[70%] bg-white rounded-3xl p-5 shadow-lg"
                        style={{
                            backgroundColor: notes.find(n => n.id === modalVisible)?.color || '#fff',
                        }}
                    >
                        <ScrollView className="max-h-72">
                            <Text className="text-lg text-gray-900 mb-4">
                                {notes.find(n => n.id === modalVisible)?.text}
                            </Text>
                        </ScrollView>
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                className="border-[1px] border-white px-4 py-2 rounded-xl mr-2"
                                onPress={() => {
                                    setModalVisible(null);

                                }}
                            >
                                <Text className="text-white  font-bold">Close</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add/Edit Note Modal */}
            <Modal
                visible={editingNoteId !== null}
                transparent
                animationType="slide"
            >
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View className="bg-white w-72 rounded-3xl p-5 shadow-lg">
                        <TextInput
                            className="min-h-[60px] border border-gray-200 rounded-xl p-3 mb-4 text-base bg-gray-50"
                            placeholder="Type your note..."
                            value={noteText}
                            onChangeText={setNoteText}
                            multiline
                            textAlignVertical="top"
                        />
                        <View className="flex-row justify-between">


                            <TouchableOpacity
                                className="bg-green-600 px-4 py-2 rounded-xl min-w-[48%] items-center"
                                onPress={() => {
                                    if (noteText.trim() != '') {
                                        //console.log("note: " ,noteText);
                                        saveEditedNote()
                                        setEditingNoteId(null);
                                        setNoteText('');
                                    }
                                }}
                            >

                                <Text className="text-white font-bold">Save</Text>
                            </TouchableOpacity>



                            <TouchableOpacity
                                className="bg-red-400 px-4 py-2 rounded-xl min-w-[48%] items-center"
                                onPress={() => {
                                    const textinnote = notes.find(note => note.id === editingNoteId)?.text || "";

                                    if (noteText.trim() == '' && textinnote == '') {
                                        removeNote(editingNoteId);
                                        setEditingNoteId(null);


                                    } else {

                                        const noteToEdit = notes.find(note => note.id === editingNoteId);
                                        setNoteText(noteToEdit ? noteToEdit.text : "")

                                        if (textinnote === '') {
                                            removeNote(editingNoteId);
                                        }
                                        setEditingNoteId(null);
                                        setNoteText('');

                                    }
                                }
                                }
                            >
                                <Text className="text-white font-bold">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
