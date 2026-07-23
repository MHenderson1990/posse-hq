import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDevice } from './api/devices';

let listenersAttached = false;

export function setupPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  if (!listenersAttached) {
    listenersAttached = true;
    PushNotifications.addListener('registration', (token) => {
      registerDevice(token.value, 'ios').catch((err) => console.error('Device registration failed:', err.message));
    });
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });
  }

  PushNotifications.requestPermissions().then((result) => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    }
  });
}
