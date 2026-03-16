import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, FlatList,
    Modal, ScrollView, StyleSheet, TextInput as RNTextInput,
    SafeAreaView, StatusBar, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { setProfileimg, setUsername } from "../src/store";
import { useDispatch, useSelector } from "react-redux";
import { subscribeToLogs, clearLogs } from '../src/consoleLogger';

const AVATARS = [
    require('../assets/img.jpg'),
    require('../assets/img2.jpg'),
    require('../assets/img3.jpg'),
];

/* ─── level colours ───────────────────────────────────────── */
const LEVEL_COLORS = {
    log:   { bg: '#1e293b', text: '#e2e8f0', tag: '#3b82f6', tagText: '#fff' },
    info:  { bg: '#0f2a1a', text: '#86efac', tag: '#22c55e', tagText: '#fff' },
    warn:  { bg: '#2d1a00', text: '#fde68a', tag: '#f59e0b', tagText: '#000' },
    error: { bg: '#2a0a0a', text: '#fca5a5', tag: '#ef4444', tagText: '#fff' },
};

/* ─── single log row ──────────────────────────────────────── */
function LogRow({ item }) {
    const c = LEVEL_COLORS[item.level] || LEVEL_COLORS.log;
    return (
        <View style={[styles.logRow, { backgroundColor: c.bg }]}>
            <View style={[styles.levelBadge, { backgroundColor: c.tag }]}>
                <Text style={[styles.levelText, { color: c.tagText }]}>
                    {item.level.toUpperCase()}
                </Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
            <Text style={[styles.logMessage, { color: c.text }]} selectable>
                {item.message}
            </Text>
        </View>
    );
}

/* ─── in-app console modal ────────────────────────────────── */
function ConsoleModal({ visible, onClose }) {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (!visible) return;
        const unsub = subscribeToLogs(setLogs);
        return unsub;
    }, [visible]);

    const filtered = logs.filter(l => {
        if (filter !== 'all' && l.level !== filter) return false;
        if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const FILTERS = ['all', 'log', 'info', 'warn', 'error'];

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.consoleContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

                {/* Header */}
                <View style={styles.consoleHeader}>
                    <View style={styles.consoleHeaderLeft}>
                        <MaterialCommunityIcons name="console" size={20} color="#7dd3fc" />
                        <Text style={styles.consoleTitle}>App Console</Text>
                        <View style={styles.logCountBadge}>
                            <Text style={styles.logCountText}>{logs.length}</Text>
                        </View>
                    </View>
                    <View style={styles.consoleHeaderRight}>
                        <TouchableOpacity
                            onPress={() => { clearLogs(); }}
                            style={styles.clearBtn}
                        >
                            <MaterialCommunityIcons name="delete-sweep" size={18} color="#f87171" />
                            <Text style={styles.clearBtnText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <AntDesign name="close" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchRow}>
                    <Feather name="search" size={14} color="#64748b" style={{ marginRight: 6 }} />
                    <RNTextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search logs…"
                        placeholderTextColor="#475569"
                        style={styles.searchInput}
                    />
                </View>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterRow}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
                >
                    {FILTERS.map(f => {
                        const active = filter === f;
                        const col = f === 'all' ? '#7dd3fc' : LEVEL_COLORS[f]?.tag ?? '#7dd3fc';
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFilter(f)}
                                style={[
                                    styles.chip,
                                    { borderColor: col },
                                    active && { backgroundColor: col },
                                ]}
                            >
                                <Text style={[styles.chipText, active && { color: '#000' }]}>
                                    {f.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Log list */}
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="console-line" size={48} color="#334155" />
                        <Text style={styles.emptyText}>No logs yet</Text>
                        <Text style={styles.emptySubText}>
                            Logs will appear here in real-time
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={filtered}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <LogRow item={item} />}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        style={{ flex: 1 }}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

/* ─── main Settings component ────────────────────────────── */
export default function Settings() {
    const [profilePic, setProfilePic] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [theme, setTheme] = useState('light');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [consoleVisible, setConsoleVisible] = useState(false);
    const dispatch = useDispatch();
    const Theme = useSelector((state) => state.profile.theme);

    const THEMES_STYLE = {
        light: { label: 'Light', backgroundColor: '#fff', textColor: '#000' },
        dark:  { label: 'Dark',  backgroundColor: '#222', textColor: '#fff' },
    };

    const THEMES = [
        { key: 'light', label: 'Light', backgroundColor: '#fff', textColor: '#000' },
        { key: 'dark',  label: 'Dark',  backgroundColor: '#222', textColor: '#fff' },
    ];

    useEffect(() => {
        async function savetheme() {
            if (theme) await AsyncStorage.setItem('theme', theme);
        }
        savetheme();
    }, [theme]);

    useEffect(() => {
        (async () => {
            const savedProfilePic = await AsyncStorage.getItem('profilePic');
            if (savedProfilePic) {
                setProfilePic(savedProfilePic);
                if (savedProfilePic.startsWith('avatar:')) {
                    setSelectedAvatar(parseInt(savedProfilePic.split(':')[1]));
                }
            }
        })();
    }, []);

    useEffect(() => {
        dispatch(setProfileimg(profilePic));
        if (profilePic) {
            AsyncStorage.setItem('profilePic', profilePic);
        }
    }, [profilePic]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
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

    const renderAvatar = ({ item, index }) => {
        const isAvatar = !item.uri;
        const currentId = isAvatar ? `avatar:${index}` : item.uri;
        const isSelected = profilePic === currentId;

        return (
            <TouchableOpacity
                onPress={() => {
                    setProfilePic(currentId);
                    if (isAvatar) setSelectedAvatar(index);
                }}
                className="mx-2"
            >
                <Image
                    source={isAvatar ? AVATARS[index] : { uri: item.uri }}
                    className={`w-[50px] h-[50px] rounded-full border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}
                />
            </TouchableOpacity>
        );
    };

    const bg = THEMES_STYLE[Theme || 'light'].backgroundColor;
    const tc = THEMES_STYLE[Theme || 'light'].textColor;

    return (
        <View className="flex-1 items-center px-6 py-6" style={{ backgroundColor: bg, paddingTop: 48 }}>

            {/* Profile Section */}
            <View className="w-full mb-4 flex flex-row h-[200px] bg-indigo-100 rounded-2xl p-5 shadow items-start">
                <View className="items-center mr-4 relative">
                    {profilePic ? (
                        <Image
                            source={profilePic.startsWith('avatar:')
                                ? AVATARS[parseInt(profilePic.split(':')[1])]
                                : { uri: profilePic }}
                            className="w-[70px] h-[70px] rounded-full border-2 flex justify-center items-center border-gray-400"
                        />
                    ) : (
                        <View className="w-[70px] h-[70px] rounded-full border-2 border-gray-400 bg-gray-200 items-center justify-center">
                            <Text style={{ color: tc }}>No Image</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={pickImage}
                        className="absolute top-20 right-0 rounded-full bg-blue-500 h-[30px] w-[30px] p-1 flex items-center justify-center"
                    >
                        <AntDesign name="upload" color="white" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Name and Avatars */}
                <View className="flex-1 ml-2">
                    <View className="mb-2">
                        <Text className="text-lg font-bold mb-1" style={{ color: tc }}>Name</Text>
                        <NameInput />
                    </View>
                    <Text className="text-lg font-bold mb-1">Select Avatar</Text>
                    <FlatList
                        data={[...AVATARS, ...uploadedImages]}
                        renderItem={renderAvatar}
                        keyExtractor={(_, idx) => idx.toString()}
                        horizontal
                        className="my-2"
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
                        console.log('AsyncStorage dump:', allData);
                    }}
                >
                    <Text className="text-white font-bold">Log All Data</Text>
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

            {/* ── Console Button ── */}
            <TouchableOpacity
                onPress={() => {
                    console.log('Console opened');
                    setConsoleVisible(true);
                }}
                style={styles.consoleOpenBtn}
            >
                <MaterialCommunityIcons name="console" size={20} color="#fff" />
                <Text style={styles.consoleOpenBtnText}>Open Console</Text>
            </TouchableOpacity>

            {/* Console Modal */}
            <ConsoleModal
                visible={consoleVisible}
                onClose={() => setConsoleVisible(false)}
            />
        </View>
    );
}

/* ─── NameInput ───────────────────────────────────────────── */
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
        await AsyncStorage.setItem('profileName', val);
        dispatch(setUsername(val));
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

/* ─── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
    /* Open-console button */
    consoleOpenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        width: '100%',
        backgroundColor: '#1e293b',
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    consoleOpenBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.4,
    },

    /* Console modal */
    consoleContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    consoleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        backgroundColor: '#0f172a',
    },
    consoleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    consoleTitle: {
        color: '#e2e8f0',
        fontWeight: '700',
        fontSize: 16,
    },
    logCountBadge: {
        backgroundColor: '#1e40af',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 1,
    },
    logCountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    consoleHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1e293b',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    clearBtnText: {
        color: '#f87171',
        fontSize: 13,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 6,
    },

    /* Search */
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    searchInput: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 13,
    },

    /* Filter chips */
    filterRow: {
        flexShrink: 0,
    },
    chip: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 3,
        marginRight: 8,
    },
    chipText: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '700',
    },

    /* Log rows */
    logRow: {
        padding: 10,
        marginHorizontal: 8,
        marginVertical: 3,
        borderRadius: 8,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginBottom: 4,
    },
    levelText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: 10,
        color: '#475569',
        marginBottom: 3,
    },
    logMessage: {
        fontSize: 12,
        fontFamily: 'monospace', // shows nicely on Android
        lineHeight: 18,
    },

    /* Empty state */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#475569',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        color: '#334155',
        fontSize: 13,
    },
});
