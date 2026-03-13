import React, { useEffect } from 'react';
import { View } from 'react-native';
import './global.css';
import { Provider } from "react-redux";
import store from "./src/store.js";
import Xp from './components/Xp';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {

  useEffect(() => {
    // Request permissions for notifications
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        //        console.log('Notification permissions not granted');
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <View className='flex-1'><Xp /></View>
      </Provider>
    </GestureHandlerRootView>
  );
}              