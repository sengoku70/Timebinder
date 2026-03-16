import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import axios from 'axios';

const THEMES = {
  light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
  dark: { label: 'Dark', backgroundColor: '#222', textColor: '#fff' },
};
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp } from 'react-native-reanimated';
import { loadSyllabusFromDB, saveSyllabusToDB } from '../src/db';


const id = (p = '') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;



function SkeletonSubjectCard() {
  const pulse = useRef(new RNAnimated.Value(0.4)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <RNAnimated.View style={{ opacity: pulse }} className="mb-4 rounded-xl overflow-hidden bg-gray-200">
      {/* Header bar skeleton */}
      <View className="h-12 bg-blue-300 rounded-xl" />
      {/* Topic line skeletons */}
      <View className="px-3 py-3 gap-2 bg-indigo-100">
        <View className="h-5 w-3/4 bg-gray-300 rounded-md" />
        <View className="h-5 w-1/2 bg-gray-300 rounded-md" />
        <View className="h-5 w-2/3 bg-gray-300 rounded-md" />
      </View>
    </RNAnimated.View>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState('');
  const [subjectId, setSubjectId] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [text, setText] = useState('');
  const [preloadedModel, setPreloadedModel] = useState('');
  const [loading, setLoading] = useState(true);
  const Theme = useSelector((state) => state.profile.theme);

  const [syllabusFiles, setSyllabusFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  const REPO_CONTENTS_URL = 'https://api.github.com/repos/sengoku70/TimeBinder_syllabus/contents/syllabus';

  // Fetch list of available syllabus files from the GitHub repo
  const fetchSyllabusFiles = async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await axios.get(REPO_CONTENTS_URL);
      // Filter to only files (not directories), grab name + download_url
      const files = res.data
        .filter(item => item.type === 'file')
        .map(item => ({ name: item.name, downloadUrl: item.download_url }));
      setSyllabusFiles(files);
      setFilteredFiles(files);
    } catch (e) {
      setFilesError('Failed to load syllabus list. Check your connection.');
    } finally {
      setFilesLoading(false);
    }
  };

  // Generic loader: fetches any syllabus file by its raw download URL
  const loadSyllabus = async (downloadUrl) => {
    try {
      setLoading(true);
      const res = await axios.get(downloadUrl);
      let parsedData = res.data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch (e) { }
      }
      if (Array.isArray(parsedData)) {
        // Generate entirely fresh unique IDs to avoid SQLite collision
        const uniqueData = parsedData.map(subject => ({
          ...subject,
          id: id('s_'),
          chapters: (subject.chapters || []).map(chapter => ({
            ...chapter,
            id: id('c_'),
            topics: (chapter.topics || []).map(topic => ({
              ...topic,
              id: id('t_')
            }))
          }))
        }));
        setData(prevData => [...prevData, ...uniqueData]);
      } else {
        alert('Invalid syllabus format received.');
      }
      setPreloadedModel(false);
      setModalVisible(false);
    } catch (e) {
      console.error('Error loading syllabus:', e);
      alert('Failed to load syllabus.');
    } finally {
      setLoading(false);
    }
  };

  const newheight = useSharedValue(400);
  const context = useSharedValue(400);

  const drag = Gesture.Pan()
    .onBegin(() => {
      context.value = newheight.value;
    })
    .onUpdate((e) => {
      const nextHeight = context.value - e.translationY;
      newheight.value = nextHeight > 200 ? nextHeight : 200; // block from going too small
    });




  const style = useAnimatedStyle(() => ({
    height: newheight.value,
  }));

  const isFirstRender = useRef(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dbData = await loadSyllabusFromDB();
        if (dbData) setData(dbData);
      } catch (e) {
        console.error("Error loading syllabus from DB:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isFirstRender.current || loading) {
      if (!loading) isFirstRender.current = false;
      return;
    }

    // Log syllabus titles to the debug console
    if (data && data.length > 0) {
      const titles = data.map(subject => subject.title).join(', ');
      console.log(`[Syllabus] Loaded subjects: ${titles}`);
    } else {
      console.log(`[Syllabus] No subjects loaded yet.`);
    }

    saveSyllabusToDB(data);
  }, [data, loading]);

  // Fetch file list from GitHub whenever the preloaded model sheet opens
  useEffect(() => {
    if (preloadedModel) {
      fetchSyllabusFiles();
      setSearchQuery('');
    }
  }, [preloadedModel]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFiles(syllabusFiles);
    } else {
      const lowercasedQuery = query.toLowerCase();
      const filtered = syllabusFiles.filter(file =>
        file.name.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredFiles(filtered);
    }
  };

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const addSubject = (title) => setData([...data, { id: id('s_'), title, chapters: [] }]);
  const editSubject = (id, title) => setData(data.map((s) => (s.id === id ? { ...s, title } : s)));
  const removeSubject = (id) =>
    setData(data.filter((s) => s.id !== id));

  const addChapter = (sid, title) =>
    setData(data.map((s) => (s.id === sid ? { ...s, chapters: [...s.chapters, { id: id('c_'), title, topics: [] }] } : s)));
  const editChapter = (sid, cid, title) =>
    setData(
      data.map((s) =>
        s.id === sid ? { ...s, chapters: s.chapters.map((c) => (c.id === cid ? { ...c, title } : c)) } : s
      )
    );
  const removeChapter = (sid, cid) =>
    setData(
      data.map((s) =>
        s.id === sid ? { ...s, chapters: s.chapters.filter((c) => c.id !== cid) } : s
      )
    );

  const addTopic = (sid, cid, title) =>
    setData(prevData =>
      prevData.map((s) =>
        s.id === sid
          ? {
            ...s,
            chapters: s.chapters.map((c) =>
              c.id === cid
                ? { ...c, topics: [...c.topics, { id: id('t_'), title, done: false }] }
                : c
            ),
          }
          : s
      )
    );
  const editTopic = (sid, cid, tid, title) =>
    setData(
      data.map((s) =>
        s.id === sid
          ? {
            ...s,
            chapters: s.chapters.map((c) =>
              c.id === cid ? { ...c, topics: c.topics.map((t) => (t.id === tid ? { ...t, title } : t)) } : c
            ),
          }
          : s
      )
    );
  const toggleTopic = (sid, cid, tid) =>
    setData(
      data.map((s) =>
        s.id === sid
          ? {
            ...s,
            chapters: s.chapters.map((c) =>
              c.id === cid
                ? { ...c, topics: c.topics.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) }
                : c
            ),
          }
          : s
      )
    );
  const removeTopic = (sid, cid, tid) =>
    setData(
      data.map((s) =>
        s.id === sid
          ? {
            ...s,
            chapters: s.chapters.map((c) =>
              c.id === cid ? { ...c, topics: c.topics.filter((t) => t.id !== tid) } : c
            ),
          }
          : s
      )
    );

  const openModal = (type, sid = null, cid = null, tid = null, defaultText = '') => {
    setMode(type);
    setSubjectId(sid);
    setChapterId(cid);
    setTopicId(tid);
    setText(defaultText);
    setModalVisible(true);
  };

  const saveModal = () => {
    if (!text.trim()) return;
    switch (mode) {
      case 'add-subject':
        addSubject(text);
        break;
      case 'edit-subject':
        editSubject(subjectId, text);
        break;
      case 'add-chapter':
        addChapter(subjectId, text);
        break;
      case 'edit-chapter':
        editChapter(subjectId, chapterId, text);
        break;
      case 'add-topic':
        const topics = text.split('..').map(t => t.trim()).filter(Boolean);
        topics.forEach(title => addTopic(subjectId, chapterId, title));
        break;
      case 'edit-topic':
        editTopic(subjectId, chapterId, topicId, text);
        break;
    }
    setModalVisible(false);
    setText('');
  };

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: THEMES[Theme || 'light'].backgroundColor }}>
      <StatusBar style={Theme === 'dark' ? 'light' : 'dark'} />
      <Text className={`text-2xl font-bold m-4 ${Theme === 'dark' ? 'text-white' : 'text-black'}`}>Syllabus</Text>

      <ScrollView className="px-4 mb-20">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonSubjectCard key={i} />)
          : data.map((subject) => (
            <View key={subject.id} className="mb-4 rounded-xl overflow-hidden bg-indigo-800">
              <TouchableOpacity
                onPress={() => toggleExpand(subject.id)}
                className="flex-row justify-between items-center p-3 bg-blue-500"
              >
                <View className="flex-row items-center">
                  <AntDesign
                    name={expanded[subject.id] ? 'down' : 'right'}
                    size={16}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-semibold">{subject.title}</Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => openModal('edit-subject', subject.id, null, null, subject.title)}
                    className="mr-3"
                  >
                    <Feather name="edit" size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSubject(subject.id)}>
                    <Feather name="trash" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {expanded[subject.id] && (
                <View className="p-3 bg-indigo-200">
                  <View className="flex-row flex-wrap justify-between">
                    {subject.chapters.map((ch) => (
                      <View
                        key={ch.id}
                        className="bg-white rounded-2xl p-3 mb-3 w-full shadow-md"
                      >
                        <View className="flex-row justify-between items-center mb-2 ">
                          <Text className="font-semibold text-indigo-900 w-[90%]">{ch.title}</Text>
                          <View className="flex-row">
                            <TouchableOpacity
                              onPress={() => openModal('edit-chapter', subject.id, ch.id, null, ch.title)}
                              className="mr-2"
                            >
                              <Feather name="edit-2" size={16} color="black" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeChapter(subject.id, ch.id)}>
                              <Feather name="trash-2" size={16} color="black" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {ch.topics.map((t) => (
                          <TouchableOpacity onPress={() => toggleTopic(subject.id, ch.id, t.id)} key={t.id} className="flex-row items-center mt-2 mb-1">
                            <TouchableOpacity
                              onPress={() => toggleTopic(subject.id, ch.id, t.id)}
                              className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${t.done ? 'bg-blue-500' : 'border-indigo-900'
                                }`}
                            >
                              {t.done && <Feather name="check" size={14} color="white" />}
                            </TouchableOpacity>

                            <Text
                              className={`flex-1 ${t.done ? 'line-through text-gray-500' : 'text-indigo-900'
                                }`}
                            >
                              {t.title}
                            </Text>
                            <TouchableOpacity
                              onPress={() => openModal('edit-topic', subject.id, ch.id, t.id, t.title)}
                              className="mr-2"
                            >
                              <Feather name="edit-2" size={14} color="black" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeTopic(subject.id, ch.id, t.id)}>
                              <Feather name="trash-2" size={14} color="black" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                          onPress={() => openModal('add-topic', subject.id, ch.id)}
                          className=" mt-2 rounded-lg p-2 flex-row justify-center items-center"
                        >
                          <Feather name="plus" size={14} color="#3B82F6" />
                          <Text className="text-blue-500 ml-1">Add Topic</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => openModal('add-chapter', subject.id)}
                    className="p-3 rounded-full self-end mt-1 flex-row items-center"
                  >
                    <Feather name="plus" size={16} color="#3B82F6" />
                    <Text className="text-blue-500 ml-1">Add Chapter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
      </ScrollView>

      {/* ✅ Floating Buttons */}
      <View className="absolute bottom-[110px] right-7 flex-col items-center gap-4">
        <TouchableOpacity
          onPress={() => setPreloadedModel(true)}
          className="bg-blue-500 flex justify-center items-center h-[50px] w-[50px] rounded-full shadow-2xl"
        >
          <Feather name="list" size={24} color="white" />
        </TouchableOpacity>

        {/* Add Subject Button */}
        <TouchableOpacity
          onPress={() => openModal('add-subject')}
          className="bg-blue-500 w-[50px] h-[50px] flex justify-center items-center rounded-full shadow-2xl"
        >
          <Feather name="plus" size={26} color="white" />
        </TouchableOpacity>
      </View>


      {/* Modal */}
      <Modal transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white p-6 rounded-t-3xl shadow-xl">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold mb-6 text-indigo-900 capitalize">{mode.replace('-', ' ')}</Text>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Topic1..Topic2 to add multiple"
                className="bg-gray-100 p-4 rounded-2xl mb-6 text-indigo-900 text-lg"
                autoFocus={true}
              />
              <View className="flex-row justify-end items-center gap-4">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="px-4 py-2"
                >
                  <Text className="text-gray-500 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveModal}
                  className="bg-blue-500 py-3 px-8 rounded-2xl shadow-md"
                >
                  <Text className="text-white font-bold">Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={preloadedModel} onRequestClose={() => { setPreloadedModel(false); setModalVisible(false); }} animationType="slide">
        <View className="flex-1 bg-black/40">
          <GestureHandlerRootView className='z-20'>
            <GestureDetector gesture={drag}>
              <Animated.View style={[style]} className="mt-auto p-4 bg-white rounded-t-2xl">
                <TouchableOpacity className='w-[15%] bg-black h-2 rounded-full self-center' />
                <View className="flex-row items-center justify-between mt-4 mb-2">
                  <Text className="text-lg font-semibold">Preloaded Syllabus Models</Text>
                  <TouchableOpacity onPress={() => setPreloadedModel(false)} className="p-1 rounded-full bg-gray-200">
                    <Feather name="x" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 border border-gray-200">
                    <Feather name="search" size={18} color="gray" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={handleSearch}
                      placeholder="Search templates..."
                      className="flex-1 ml-2 text-indigo-900"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearch('')}>
                        <Feather name="x" size={18} color="gray" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filesLoading ? (
                  <View className="flex-1 items-center justify-center py-6">
                    <Text className="text-indigo-500 font-semibold">Loading available syllabuses…</Text>
                  </View>
                ) : filesError ? (
                  <View className="items-center py-4">
                    <Text className="text-red-500 mb-3">{filesError}</Text>
                    <TouchableOpacity onPress={fetchSyllabusFiles} className="bg-blue-500 px-4 py-2 rounded-xl">
                      <Text className="text-white font-bold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={{ paddingBottom: 150 }} className="flex-1 mt-2">
                    {filteredFiles.map(file => (
                      <TouchableOpacity
                        key={file.name}
                        onPress={() => loadSyllabus(file.downloadUrl)}
                        className="bg-indigo-100 p-4 rounded-xl mb-3 border border-indigo-200 shadow-sm"
                      >
                        <Text className="text-indigo-900 font-bold text-lg mb-1 capitalize">{file.name.replace('.json', '')}</Text>
                        <Text className="text-indigo-700 text-sm">Tap to import the {file.name.replace('.json', '').toUpperCase()} syllabus into your tracker.</Text>
                      </TouchableOpacity>
                    ))}
                    {filteredFiles.length === 0 && (
                      <Text className="text-gray-400 text-center py-6">No matching syllabuses found.</Text>
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
}
