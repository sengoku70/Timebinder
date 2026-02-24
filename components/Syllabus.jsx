import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Feather, AntDesign } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSprin0g,clamp } from 'react-native-reanimated';

const STORAGE_KEY = '@syllabus_data_v2';
const id = (p = '') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;



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

  const newheight = useSharedValue(180);

  const drag = Gesture.Pan()
  .onUpdate((e) => {
    newheight.value =  180 - e.translationY > 180 ? (180 - e.translationY)*2 : 180;
    //newheight.value =  (120 - e.translationY)*2;
    //console.log(newheight.value);
    
  })


  

const style = useAnimatedStyle(() => ({
  height: newheight.value,
}));

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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
    <View  className="flex-1 pt-10">
      <StatusBar style="dark" />
      <Text className=" text-2xl font-bold m-4">Syllabus</Text>

      <ScrollView className="px-4 mb-20">
        {data.map((subject) => (
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
                        <TouchableOpacity onPress={() => toggleTopic(subject.id, ch.id, t.id)}  key={t.id} className="flex-row items-center mt-2 mb-1">
                          <TouchableOpacity
                            onPress={() => toggleTopic(subject.id, ch.id, t.id)}
                            className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${
                              t.done ? 'bg-blue-500' : 'border-indigo-900'
                            }`}
                          >
                            {t.done && <Feather name="check" size={14} color="white" />}
                          </TouchableOpacity>
                          
                          <Text
                            className={`flex-1 ${
                              t.done ? 'line-through text-gray-500' : 'text-indigo-900'
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

      {/* Add Subject Button */}
      <TouchableOpacity
        onPress={() => openModal('add-subject')}
        className="bg-blue-500 w-14 h-14 rounded-full items-center justify-center absolute bottom-5 right-5"
      >
        <Feather name="plus" size={26} color="white" />
      </TouchableOpacity>
      

      {/* Modal */}
      <Modal transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)} animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-4 rounded-t-2xl">
            <Text className="text-lg font-semibold mb-4 capitalize">{mode.replace('-', ' ')}</Text>
            <TouchableOpacity  onPress={() => {setPreloadedModel(true),setModalVisible(false)} } className='bg-blue-500 h-8 absolute px-3 right-4 top-2 rounded-lg flex items-center justify-center '><Text className='text-white' name="" id="">Preloded</Text></TouchableOpacity>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Use ' .. ' to add multiple topics (eg: Topic1..Topic2)"
              className="border border-gray-300 p-2 rounded-lg mb-4"
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-2 mr-2"
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveModal}
                className="bg-blue-500 p-2 px-4 rounded-lg"
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={preloadedModel} onRequestClose={() => {setPreloadedModel(false),setModalVisible(false)}} animationType="slide">
      <View className="flex-1 bg-black/40">
      <GestureHandlerRootView className='z-20' >
            <GestureDetector gesture={drag} >
              <Animated.View style={[style]} className="mt-auto p-4 bg-white rounded-t-2xl " >
                <TouchableOpacity className='w-[15%] bg-black h-2 rounded-full self-center'></TouchableOpacity>
                <Text className="text-lg font-semibold mb-4 mt-4">Preloaded Syllabus Models</Text>
                <ScrollView className=''>
                  <TouchableOpacity onPress={() => {setData(
                    [
  {
    "id": "s_1",
    "title": "Physics",
    "chapters": [
        {
        "id": "c_1",
        "title": "Physics and Measurement",
        "topics": [
            {"id": "t_1", "title": "Units of Measurement", "done": false},
            {"id": "t_2", "title": "System of Units (SI Units)", "done": false},
            {"id": "t_3", "title": "Fundamental and Derived Units", "done": false},
            {"id": "t_4", "title": "Least Count", "done": false},
            {"id": "t_5", "title": "Significant Figures", "done": false},
            {"id": "t_6", "title": "Errors in Measurement", "done": false},
            {"id": "t_7", "title": "Dimensions of Physical Quantities", "done": false},
            {"id": "t_8", "title": "Dimensional Analysis & Applications", "done": false}
        ]
        },
        {
        "id": "c_2",
        "title": "Kinematics",
        "topics": [
            {"id": "t_9", "title": "Frame of Reference", "done": false},
            {"id": "t_10", "title": "Motion in a Straight Line", "done": false},
            {"id": "t_11", "title": "Position-Time Graphs", "done": false},
            {"id": "t_12", "title": "Speed and Velocity", "done": false},
            {"id": "t_13", "title": "Uniform & Non-Uniform Motion", "done": false},
            {"id": "t_14", "title": "Average Speed & Instantaneous Velocity", "done": false},
            {"id": "t_15", "title": "Uniformly Accelerated Motion", "done": false},
            {"id": "t_16", "title": "Velocity-Time & Position-Time Graphs", "done": false},
            {"id": "t_17", "title": "Equations of Motion (UAM)", "done": false},
            {"id": "t_18", "title": "Scalars and Vectors", "done": false},
            {"id": "t_19", "title": "Vector Addition & Subtraction", "done": false},
            {"id": "t_20", "title": "Scalar & Vector Products", "done": false},
            {"id": "t_21", "title": "Unit Vector & Vector Resolution", "done": false},
            {"id": "t_22", "title": "Relative Velocity", "done": false},
            {"id": "t_23", "title": "Motion in a Plane", "done": false},
            {"id": "t_24", "title": "Projectile Motion", "done": false},
            {"id": "t_25", "title": "Uniform Circular Motion", "done": false}
        ]
        },
        {
        "id": "c_3",
        "title": "Laws of Motion",
        "topics": [
            {"id": "t_26", "title": "Force and Inertia", "done": false},
            {"id": "t_27", "title": "Newton's First Law", "done": false},
            {"id": "t_28", "title": "Momentum & Newton's Second Law", "done": false},
            {"id": "t_29", "title": "Impulse", "done": false},
            {"id": "t_30", "title": "Newton's Third Law", "done": false},
            {"id": "t_31", "title": "Conservation of Momentum", "done": false},
            {"id": "t_32", "title": "Equilibrium of Concurrent Forces", "done": false},
            {"id": "t_33", "title": "Static & Kinetic Friction", "done": false},
            {"id": "t_34", "title": "Laws of Friction & Rolling Friction", "done": false},
            {"id": "t_35", "title": "Dynamics of Circular Motion", "done": false},
            {"id": "t_36", "title": "Centripetal Force Applications", "done": false},
            {"id": "t_37", "title": "Vehicle on Level & Banked Circular Road", "done": false}
        ]
        },
        {
        "id": "c_4",
        "title": "Work, Energy, and Power",
        "topics": [
            {"id": "t_38", "title": "Work by Constant & Variable Force", "done": false},
            {"id": "t_39", "title": "Kinetic and Potential Energy", "done": false},
            {"id": "t_40", "title": "Work-Energy Theorem", "done": false},
            {"id": "t_41", "title": "Power", "done": false},
            {"id": "t_42", "title": "Spring Potential Energy", "done": false},
            {"id": "t_43", "title": "Conservation of Mechanical Energy", "done": false},
            {"id": "t_44", "title": "Conservative & Non-Conservative Forces", "done": false},
            {"id": "t_45", "title": "Motion in a Vertical Circle", "done": false},
            {"id": "t_46", "title": "Elastic & Inelastic Collisions (1D & 2D)", "done": false}
        ]
        },
        {
            "id": "c_5",
            "title": "Rotational Motion",
            "topics": [
            {"id": "t_47", "title": "Centre of Mass (Two-Particle System)", "done": false},
            {"id": "t_48", "title": "Centre of Mass of a Rigid Body", "done": false},
            {"id": "t_49", "title": "Basics of Rotational Motion", "done": false},
            {"id": "t_50", "title": "Moment of a Force & Torque", "done": false},
            {"id": "t_51", "title": "Angular Momentum & Conservation", "done": false},
            {"id": "t_52", "title": "Moment of Inertia", "done": false},
            {"id": "t_53", "title": "Radius of Gyration", "done": false},
            {"id": "t_54", "title": "MOI of Simple Geometrical Bodies", "done": false},
            {"id": "t_55", "title": "Parallel Axis Theorem", "done": false},
            {"id": "t_56", "title": "Perpendicular Axis Theorem", "done": false},
            {"id": "t_57", "title": "Equilibrium of Rigid Bodies", "done": false},
            {"id": "t_58", "title": "Rigid Body Rotation & Equations", "done": false},
            {"id": "t_59", "title": "Linear vs Rotational Motion", "done": false}
            ]
        },
        {
            "id": "c_6",
            "title": "Gravitation",
            "topics": [
            {"id": "t_60", "title": "Universal Law of Gravitation", "done": false},
            {"id": "t_61", "title": "Acceleration due to Gravity (g)", "done": false},
            {"id": "t_62", "title": "Variation of g with Altitude & Depth", "done": false},
            {"id": "t_63", "title": "Kepler's Laws", "done": false},
            {"id": "t_64", "title": "Gravitational Potential Energy", "done": false},
            {"id": "t_65", "title": "Gravitational Potential", "done": false},
            {"id": "t_66", "title": "Escape Velocity", "done": false},
            {"id": "t_67", "title": "Motion of Satellite", "done": false},
            {"id": "t_68", "title": "Orbital Velocity & Time Period", "done": false},
            {"id": "t_69", "title": "Energy of Satellite", "done": false}
            ]
        },
        {
            "id": "c_7",
            "title": "Properties of Solids and Liquids",
            "topics": [
            {"id": "t_70", "title": "Elastic Behaviour & Stress-Strain", "done": false},
            {"id": "t_71", "title": "Hooke's Law", "done": false},
            {"id": "t_72", "title": "Young's, Bulk & Rigidity Modulus", "done": false},
            {"id": "t_73", "title": "Pressure due to Fluid Column", "done": false},
            {"id": "t_74", "title": "Pascal's Law & Applications", "done": false},
            {"id": "t_75", "title": "Fluid Pressure & Gravity Effect", "done": false},
            {"id": "t_76", "title": "Viscosity & Stokes' Law", "done": false},
            {"id": "t_77", "title": "Terminal Velocity", "done": false},
            {"id": "t_78", "title": "Streamline & Turbulent Flow", "done": false},
            {"id": "t_79", "title": "Critical Velocity", "done": false},
            {"id": "t_80", "title": "Bernoulli's Principle & Applications", "done": false},
            {"id": "t_81", "title": "Surface Energy & Surface Tension", "done": false},
            {"id": "t_82", "title": "Angle of Contact", "done": false},
            {"id": "t_83", "title": "Excess Pressure in Curved Surface", "done": false},
            {"id": "t_84", "title": "Applications: Drops, Bubbles, Capillary", "done": false},
            {"id": "t_85", "title": "Heat & Temperature", "done": false},
            {"id": "t_86", "title": "Thermal Expansion", "done": false},
            {"id": "t_87", "title": "Specific Heat Capacity", "done": false},
            {"id": "t_88", "title": "Calorimetry", "done": false},
            {"id": "t_89", "title": "Change of State & Latent Heat", "done": false},
            {"id": "t_90", "title": "Heat Transfer: Conduction", "done": false},
            {"id": "t_91", "title": "Heat Transfer: Convection", "done": false},
            {"id": "t_92", "title": "Heat Transfer: Radiation", "done": false}
            ]
        },
        {
            "id": "c_8",
            "title": "Thermodynamics",
            "topics": [
            {"id": "t_93", "title": "Thermal Equilibrium & Zeroth Law", "done": false},
            {"id": "t_94", "title": "Temperature & Heat", "done": false},
            {"id": "t_95", "title": "Work & Internal Energy", "done": false},
            {"id": "t_96", "title": "First Law of Thermodynamics", "done": false},
            {"id": "t_97", "title": "Isothermal Process", "done": false},
            {"id": "t_98", "title": "Adiabatic Process", "done": false},
            {"id": "t_99", "title": "Second Law of Thermodynamics", "done": false},
            {"id": "t_100", "title": "Reversible & Irreversible Processes", "done": false}
            ]
        },
        {
            "id": "c_9",
            "title": "Kinetic Theory of Gases",
            "topics": [
            {"id": "t_101", "title": "Equation of State of Perfect Gas", "done": false},
            {"id": "t_102", "title": "Work Done in Gas Compression", "done": false},
            {"id": "t_103", "title": "Kinetic Theory Assumptions", "done": false},
            {"id": "t_104", "title": "Pressure of Gas", "done": false},
            {"id": "t_105", "title": "Kinetic Interpretation of Temperature", "done": false},
            {"id": "t_106", "title": "RMS Speed of Gas Molecules", "done": false},
            {"id": "t_107", "title": "Degrees of Freedom", "done": false},
            {"id": "t_108", "title": "Equipartition of Energy", "done": false},
            {"id": "t_109", "title": "Specific Heat Capacities of Gases", "done": false},
            {"id": "t_110", "title": "Mean Free Path", "done": false},
            {"id": "t_111", "title": "Avogadro's Number", "done": false}
            ]
        },
        {
            "id": "c_10",
            "title": "Oscillations and Waves",
            "topics": [
            {"id": "t_112", "title": "Oscillations & Periodic Motion", "done": false},
            {"id": "t_113", "title": "Time Period, Frequency, Displacement", "done": false},
            {"id": "t_114", "title": "Periodic Functions", "done": false},
            {"id": "t_115", "title": "Simple Harmonic Motion (SHM)", "done": false},
            {"id": "t_116", "title": "Phase of SHM", "done": false},
            {"id": "t_117", "title": "Spring Oscillations & k", "done": false},
            {"id": "t_118", "title": "Energy in SHM", "done": false},
            {"id": "t_119", "title": "Simple Pendulum & Time Period", "done": false},
            {"id": "t_120", "title": "Wave Motion", "done": false},
            {"id": "t_121", "title": "Longitudinal & Transverse Waves", "done": false},
            {"id": "t_122", "title": "Speed of Travelling Wave", "done": false},
            {"id": "t_123", "title": "Displacement Relation for Progressive Wave", "done": false},
            {"id": "t_124", "title": "Principle of Superposition", "done": false},
            {"id": "t_125", "title": "Reflection of Waves", "done": false},
            {"id": "t_126", "title": "Standing Waves in Strings & Pipes", "done": false},
            {"id": "t_127", "title": "Fundamental Mode & Harmonics", "done": false},
            {"id": "t_128", "title": "Beats", "done": false}
            ]
        },
        {
  "id": "c_11",
  "title": "Electrostatics",
  "topics": [
    {"id": "t_129", "title": "Electric Charges & Conservation of Charge", "done": false},
    {"id": "t_130", "title": "Coulomb’s Law (Two-Point Charges)", "done": false},
    {"id": "t_131", "title": "Forces Between Multiple Charges & Superposition Principle", "done": false},
    {"id": "t_132", "title": "Continuous Charge Distribution", "done": false},
    {"id": "t_133", "title": "Electric Field & Point Charge Field", "done": false},
    {"id": "t_134", "title": "Electric Field Lines", "done": false},
    {"id": "t_135", "title": "Electric Dipole & Field Due to Dipole", "done": false},
    {"id": "t_136", "title": "Torque on a Dipole in Uniform Electric Field", "done": false},
    {"id": "t_137", "title": "Electric Flux", "done": false},
    {"id": "t_138", "title": "Gauss’s Law", "done": false},
    {"id": "t_139", "title": "Field Due to Infinite Charged Wire", "done": false},
    {"id": "t_140", "title": "Field Due to Infinite Plane Sheet", "done": false},
    {"id": "t_141", "title": "Field Due to Thin Spherical Shell", "done": false},
    {"id": "t_142", "title": "Electric Potential (Point Charge, Dipole, System of Charges)", "done": false},
    {"id": "t_143", "title": "Potential Difference & Equipotential Surfaces", "done": false},
    {"id": "t_144", "title": "Electric Potential Energy (Two Charges & Dipole)", "done": false},
    {"id": "t_145", "title": "Conductors & Insulators", "done": false},
    {"id": "t_146", "title": "Dielectrics & Electric Polarization", "done": false},
    {"id": "t_147", "title": "Capacitors & Capacitance", "done": false},
    {"id": "t_148", "title": "Capacitors in Series & Parallel", "done": false},
    {"id": "t_149", "title": "Parallel Plate Capacitor (With/Without Dielectric)", "done": false},
    {"id": "t_150", "title": "Energy Stored in a Capacitor", "done": false}
  ]
        },
        {
        "id": "c_12",
        "title": "Current Electricity",
        "topics": [
            {"id": "t_151", "title": "Electric Current", "done": false},
            {"id": "t_152", "title": "Drift Velocity & Mobility", "done": false},
            {"id": "t_153", "title": "Ohm’s Law", "done": false},
            {"id": "t_154", "title": "Electrical Resistance", "done": false},
            {"id": "t_155", "title": "V-I Characteristics (Ohmic & Non-Ohmic)", "done": false},
            {"id": "t_156", "title": "Electrical Energy & Power", "done": false},
            {"id": "t_157", "title": "Resistivity & Conductivity", "done": false},
            {"id": "t_158", "title": "Series & Parallel Resistor Combination", "done": false},
            {"id": "t_159", "title": "Temperature Dependence of Resistance", "done": false},
            {"id": "t_160", "title": "EMF & Internal Resistance of a Cell", "done": false},
            {"id": "t_161", "title": "Combination of Cells (Series & Parallel)", "done": false},
            {"id": "t_162", "title": "Kirchhoff's Laws & Applications", "done": false},
            {"id": "t_163", "title": "Wheatstone Bridge", "done": false},
            {"id": "t_164", "title": "Metre Bridge", "done": false}
        ]
        },
        {
        "id": "c_13",
        "title": "Magnetic Effects of Current and Magnetism",
        "topics": [
            {"id": "t_165", "title": "Biot–Savart Law & Field of Circular Loop", "done": false},
            {"id": "t_166", "title": "Ampere’s Law (Straight Wire & Solenoid)", "done": false},
            {"id": "t_167", "title": "Force on Moving Charge (Electric & Magnetic Fields)", "done": false},
            {"id": "t_168", "title": "Force on Current-Carrying Conductor", "done": false},
            {"id": "t_169", "title": "Force Between Two Parallel Currents (Definition of Ampere)", "done": false},
            {"id": "t_170", "title": "Torque on Current Loop in Magnetic Field", "done": false},
            {"id": "t_171", "title": "Moving Coil Galvanometer", "done": false},
            {"id": "t_172", "title": "Conversion to Ammeter & Voltmeter", "done": false},
            {"id": "t_173", "title": "Current Loop as Magnetic Dipole", "done": false},
            {"id": "t_174", "title": "Bar Magnet as Solenoid", "done": false},
            {"id": "t_175", "title": "Magnetic Field Lines", "done": false},
            {"id": "t_176", "title": "Field of Dipole (Axial & Equatorial)", "done": false},
            {"id": "t_177", "title": "Torque on Magnetic Dipole", "done": false},
            {"id": "t_178", "title": "Paramagnetic, Diamagnetic & Ferromagnetic Materials", "done": false},
            {"id": "t_179", "title": "Effect of Temperature on Magnetism", "done": false}
        ]
        },
        {
        "id": "c_14",
        "title": "Electromagnetic Induction and AC",
        "topics": [
            {"id": "t_180", "title": "Faraday’s Law of EMI", "done": false},
            {"id": "t_181", "title": "Induced EMF & Current", "done": false},
            {"id": "t_182", "title": "Lenz’s Law", "done": false},
            {"id": "t_183", "title": "Eddy Currents", "done": false},
            {"id": "t_184", "title": "Self & Mutual Inductance", "done": false},
            {"id": "t_185", "title": "Alternating Currents", "done": false},
            {"id": "t_186", "title": "Peak & RMS Values (AC Voltage/Current)", "done": false},
            {"id": "t_187", "title": "Reactance & Impedance", "done": false},
            {"id": "t_188", "title": "LCR Series Circuit & Resonance", "done": false},
            {"id": "t_189", "title": "Power in AC Circuits & Wattless Current", "done": false},
            {"id": "t_190", "title": "AC Generator", "done": false},
            {"id": "t_191", "title": "Transformer", "done": false}
        ]
        },
        {
        "id": "c_15",
        "title": "Electromagnetic Waves",
        "topics": [
            {"id": "t_192", "title": "Displacement Current", "done": false},
            {"id": "t_193", "title": "Electromagnetic Waves: Nature & Properties", "done": false},
            {"id": "t_194", "title": "Transverse Nature of EM Waves", "done": false},
            {"id": "t_195", "title": "Electromagnetic Spectrum", "done": false},
            {"id": "t_196", "title": "Applications of Electromagnetic Waves", "done": false}
        ]
        },
        {
        "id": "c_16",
        "title": "UNIT 16: OPTICS",
        "topics": [
            { "id": "t_1", "title": "Reflection of light, spherical mirrors, mirror formula", "done": false },
            { "id": "t_2", "title": "Refraction of light at plane and spherical surfaces", "done": false },
            { "id": "t_3", "title": "Thin lens formula and lens maker formula", "done": false },
            { "id": "t_4", "title": "Total internal reflection and its applications", "done": false },
            { "id": "t_5", "title": "Magnification", "done": false },
            { "id": "t_6", "title": "Power of a lens", "done": false },
            { "id": "t_7", "title": "Combination of thin lenses in contact", "done": false },
            { "id": "t_8", "title": "Refraction of light through a prism", "done": false },
            { "id": "t_9", "title": "Microscope and Astronomical Telescope (reflecting and refracting), magnifying powers", "done": false },
            { "id": "t_10", "title": "Wavefront and Huygens' principle", "done": false },
            { "id": "t_11", "title": "Laws of reflection and refraction using Huygens principle", "done": false },
            { "id": "t_12", "title": "Interference, Young's double-slit experiment, fringe width", "done": false },
            { "id": "t_13", "title": "Coherent sources and sustained interference", "done": false },
            { "id": "t_14", "title": "Diffraction due to a single slit, width of central maximum", "done": false },
            { "id": "t_15", "title": "Polarization, plane-polarized light, Brewster's law, uses, Polaroid", "done": false }
        ]
        },
        {
        "id": "c_17",
        "title": "UNIT 17: DUAL NATURE OF MATTER AND RADIATION",
        "topics": [
            { "id": "t_16", "title": "Dual nature of radiation", "done": false },
            { "id": "t_17", "title": "Photoelectric effect", "done": false },
            { "id": "t_18", "title": "Hertz and Lenard's observations", "done": false },
            { "id": "t_19", "title": "Einstein's photoelectric equation: particle nature of light", "done": false },
            { "id": "t_20", "title": "Matter waves, wave nature of particle, de Broglie relation", "done": false }
        ]
        },
        {
        "id": "c_18",
        "title": "UNIT 18: ATOMS AND NUCLEI",
        "topics": [
            { "id": "t_21", "title": "Alpha-particle scattering experiment", "done": false },
            { "id": "t_22", "title": "Rutherford's model of atom", "done": false },
            { "id": "t_23", "title": "Bohr model, energy levels, hydrogen spectrum", "done": false },
            { "id": "t_24", "title": "Composition and size of nucleus, atomic masses", "done": false },
            { "id": "t_25", "title": "Mass-energy relation, mass defect", "done": false },
            { "id": "t_26", "title": "Binding energy per nucleon and variation with mass number", "done": false },
            { "id": "t_27", "title": "Nuclear fission and fusion", "done": false }
        ]
        },
        {
        "id": "c_19",
        "title": "UNIT 19: ELECTRONIC DEVICES",
        "topics": [
            { "id": "t_28", "title": "Semiconductors", "done": false },
            { "id": "t_29", "title": "Semiconductor diode: I-V characteristics in forward and reverse bias", "done": false },
            { "id": "t_30", "title": "Diode as a rectifier", "done": false },
            { "id": "t_31", "title": "I-V characteristics of LED", "done": false },
            { "id": "t_32", "title": "Photodiode", "done": false },
            { "id": "t_33", "title": "Solar cell", "done": false },
            { "id": "t_34", "title": "Zener diode", "done": false },
            { "id": "t_35", "title": "Zener diode as a voltage regulator", "done": false },
            { "id": "t_36", "title": "Logic gates (OR, AND, NOT, NAND, NOR)", "done": false }
        ]
        }




    ]
  },{
    
    "id": "s_2",
    "title": "Chemistry",
    "chapters": [
    {
      "id": "c_1",
      "title": "UNIT 1: SOME BASIC CONCEPTS IN CHEMISTRY",
      "topics": [
        { "id": "t_1", "title": "Matter and its nature", "done": false },
        { "id": "t_2", "title": "Dalton's atomic theory", "done": false },
        { "id": "t_3", "title": "Concept of atom, molecule, element, compound", "done": false },
        { "id": "t_4", "title": "Laws of chemical combination", "done": false },
        { "id": "t_5", "title": "Atomic and molecular masses", "done": false },
        { "id": "t_6", "title": "Mole concept and molar mass", "done": false },
        { "id": "t_7", "title": "Percentage composition", "done": false },
        { "id": "t_8", "title": "Empirical and molecular formulae", "done": false },
        { "id": "t_9", "title": "Chemical equations and stoichiometry", "done": false }
      ]
    },
    {
      "id": "c_2",
      "title": "UNIT 2: ATOMIC STRUCTURE",
      "topics": [
        { "id": "t_10", "title": "Nature of electromagnetic radiation", "done": false },
        { "id": "t_11", "title": "Photoelectric effect", "done": false },
        { "id": "t_12", "title": "Spectrum of hydrogen atom", "done": false },
        { "id": "t_13", "title": "Bohr model and energy relations", "done": false },
        { "id": "t_14", "title": "Limitations of Bohr model", "done": false },
        { "id": "t_15", "title": "Dual nature of matter and de Broglie relationship", "done": false },
        { "id": "t_16", "title": "Heisenberg uncertainty principle", "done": false },
        { "id": "t_17", "title": "Quantum mechanical model of atom", "done": false },
        { "id": "t_18", "title": "Atomic orbitals as wave functions", "done": false },
        { "id": "t_19", "title": "Variation of Ψ and Ψ² for 1s and 2s orbitals", "done": false },
        { "id": "t_20", "title": "Quantum numbers and their significance", "done": false },
        { "id": "t_21", "title": "Shapes of s, p, d orbitals", "done": false },
        { "id": "t_22", "title": "Electron spin and spin quantum number", "done": false },
        { "id": "t_23", "title": "Aufbau principle", "done": false },
        { "id": "t_24", "title": "Pauli exclusion principle", "done": false },
        { "id": "t_25", "title": "Hund's rule", "done": false },
        { "id": "t_26", "title": "Electronic configuration of elements", "done": false },
        { "id": "t_27", "title": "Extra stability of half-filled and fully-filled orbitals", "done": false }
      ]
    },
    {
      "id": "c_3",
      "title": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
      "topics": [
        { "id": "t_28", "title": "Kossel-Lewis approach", "done": false },
        { "id": "t_29", "title": "Ionic and covalent bonds", "done": false },
        { "id": "t_30", "title": "Factors affecting ionic bond formation", "done": false },
        { "id": "t_31", "title": "Lattice enthalpy", "done": false },
        { "id": "t_32", "title": "Electronegativity and Fajan's rule", "done": false },
        { "id": "t_33", "title": "Dipole moment", "done": false },
        { "id": "t_34", "title": "VSEPR theory and molecular shapes", "done": false },
        { "id": "t_35", "title": "Valence Bond Theory and hybridization", "done": false },
        { "id": "t_36", "title": "Resonance", "done": false },
        { "id": "t_37", "title": "Molecular Orbital Theory, LCAO", "done": false },
        { "id": "t_38", "title": "Bonding and antibonding orbitals", "done": false },
        { "id": "t_39", "title": "Sigma and pi bonds", "done": false },
        { "id": "t_40", "title": "MOT of homonuclear diatomic molecules", "done": false },
        { "id": "t_41", "title": "Bond order, bond length, bond energy", "done": false },
        { "id": "t_42", "title": "Metallic bonding", "done": false },
        { "id": "t_43", "title": "Hydrogen bonding and applications", "done": false }
      ]
    },
    {
      "id": "c_4",
      "title": "UNIT 4: CHEMICAL THERMODYNAMICS",
      "topics": [
        { "id": "t_44", "title": "System, surroundings, state functions", "done": false },
        { "id": "t_45", "title": "First law: work, heat, internal energy, enthalpy", "done": false },
        { "id": "t_46", "title": "Heat capacity and molar heat capacity", "done": false },
        { "id": "t_47", "title": "Hess's law", "done": false },
        { "id": "t_48", "title": "Enthalpies: bond dissociation, combustion, formation, etc.", "done": false },
        { "id": "t_49", "title": "Second law and spontaneity", "done": false },
        { "id": "t_50", "title": "ΔS and ΔG as criteria of spontaneity", "done": false },
        { "id": "t_51", "title": "Standard Gibbs energy and equilibrium constant", "done": false }
      ]
    },
    {
      "id": "c_5",
      "title": "UNIT 5: SOLUTIONS",
      "topics": [
        { "id": "t_52", "title": "Concentration terms: molarity, molality, mole fraction", "done": false },
        { "id": "t_53", "title": "Percentage by mass and volume", "done": false },
        { "id": "t_54", "title": "Raoult's law and vapour pressure", "done": false },
        { "id": "t_55", "title": "Ideal and non-ideal solutions", "done": false },
        { "id": "t_56", "title": "Colligative properties", "done": false },
        { "id": "t_57", "title": "Molecular mass via colligative properties", "done": false },
        { "id": "t_58", "title": "Abnormal molar mass and van’t Hoff factor", "done": false }
      ]
    },
    {
      "id": "c_6",
      "title": "UNIT 6: EQUILIBRIUM",
      "topics": [
        { "id": "t_59", "title": "Physical and chemical equilibrium", "done": false },
        { "id": "t_60", "title": "Henry's law", "done": false },
        { "id": "t_61", "title": "Law of chemical equilibrium", "done": false },
        { "id": "t_62", "title": "Equilibrium constants Kp and Kc", "done": false },
        { "id": "t_63", "title": "ΔG and ΔG° in equilibrium", "done": false },
        { "id": "t_64", "title": "Le Chatelier's principle", "done": false },
        { "id": "t_65", "title": "Acids and bases: Arrhenius, Bronsted, Lewis", "done": false },
        { "id": "t_66", "title": "Ionization, pH scale", "done": false },
        { "id": "t_67", "title": "Common ion effect", "done": false },
        { "id": "t_68", "title": "Salt hydrolysis and buffer solutions", "done": false },
        { "id": "t_69", "title": "Solubility product", "done": false }
      ]
    },
    {
      "id": "c_7",
      "title": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
      "topics": [
        { "id": "t_70", "title": "Oxidation and reduction concepts", "done": false },
        { "id": "t_71", "title": "Oxidation number rules", "done": false },
        { "id": "t_72", "title": "Balancing redox reactions", "done": false },
        { "id": "t_73", "title": "Electrolytic and metallic conduction", "done": false },
        { "id": "t_74", "title": "Conductance and molar conductivity", "done": false },
        { "id": "t_75", "title": "Kohlrausch's law", "done": false },
        { "id": "t_76", "title": "Electrolytic and galvanic cells", "done": false },
        { "id": "t_77", "title": "Electrode potentials and standard electrode potentials", "done": false },
        { "id": "t_78", "title": "Nernst equation", "done": false },
        { "id": "t_79", "title": "Cell potential and Gibbs energy", "done": false },
        { "id": "t_80", "title": "Dry cell and lead accumulator", "done": false },
        { "id": "t_81", "title": "Fuel cells", "done": false }
      ]
    },
    {
  "id": "c_8",
  "title": "Chemical Kinetics",
  "topics": [
    {"id": "t_1", "title": "Rate of Chemical Reaction", "done": false},
    {"id": "t_2", "title": "Factors Affecting Rate", "done": false},
    {"id": "t_3", "title": "Elementary and Complex Reactions", "done": false},
    {"id": "t_4", "title": "Order and Molecularity", "done": false},
    {"id": "t_5", "title": "Rate Law and Rate Constant", "done": false},
    {"id": "t_6", "title": "Zero and First Order Reactions", "done": false},
    {"id": "t_7", "title": "Half-life of Reactions", "done": false},
    {"id": "t_8", "title": "Arrhenius Equation and Activation Energy", "done": false},
    {"id": "t_9", "title": "Collision Theory", "done": false}
  ]
    },
    {
    "id": "c_9",
    "title": "Classification of Elements and Periodicity",
    "topics": [
        {"id": "t_10", "title": "Modern Periodic Law", "done": false},
        {"id": "t_11", "title": "Periodic Table", "done": false},
        {"id": "t_12", "title": "s, p, d, f Block Elements", "done": false},
        {"id": "t_13", "title": "Atomic & Ionic Radii Trends", "done": false},
        {"id": "t_14", "title": "Ionization Enthalpy Trends", "done": false},
        {"id": "t_15", "title": "Electron Gain Enthalpy Trends", "done": false},
        {"id": "t_16", "title": "Oxidation States & Valency", "done": false},
        {"id": "t_17", "title": "Chemical Reactivity Trends", "done": false}
    ]
    },
    {
    "id": "c_10",
    "title": "P-Block Elements",
    "topics": [
        {"id": "t_18", "title": "Groups 13 to 18 Overview", "done": false},
        {"id": "t_19", "title": "Electronic Configuration", "done": false},
        {"id": "t_20", "title": "General Physical & Chemical Trends", "done": false},
        {"id": "t_21", "title": "Unique Behaviour of First Elements", "done": false}
    ]
    },
    {
    "id": "c_11",
    "title": "d- and f- Block Elements",
    "topics": [
        {"id": "t_22", "title": "Transition Elements Overview", "done": false},
        {"id": "t_23", "title": "Occurrence & Electronic Configuration", "done": false},
        {"id": "t_24", "title": "General Properties of 1st Row Elements", "done": false},
        {"id": "t_25", "title": "K2Cr2O7 Preparation and Properties", "done": false},
        {"id": "t_26", "title": "KMnO4 Preparation and Properties", "done": false},
        {"id": "t_27", "title": "Lanthanoids: Configuration & Contraction", "done": false},
        {"id": "t_28", "title": "Actinoids: Configuration & Oxidation States", "done": false}
    ]
    },
    {
    "id": "c_12",
    "title": "Coordination Compounds",
    "topics": [
        {"id": "t_29", "title": "Werner’s Theory", "done": false},
        {"id": "t_30", "title": "Ligands & Coordination Number", "done": false},
        {"id": "t_31", "title": "Chelation & Denticity", "done": false},
        {"id": "t_32", "title": "IUPAC Nomenclature", "done": false},
        {"id": "t_33", "title": "Isomerism in Coordination Compounds", "done": false},
        {"id": "t_34", "title": "Valence Bond Theory", "done": false},
        {"id": "t_35", "title": "Crystal Field Theory Basics", "done": false},
        {"id": "t_36", "title": "Colour & Magnetic Properties", "done": false},
        {"id": "t_37", "title": "Applications in Analysis & Biology", "done": false}
    ]
    },
    {
    "id": "c_13",
    "title": "Purification and Characterisation of Organic Compounds",
    "topics": [
        {"id": "t_38", "title": "Crystallization", "done": false},
        {"id": "t_39", "title": "Sublimation & Distillation", "done": false},
        {"id": "t_40", "title": "Differential Extraction", "done": false},
        {"id": "t_41", "title": "Chromatography", "done": false},
        {"id": "t_42", "title": "Detection of Elements", "done": false},
        {"id": "t_43", "title": "Quantitative Analysis Basics", "done": false},
        {"id": "t_44", "title": "Empirical & Molecular Formula Calculation", "done": false}
    ]
    },
    {
    "id": "c_14",
    "title": "Basic Principles of Organic Chemistry",
    "topics": [
        {"id": "t_45", "title": "Tetravalency of Carbon", "done": false},
        {"id": "t_46", "title": "Hybridization (s & p)", "done": false},
        {"id": "t_47", "title": "Functional Groups", "done": false},
        {"id": "t_48", "title": "Homologous Series", "done": false},
        {"id": "t_49", "title": "Isomerism (Structural & Stereo)", "done": false},
        {"id": "t_50", "title": "Nomenclature (IUPAC & Trivial)", "done": false},
        {"id": "t_51", "title": "Bond Fission Types", "done": false},
        {"id": "t_52", "title": "Intermediates: Carbocations, Carbanions", "done": false},
        {"id": "t_53", "title": "Electronic Effects", "done": false},
        {"id": "t_54", "title": "Types of Organic Reactions", "done": false}
    ]
    },
    {
    "id": "c_15",
    "title": "Hydrocarbons",
    "topics": [
        {"id": "t_55", "title": "Classification & Isomerism", "done": false},
        {"id": "t_56", "title": "Alkanes: Preparation & Reactions", "done": false},
        {"id": "t_57", "title": "Alkane Conformations", "done": false},
        {"id": "t_58", "title": "Mechanism of Halogenation", "done": false},
        {"id": "t_59", "title": "Alkenes: Geometrical Isomerism", "done": false},
        {"id": "t_60", "title": "Electrophilic Addition", "done": false},
        {"id": "t_61", "title": "Markownikoff & Peroxide Effect", "done": false},
        {"id": "t_62", "title": "Ozonolysis & Polymerisation", "done": false},
        {"id": "t_63", "title": "Alkynes: Reactions & Acidic Nature", "done": false},
        {"id": "t_64", "title": "Aromatic Hydrocarbons & Benzene", "done": false},
        {"id": "t_65", "title": "Electrophilic Substitution", "done": false},
        {"id": "t_66", "title": "Friedel-Crafts Reactions", "done": false},
        {"id": "t_67", "title": "Directive Influence", "done": false}
    ]
    },
    {
    "id": "c_16",
    "title": "Organic Compounds Containing Halogens",
    "topics": [
        {"id": "t_68", "title": "Preparation & Properties", "done": false},
        {"id": "t_69", "title": "Nature of C–X Bond", "done": false},
        {"id": "t_70", "title": "Mechanisms of Substitution", "done": false},
        {"id": "t_71", "title": "Uses of Haloalkanes & Haloarenes", "done": false},
        {"id": "t_72", "title": "Environmental Effects (DDT, Freons)", "done": false}
    ]
    },
    {
  "id": "c_17",
  "title": "Organic Compounds Containing Oxygen",
  "topics": [
    {"id": "t_73", "title": "General Preparation, Properties, Reactions and Uses", "done": false},
    {"id": "t_74", "title": "Alcohols: Primary, Secondary, Tertiary Identification", "done": false},
    {"id": "t_75", "title": "Mechanism of Dehydration of Alcohols", "done": false},
    {"id": "t_76", "title": "Phenols: Acidic Nature", "done": false},
    {"id": "t_77", "title": "Phenols: Electrophilic Substitution (Halogenation, Nitration, Sulphonation)", "done": false},
    {"id": "t_78", "title": "Reimer–Tiemann Reaction", "done": false},
    {"id": "t_79", "title": "Ethers: Structure and Properties", "done": false},
    {"id": "t_80", "title": "Aldehydes & Ketones: Carbonyl Group Nature", "done": false},
    {"id": "t_81", "title": "Nucleophilic Addition to Carbonyls (HCN, NH3 & Derivatives)", "done": false},
    {"id": "t_82", "title": "Grignard Reagent Reactions", "done": false},
    {"id": "t_83", "title": "Oxidation and Reduction (Wolf–Kishner, Clemmensen)", "done": false},
    {"id": "t_84", "title": "Acidity of Alpha Hydrogen", "done": false},
    {"id": "t_85", "title": "Aldol Condensation", "done": false},
    {"id": "t_86", "title": "Cannizzaro Reaction", "done": false},
    {"id": "t_87", "title": "Haloform Reaction", "done": false},
    {"id": "t_88", "title": "Distinguishing Tests: Aldehydes vs Ketones", "done": false},
    {"id": "t_89", "title": "Carboxylic Acids: Acidic Strength and Factors", "done": false}
  ]
    },
    {
    "id": "c_18",
    "title": "Organic Compounds Containing Nitrogen",
    "topics": [
        {"id": "t_90", "title": "General Preparation, Properties, Reactions and Uses", "done": false},
        {"id": "t_91", "title": "Amines: Nomenclature & Classification", "done": false},
        {"id": "t_92", "title": "Amines: Structure and Basic Character", "done": false},
        {"id": "t_93", "title": "Identification of Primary, Secondary & Tertiary Amines", "done": false},
        {"id": "t_94", "title": "Diazonium Salts: Importance in Synthesis", "done": false}
    ]
    },
    {
    "id": "c_19",
    "title": "Biomolecules",
    "topics": [
        {"id": "t_95", "title": "Introduction and Importance of Biomolecules", "done": false},
        {"id": "t_96", "title": "Carbohydrates: Classification", "done": false},
        {"id": "t_97", "title": "Aldoses and Ketoses", "done": false},
        {"id": "t_98", "title": "Monosaccharides: Glucose and Fructose", "done": false},
        {"id": "t_99", "title": "Oligosaccharides: Sucrose, Lactose, Maltose", "done": false},
        {"id": "t_100", "title": "Proteins: Amino Acids, Peptide Bond", "done": false},
        {"id": "t_101", "title": "Protein Structure: Primary to Quaternary", "done": false},
        {"id": "t_102", "title": "Denaturation of Proteins", "done": false},
        {"id": "t_103", "title": "Enzymes", "done": false},
        {"id": "t_104", "title": "Vitamins: Classification and Functions", "done": false},
        {"id": "t_105", "title": "Nucleic Acids: DNA & RNA Structure", "done": false},
        {"id": "t_106", "title": "Biological Functions of Nucleic Acids", "done": false},
        {"id": "t_107", "title": "Hormones: General Introduction", "done": false}
    ]
    },
    {
    "id": "c_20",
    "title": "Principles Related to Practical Chemistry",
    "topics": [
        {"id": "t_108", "title": "Detection of Extra Elements (N, S, Halogens)", "done": false},
        {"id": "t_109", "title": "Detection of Functional Groups (Alcohol, Phenol, Carbonyl, Carboxyl, Amino)", "done": false},
        {"id": "t_110", "title": "Preparation: Mohr’s Salt", "done": false},
        {"id": "t_111", "title": "Preparation: Potash Alum", "done": false},
        {"id": "t_112", "title": "Preparation: Acetanilide", "done": false},
        {"id": "t_113", "title": "Preparation: p-Nitroacetanilide", "done": false},
        {"id": "t_114", "title": "Preparation: Aniline Yellow", "done": false},
        {"id": "t_115", "title": "Preparation: Iodoform", "done": false},
        {"id": "t_116", "title": "Titrimetry: Acids, Bases, Indicators", "done": false},
        {"id": "t_117", "title": "Titrimetry: Oxalic Acid vs KMnO4", "done": false},
        {"id": "t_118", "title": "Titrimetry: Mohr’s Salt vs KMnO4", "done": false},
        {"id": "t_119", "title": "Salt Analysis: Cations (Pb2+, Cu2+, Al3+, Fe3+, etc.)", "done": false},
        {"id": "t_120", "title": "Salt Analysis: Anions (CO3²-, S²-, SO4²-, NO3-, etc.)", "done": false},
        {"id": "t_121", "title": "Enthalpy of Solution of CuSO4", "done": false},
        {"id": "t_122", "title": "Enthalpy of Neutralization (Strong Acid & Base)", "done": false},
        {"id": "t_123", "title": "Preparation of Lyophilic and Lyophobic Sols", "done": false},
        {"id": "t_124", "title": "Kinetic Study: Reaction of Iodide with H2O2", "done": false}
    ]
    }


  ]
},{
    
    "id": "s_3",
    "title": "Biology",
    "chapters": [
      {
        "id": "c_1",
        "title": "UNIT 1: Diversity in Living World",
        "topics": [
          {"id": "t_1", "title": "What is living?", "done": false},
          {"id": "t_2", "title": "Biodiversity", "done": false},
          {"id": "t_3", "title": "Need for classification", "done": false},
          {"id": "t_4", "title": "Taxonomy & Systematics", "done": false},
          {"id": "t_5", "title": "Concept of species and taxonomical hierarchy", "done": false},
          {"id": "t_6", "title": "Binomial nomenclature", "done": false},

          {"id": "t_7", "title": "Five kingdom classification", "done": false},
          {"id": "t_8", "title": "Salient features and classification of Monera", "done": false},
          {"id": "t_9", "title": "Salient features and classification of Protista", "done": false},
          {"id": "t_10", "title": "Salient features and classification of Fungi", "done": false},
          {"id": "t_11", "title": "Lichens", "done": false},
          {"id": "t_12", "title": "Viruses and Viroids", "done": false},

          {"id": "t_13", "title": "Salient features and classification of Algae", "done": false},
          {"id": "t_14", "title": "Salient features and classification of Bryophytes", "done": false},
          {"id": "t_15", "title": "Salient features and classification of Pteridophytes", "done": false},
          {"id": "t_16", "title": "Salient features and classification of Gymnosperms", "done": false},

          {"id": "t_17", "title": "Salient features of non-chordates up to phyla level", "done": false},
          {"id": "t_18", "title": "Salient features of chordates up to class level", "done": false}
        ]
      },
      {
        "id": "c_2",
        "title": "UNIT 2: Structural Organisation in Animals and Plants",
        "topics": [
          {"id": "t_19", "title": "Morphology and modifications", "done": false},
          {"id": "t_20", "title": "Plant tissues", "done": false},
          {"id": "t_21", "title": "Anatomy of flowering plants: Root", "done": false},
          {"id": "t_22", "title": "Anatomy of flowering plants: Stem", "done": false},
          {"id": "t_23", "title": "Anatomy of flowering plants: Leaf", "done": false},
          {"id": "t_24", "title": "Inflorescence: Cymose and Racemose", "done": false},
          {"id": "t_25", "title": "Flower, fruit and seed", "done": false},
          {"id": "t_26", "title": "Families: Malvaceae, Cruciferae, Leguminosae, Compositae, Graminae", "done": false},

          {"id": "t_27", "title": "Animal tissues", "done": false},
          {"id": "t_28", "title": "Digestive system of frog", "done": false},
          {"id": "t_29", "title": "Circulatory system of frog", "done": false},
          {"id": "t_30", "title": "Respiratory system of frog", "done": false},
          {"id": "t_31", "title": "Nervous system of frog", "done": false},
          {"id": "t_32", "title": "Reproductive system of frog", "done": false}
        ]
      },
      {
        "id": "c_3",
        "title": "UNIT 3: Cell Structure and Function",
        "topics": [
          {"id": "t_33", "title": "Cell theory", "done": false},
          {"id": "t_34", "title": "Cell as the basic unit of life", "done": false},
          {"id": "t_35", "title": "Prokaryotic cell structure", "done": false},
          {"id": "t_36", "title": "Eukaryotic cell structure", "done": false},
          {"id": "t_37", "title": "Plant cell vs Animal cell", "done": false},

          {"id": "t_38", "title": "Cell envelope, membrane and wall", "done": false},
          {"id": "t_39", "title": "Endoplasmic reticulum", "done": false},
          {"id": "t_40", "title": "Golgi bodies", "done": false},
          {"id": "t_41", "title": "Lysosomes", "done": false},
          {"id": "t_42", "title": "Vacuoles", "done": false},
          {"id": "t_43", "title": "Mitochondria", "done": false},
          {"id": "t_44", "title": "Ribosomes", "done": false},
          {"id": "t_45", "title": "Plastids", "done": false},
          {"id": "t_46", "title": "Microbodies", "done": false},
          {"id": "t_47", "title": "Cytoskeleton", "done": false},
          {"id": "t_48", "title": "Cilia and Flagella", "done": false},
          {"id": "t_49", "title": "Centrioles", "done": false},
          {"id": "t_50", "title": "Nucleus: membrane, chromatin, nucleolus", "done": false},

          {"id": "t_51", "title": "Biomolecules: Proteins", "done": false},
          {"id": "t_52", "title": "Biomolecules: Carbohydrates", "done": false},
          {"id": "t_53", "title": "Biomolecules: Lipids", "done": false},
          {"id": "t_54", "title": "Biomolecules: Nucleic acids", "done": false},
          {"id": "t_55", "title": "Enzymes: types, properties, action", "done": false},
          {"id": "t_56", "title": "Enzyme classification & nomenclature", "done": false},

          {"id": "t_57", "title": "Cell cycle", "done": false},
          {"id": "t_58", "title": "Mitosis", "done": false},
          {"id": "t_59", "title": "Meiosis", "done": false},
          {"id": "t_60", "title": "Significance of mitosis & meiosis", "done": false}
        ]
      },
      {
        "id": "c_4",
        "title": "UNIT 4: Plant Physiology",
        "topics": [
          {"id": "t_61", "title": "Photosynthesis: autotrophic nutrition", "done": false},
          {"id": "t_62", "title": "Site of photosynthesis", "done": false},
          {"id": "t_63", "title": "Photosynthetic pigments", "done": false},
          {"id": "t_64", "title": "Photochemical phase", "done": false},
          {"id": "t_65", "title": "Biosynthetic phase", "done": false},
          {"id": "t_66", "title": "Cyclic and non-cyclic photophosphorylation", "done": false},
          {"id": "t_67", "title": "Chemiosmotic hypothesis", "done": false},
          {"id": "t_68", "title": "Photorespiration", "done": false},
          {"id": "t_69", "title": "C3 and C4 pathways", "done": false},
          {"id": "t_70", "title": "Factors affecting photosynthesis", "done": false},

          {"id": "t_71", "title": "Respiration: gas exchange", "done": false},
          {"id": "t_72", "title": "Glycolysis", "done": false},
          {"id": "t_73", "title": "Fermentation", "done": false},
          {"id": "t_74", "title": "TCA cycle", "done": false},
          {"id": "t_75", "title": "Electron transport system", "done": false},
          {"id": "t_76", "title": "ATP yield", "done": false},
          {"id": "t_77", "title": "Amphibolic pathways", "done": false},
          {"id": "t_78", "title": "Respiratory quotient", "done": false},

          {"id": "t_79", "title": "Seed germination", "done": false},
          {"id": "t_80", "title": "Phases of plant growth", "done": false},
          {"id": "t_81", "title": "Growth rate", "done": false},
          {"id": "t_82", "title": "Differentiation, dedifferentiation, redifferentiation", "done": false},
          {"id": "t_83", "title": "Developmental sequence of plant cell", "done": false},
          {"id": "t_84", "title": "Growth regulators: Auxin", "done": false},
          {"id": "t_85", "title": "Growth regulators: Gibberellin", "done": false},
          {"id": "t_86", "title": "Growth regulators: Cytokinin", "done": false},
          {"id": "t_87", "title": "Growth regulators: Ethylene", "done": false},
          {"id": "t_88", "title": "Growth regulators: ABA", "done": false}
        ]
      },
      {
        "id": "c_5",
        "title": "UNIT 5: Human Physiology",
        "topics": [
          {"id": "t_89", "title": "Respiratory organs in animals (recall)", "done": false},
          {"id": "t_90", "title": "Respiratory system in humans", "done": false},
          {"id": "t_91", "title": "Mechanism & regulation of breathing", "done": false},
          {"id": "t_92", "title": "Exchange of gases", "done": false},
          {"id": "t_93", "title": "Transport of gases", "done": false},
          {"id": "t_94", "title": "Respiratory volumes", "done": false},
          {"id": "t_95", "title": "Respiratory disorders: Asthma, Emphysema, Occupational disorders", "done": false},

          {"id": "t_96", "title": "Blood composition", "done": false},
          {"id": "t_97", "title": "Blood groups", "done": false},
          {"id": "t_98", "title": "Blood coagulation", "done": false},
          {"id": "t_99", "title": "Lymph & its functions", "done": false},
          {"id": "t_100", "title": "Human heart structure", "done": false},
          {"id": "t_101", "title": "Blood vessels", "done": false},
          {"id": "t_102", "title": "Cardiac cycle", "done": false},
          {"id": "t_103", "title": "Cardiac output", "done": false},
          {"id": "t_104", "title": "ECG", "done": false},
          {"id": "t_105", "title": "Double circulation", "done": false},
          {"id": "t_106", "title": "Regulation of cardiac activity", "done": false},
          {"id": "t_107", "title": "Circulatory disorders: Hypertension, CAD, Angina, Heart failure", "done": false},

          {"id": "t_108", "title": "Modes of excretion", "done": false},
          {"id": "t_109", "title": "Human excretory system", "done": false},
          {"id": "t_110", "title": "Urine formation", "done": false},
          {"id": "t_111", "title": "Osmoregulation", "done": false},
          {"id": "t_112", "title": "Kidney regulation: RAAS, ANF, ADH, Diabetes insipidus", "done": false},
          {"id": "t_113", "title": "Other excretory organs", "done": false},
          {"id": "t_114", "title": "Excretory disorders: Uraemia, Renal failure, Calculi, Nephritis", "done": false},
          {"id": "t_115", "title": "Dialysis & artificial kidney", "done": false},

          {"id": "t_116", "title": "Types of movement: Ciliary, Flagellar, Muscular", "done": false},
          {"id": "t_117", "title": "Skeletal muscle contraction", "done": false},
          {"id": "t_118", "title": "Skeletal system & joints", "done": false},
          {"id": "t_119", "title": "Muscular & skeletal disorders", "done": false},

          {"id": "t_120", "title": "Neuron & nerve structure", "done": false},
          {"id": "t_121", "title": "Human nervous system: CNS, PNS, ANS", "done": false},
          {"id": "t_122", "title": "Nerve impulse generation & conduction", "done": false},

          {"id": "t_123", "title": "Human endocrine glands", "done": false},
          {"id": "t_124", "title": "Hormone mechanism of action", "done": false},
          {"id": "t_125", "title": "Hormones as messengers", "done": false},
          {"id": "t_126", "title": "Endocrine disorders: Dwarfism, Acromegaly, Cretinism, Goiter, Diabetes, Addison's", "done": false}
        ]
      },
      {
        "id": "c_6",
        "title": "UNIT 6: Reproduction",
        "topics": [
          {"id": "t_127", "title": "Flower structure in sexual reproduction", "done": false},
          {"id": "t_128", "title": "Development of male gametophyte", "done": false},
          {"id": "t_129", "title": "Development of female gametophyte", "done": false},
          {"id": "t_130", "title": "Pollination types, agencies and examples", "done": false},
          {"id": "t_131", "title": "Outbreeding devices", "done": false},
          {"id": "t_132", "title": "Pollen-pistil interaction", "done": false},
          {"id": "t_133", "title": "Double fertilization", "done": false},
          {"id": "t_134", "title": "Development of endosperm", "done": false},
          {"id": "t_135", "title": "Development of embryo", "done": false},
          {"id": "t_136", "title": "Seed development", "done": false},
          {"id": "t_137", "title": "Fruit formation", "done": false},
          {"id": "t_138", "title": "Apomixis", "done": false},
          {"id": "t_139", "title": "Parthenocarpy", "done": false},
          {"id": "t_140", "title": "Polyembryony", "done": false},
          {"id": "t_141", "title": "Significance of seed and fruit formation", "done": false},

          {"id": "t_142", "title": "Male reproductive system in humans", "done": false},
          {"id": "t_143", "title": "Female reproductive system in humans", "done": false},
          {"id": "t_144", "title": "Microscopic anatomy of testis", "done": false},
          {"id": "t_145", "title": "Microscopic anatomy of ovary", "done": false},
          {"id": "t_146", "title": "Spermatogenesis", "done": false},
          {"id": "t_147", "title": "Oogenesis", "done": false},
          {"id": "t_148", "title": "Menstrual cycle", "done": false},
          {"id": "t_149", "title": "Fertilisation and embryo development up to blastocyst", "done": false},
          {"id": "t_150", "title": "Implantation", "done": false},
          {"id": "t_151", "title": "Pregnancy and placenta formation", "done": false},
          {"id": "t_152", "title": "Parturition", "done": false},
          {"id": "t_153", "title": "Lactation", "done": false},

          {"id": "t_154", "title": "Need for reproductive health", "done": false},
          {"id": "t_155", "title": "Prevention of STDs", "done": false},
          {"id": "t_156", "title": "Birth control need and methods", "done": false},
          {"id": "t_157", "title": "Contraception", "done": false},
          {"id": "t_158", "title": "Medical Termination of Pregnancy (MTP)", "done": false},
          {"id": "t_159", "title": "Amniocentesis", "done": false},
          {"id": "t_160", "title": "Infertility causes", "done": false},
          {"id": "t_161", "title": "ART: IVF", "done": false},
          {"id": "t_162", "title": "ART: ZIFT", "done": false},
          {"id": "t_163", "title": "ART: GIFT", "done": false}
        ]
      },
      {
        "id": "c_7",
        "title": "UNIT 7: Genetics and Evolution",
        "topics": [
          {"id": "t_164", "title": "Heredity and variation", "done": false},
          {"id": "t_165", "title": "Mendelian inheritance", "done": false},
          {"id": "t_166", "title": "Incomplete dominance", "done": false},
          {"id": "t_167", "title": "Co-dominance", "done": false},
          {"id": "t_168", "title": "Multiple alleles", "done": false},
          {"id": "t_169", "title": "Inheritance of blood groups", "done": false},
          {"id": "t_170", "title": "Pleiotropy", "done": false},
          {"id": "t_171", "title": "Polygenic inheritance", "done": false},
          {"id": "t_172", "title": "Chromosome theory of inheritance", "done": false},
          {"id": "t_173", "title": "Chromosomes and genes", "done": false},
          {"id": "t_174", "title": "Sex determination in humans", "done": false},
          {"id": "t_175", "title": "Sex determination in birds", "done": false},
          {"id": "t_176", "title": "Sex determination in honey bees", "done": false},
          {"id": "t_177", "title": "Linkage and crossing over", "done": false},
          {"id": "t_178", "title": "Sex-linked inheritance: Haemophilia", "done": false},
          {"id": "t_179", "title": "Sex-linked inheritance: Colour blindness", "done": false},
          {"id": "t_180", "title": "Mendelian disorders: Thalassemia", "done": false},
          {"id": "t_181", "title": "Chromosomal disorders: Down syndrome", "done": false},
          {"id": "t_182", "title": "Chromosomal disorders: Turner syndrome", "done": false},
          {"id": "t_183", "title": "Chromosomal disorders: Klinefelter syndrome", "done": false},

          {"id": "t_184", "title": "Search for genetic material", "done": false},
          {"id": "t_185", "title": "DNA as genetic material", "done": false},
          {"id": "t_186", "title": "Structure of DNA", "done": false},
          {"id": "t_187", "title": "Structure of RNA", "done": false},
          {"id": "t_188", "title": "DNA packaging", "done": false},
          {"id": "t_189", "title": "DNA replication", "done": false},
          {"id": "t_190", "title": "Central dogma", "done": false},
          {"id": "t_191", "title": "Transcription", "done": false},
          {"id": "t_192", "title": "Genetic code", "done": false},
          {"id": "t_193", "title": "Translation", "done": false},
          {"id": "t_194", "title": "Gene expression regulation: Lac operon", "done": false},
          {"id": "t_195", "title": "Genome & Human Genome Project", "done": false},
          {"id": "t_196", "title": "DNA fingerprinting", "done": false},
          {"id": "t_197", "title": "Protein biosynthesis", "done": false},

          {"id": "t_198", "title": "Origin of life", "done": false},
          {"id": "t_199", "title": "Biological evolution", "done": false},
          {"id": "t_200", "title": "Evidence for evolution: Paleontology", "done": false},
          {"id": "t_201", "title": "Evidence: Comparative anatomy", "done": false},
          {"id": "t_202", "title": "Evidence: Embryology", "done": false},
          {"id": "t_203", "title": "Evidence: Molecular evidence", "done": false},
          {"id": "t_204", "title": "Darwin’s contribution", "done": false},
          {"id": "t_205", "title": "Modern synthetic theory of evolution", "done": false},
          {"id": "t_206", "title": "Mutation and recombination", "done": false},
          {"id": "t_207", "title": "Natural selection and types", "done": false},
          {"id": "t_208", "title": "Gene flow", "done": false},
          {"id": "t_209", "title": "Genetic drift", "done": false},
          {"id": "t_210", "title": "Hardy-Weinberg principle", "done": false},
          {"id": "t_211", "title": "Adaptive radiation", "done": false},
          {"id": "t_212", "title": "Human evolution", "done": false}
        ]
      },
      {
        "id": "c_8",
        "title": "UNIT 8: Biology and Human Welfare",
        "topics": [
          {"id": "t_213", "title": "Health and Disease", "done": false},
          {"id": "t_214", "title": "Pathogens and parasites causing Malaria", "done": false},
          {"id": "t_215", "title": "Parasites causing Filariasis", "done": false},
          {"id": "t_216", "title": "Parasites causing Ascariasis", "done": false},
          {"id": "t_217", "title": "Typhoid", "done": false},
          {"id": "t_218", "title": "Pneumonia", "done": false},
          {"id": "t_219", "title": "Common cold", "done": false},
          {"id": "t_220", "title": "Amoebiasis", "done": false},
          {"id": "t_221", "title": "Ringworm", "done": false},
          {"id": "t_222", "title": "Dengue", "done": false},
          {"id": "t_223", "title": "Chikungunya", "done": false},
          {"id": "t_224", "title": "Immunology basics and vaccines", "done": false},
          {"id": "t_225", "title": "Cancer", "done": false},
          {"id": "t_226", "title": "HIV and AIDS", "done": false},
          {"id": "t_227", "title": "Adolescence issues", "done": false},
          {"id": "t_228", "title": "Drug and alcohol abuse", "done": false},
          {"id": "t_229", "title": "Tobacco abuse", "done": false},

          {"id": "t_230", "title": "Microbes in household food processing", "done": false},
          {"id": "t_231", "title": "Microbes in industrial production", "done": false},
          {"id": "t_232", "title": "Microbes in sewage treatment", "done": false},
          {"id": "t_233", "title": "Microbes in energy generation", "done": false},
          {"id": "t_234", "title": "Microbes as biocontrol agents", "done": false},
          {"id": "t_235", "title": "Microbes as biofertilizers", "done": false}
        ]
      },
      {
        "id": "c_9",
        "title": "UNIT 9: Biotechnology and Its Applications",
        "topics": [
          {"id": "t_236", "title": "Principles of biotechnology", "done": false},
          {"id": "t_237", "title": "Recombinant DNA technology", "done": false},
          {"id": "t_238", "title": "Human insulin production", "done": false},
          {"id": "t_239", "title": "Vaccine production", "done": false},
          {"id": "t_240", "title": "Gene therapy", "done": false},
          {"id": "t_241", "title": "Genetically modified organisms (GMOs)", "done": false},
          {"id": "t_242", "title": "Bt crops", "done": false},
          {"id": "t_243", "title": "Transgenic animals", "done": false},
          {"id": "t_244", "title": "Biosafety issues", "done": false},
          {"id": "t_245", "title": "Biopiracy", "done": false},
          {"id": "t_246", "title": "Patents in biotechnology", "done": false}
        ]
      },
      {
        "id": "c_10",
        "title": "UNIT 10: Ecology and Environment",
        "topics": [
          {"id": "t_247", "title": "Organisms and environment", "done": false},
          {"id": "t_248", "title": "Population interactions: Mutualism", "done": false},
          {"id": "t_249", "title": "Competition", "done": false},
          {"id": "t_250", "title": "Predation", "done": false},
          {"id": "t_251", "title": "Parasitism", "done": false},
          {"id": "t_252", "title": "Population attributes: Growth", "done": false},
          {"id": "t_253", "title": "Birth rate and death rate", "done": false},
          {"id": "t_254", "title": "Age distribution", "done": false},

          {"id": "t_255", "title": "Ecosystem patterns", "done": false},
          {"id": "t_256", "title": "Ecosystem components", "done": false},
          {"id": "t_257", "title": "Productivity", "done": false},
          {"id": "t_258", "title": "Decomposition", "done": false},
          {"id": "t_259", "title": "Energy flow", "done": false},
          {"id": "t_260", "title": "Pyramids of number", "done": false},
          {"id": "t_261", "title": "Pyramids of biomass", "done": false},
          {"id": "t_262", "title": "Pyramids of energy", "done": false},

          {"id": "t_263", "title": "Concept of biodiversity", "done": false},
          {"id": "t_264", "title": "Patterns of biodiversity", "done": false},
          {"id": "t_265", "title": "Importance of biodiversity", "done": false},
          {"id": "t_266", "title": "Loss of biodiversity", "done": false},
          {"id": "t_267", "title": "Biodiversity conservation", "done": false},
          {"id": "t_268", "title": "Biodiversity hotspots", "done": false},
          {"id": "t_269", "title": "Endangered organisms", "done": false},
          {"id": "t_270", "title": "Extinction", "done": false},
          {"id": "t_271", "title": "Red Data Book", "done": false},
          {"id": "t_272", "title": "Biosphere reserves", "done": false},
          {"id": "t_273", "title": "National parks and sanctuaries", "done": false},
          {"id": "t_274", "title": "Sacred groves", "done": false}
    ]
      }

    ]}


  
]
                    ), setPreloadedModel(false),setModalVisible(false)} } className='bg-gray-200 p-3 rounded-lg mb-3'>
                    <Text>Neet</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </GestureDetector>
      </GestureHandlerRootView>
      </View>
      </Modal> 
      


    </View>
  );
}
