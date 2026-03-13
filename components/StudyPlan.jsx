import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { Feather, AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadSyllabusFromDB, saveStudyPlanToDB, loadStudyPlanFromDB } from '../src/db';

const THEMES = {
    light: { label: 'Light', backgroundColor: '#fff', textColor: '#000', cardBg: '#f3f4f6', borderColor: '#e5e7eb' },
    dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff', cardBg: '#333', borderColor: '#444' },
};

export default function StudyPlan() {
    const Theme = useSelector((state) => state.profile.theme);
    const themeStyles = THEMES[Theme || 'light'];

    const [studyHoursPerDay, setStudyHoursPerDay] = useState('4');
    const [hoursPerTopic, setHoursPerTopic] = useState('2');
    const [goalDate, setGoalDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [plan, setPlan] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const syllabusItems = await loadSyllabusFromDB();
            if (syllabusItems) {
                setSubjects(syllabusItems);
            }
            const savedPlan = await loadStudyPlanFromDB();
            if (savedPlan) setPlan(savedPlan);
        } catch (e) {
            console.log('Failed to load plan data', e);
        } finally {
            setLoading(false);
        }
    };

    const generatePlan = async () => {
        setLoading(true);
        const hoursDay = parseFloat(studyHoursPerDay);
        const hoursTopic = parseFloat(hoursPerTopic);

        if (isNaN(hoursDay) || isNaN(hoursTopic) || hoursDay <= 0 || hoursTopic <= 0) {
            Alert.alert('Invalid Input', 'Please enter valid hours.');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(goalDate);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 0) {
            Alert.alert('Invalid Date', 'Goal date must be in the future.');
            return;
        }

        // Group unfinished topics by subject
        let topicsBySubject = {};
        subjects.forEach(subject => {
            let subjectTopics = [];
            subject.chapters.forEach(chapter => {
                chapter.topics.forEach(topic => {
                    if (!topic.done) {
                        subjectTopics.push({
                            id: topic.id,
                            title: topic.title,
                            subjectTitle: subject.title,
                            subjectId: subject.id,
                            remainingHours: hoursTopic
                        });
                    }
                });
            });
            if (subjectTopics.length > 0) {
                topicsBySubject[subject.id] = subjectTopics;
            }
        });

        const activeSubjectIds = Object.keys(topicsBySubject);
        if (activeSubjectIds.length === 0) {
            Alert.alert('No Topics', 'All topics are marked as done or syllabus is empty.');
            return;
        }

        const generatedPlan = [];
        let totalTopicsRemaining = 0;
        activeSubjectIds.forEach(sid => {
            totalTopicsRemaining += topicsBySubject[sid].length;
        });

        let subjectPointer = 0;

        for (let d = 0; d < diffDays; d++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + d);

            const daySchedule = {
                date: currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                assignments: {} // subjectId -> [topics]
            };

            let workHoursRemaining = hoursDay;
            let subjectsAttemptedThisDay = 0;

            // Try to assign topics in a round-robin fashion
            while (workHoursRemaining > 0 && totalTopicsRemaining > 0 && subjectsAttemptedThisDay < activeSubjectIds.length * 2) {
                const sid = activeSubjectIds[subjectPointer % activeSubjectIds.length];
                const subjectQueue = topicsBySubject[sid];

                if (subjectQueue && subjectQueue.length > 0) {
                    const topic = subjectQueue[0];
                    const timeToSpend = Math.min(workHoursRemaining, topic.remainingHours);

                    if (!daySchedule.assignments[sid]) {
                        daySchedule.assignments[sid] = [];
                    }

                    daySchedule.assignments[sid].push({
                        title: topic.title,
                        hours: timeToSpend
                    });

                    topic.remainingHours -= timeToSpend;
                    workHoursRemaining -= timeToSpend;

                    if (topic.remainingHours <= 0) {
                        subjectQueue.shift();
                        totalTopicsRemaining--;
                    }
                }

                subjectPointer++;
                subjectsAttemptedThisDay++;
            }

            generatedPlan.push(daySchedule);
            if (totalTopicsRemaining === 0) break;
        }

        setPlan(generatedPlan);
        await saveStudyPlanToDB(generatedPlan);

        if (totalTopicsRemaining > 0) {
            Alert.alert('Warning', 'Could not fit all topics in the given timeframe. Try increasing study hours or extending the goal date.');
        }
        setLoading(false);
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) setGoalDate(selectedDate);
    };

    const deletePlan = async () => {
        Alert.alert(
            "Delete Study Plan",
            "Are you sure you want to delete your generated study plan?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setPlan(null);
                        await saveStudyPlanToDB(null);
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1" style={{ backgroundColor: themeStyles.backgroundColor, paddingTop: 50 }}>
            {loading && (
                <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            )}
            <Text className="text-2xl font-bold mx-4 mb-4" style={{ color: themeStyles.textColor }}>Study Planner</Text>

            {/* Input Section */}
            <View className="p-4 mx-4 rounded-xl mb-4" style={{ backgroundColor: themeStyles.cardBg }}>
                <View className="flex-row justify-between items-center mb-3">
                    <Text style={{ color: themeStyles.textColor }}>Study Hours / Day:</Text>
                    <TextInput
                        value={studyHoursPerDay}
                        onChangeText={setStudyHoursPerDay}
                        keyboardType="numeric"
                        style={{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor, borderBottomWidth: 1, borderBottomColor: themeStyles.borderColor, width: 60, textAlign: 'center' }}
                    />
                </View>

                <View className="flex-row justify-between items-center mb-3">
                    <Text style={{ color: themeStyles.textColor }}>Hours / Topic:</Text>
                    <TextInput
                        value={hoursPerTopic}
                        onChangeText={setHoursPerTopic}
                        keyboardType="numeric"
                        style={{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor, borderBottomWidth: 1, borderBottomColor: themeStyles.borderColor, width: 60, textAlign: 'center' }}
                    />
                </View>

                <View className="flex-row justify-between items-center mb-4">
                    <Text style={{ color: themeStyles.textColor }}>Goal Date:</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} className="p-2 bg-blue-500 rounded-md">
                        <Text className="text-white">{goalDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={goalDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                    />
                )}

                <View className="flex-row justify-between mt-2 gap-2">
                    {plan && (
                        <TouchableOpacity onPress={deletePlan} className="bg-red-500 py-3 rounded-xl items-center flex-1">
                            <Text className="text-white font-bold">Delete Plan</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={generatePlan} className="bg-blue-600 p-3 rounded-xl items-center flex-1">
                        <Text className="text-white font-bold">{plan ? "Regenerate Plan" : "Generate Study Plan"}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Plan Display */}
            {plan ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
                    <View>
                        {/* Header Row */}
                        <View className="flex-row border-b" style={{ borderColor: themeStyles.borderColor }}>
                            <View className="w-20 p-2 border-r" style={{ borderColor: themeStyles.borderColor, backgroundColor: themeStyles.cardBg }}>
                                <Text className="font-bold text-xs" style={{ color: themeStyles.textColor }}>Date</Text>
                            </View>
                            {subjects.map(sub => (
                                <View key={sub.id} className="w-40 p-2 border-r items-center" style={{ borderColor: themeStyles.borderColor, backgroundColor: themeStyles.cardBg }}>
                                    <Text className="font-bold text-xs" style={{ color: themeStyles.textColor }} numberOfLines={1}>{sub.title}</Text>
                                </View>
                            ))}
                        </View>

                        {/* List Rows */}
                        <ScrollView showsVerticalScrollIndicator={true}>
                            {plan.map((day, idx) => (
                                <View key={idx} className="flex-row border-b" style={{ borderColor: themeStyles.borderColor }}>
                                    <View className="w-20 p-2 border-r justify-center" style={{ borderColor: themeStyles.borderColor }}>
                                        <Text className="text-[10px]" style={{ color: themeStyles.textColor }}>{day.date}</Text>
                                    </View>
                                    {subjects.map(sub => (
                                        <View key={sub.id} className="w-40 p-2 border-r" style={{ borderColor: themeStyles.borderColor }}>
                                            {day.assignments[sub.id] ? (
                                                day.assignments[sub.id].map((topic, tIdx) => (
                                                    <View key={tIdx} className="bg-blue-100 rounded p-1 mb-1">
                                                        <Text className="text-[9px] text-blue-800 font-semibold">{topic.title}</Text>
                                                        <Text className="text-[8px] text-blue-600">{topic.hours}h</Text>
                                                    </View>
                                                ))
                                            ) : null}
                                        </View>
                                    ))}
                                </View>
                            ))}
                            <View className="h-40" />
                        </ScrollView>
                    </View>
                </ScrollView>
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Feather name="calendar" size={100} color={themeStyles.borderColor} />
                    <Text className="mt-4" style={{ color: themeStyles.textColor }}>No plan generated yet.</Text>
                </View>
            )}
        </View>
    );
}
