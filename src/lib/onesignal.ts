import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = "ab9508ad-37de-44e9-bdf7-57dd5b4ed792";

export const initOneSignal = async () => {
  try {
    if (typeof window === 'undefined') return;
    
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true,
      },
    });
  } catch (error) {
    console.error("OneSignal init error:", error);
  }
};

export const loginToOneSignal = async (userId: string) => {
  try {
    if (typeof window === 'undefined') return;
    if (!OneSignal.initialized) {
      await initOneSignal();
    }
    
    await OneSignal.login(userId);
  } catch (error) {
    console.error("OneSignal login error:", error);
  }
};

export const logoutFromOneSignal = async () => {
  try {
    if (typeof window === 'undefined') return;
    if (OneSignal.initialized) {
      await OneSignal.logout();
    }
  } catch (error) {
    console.error("OneSignal logout error:", error);
  }
};
