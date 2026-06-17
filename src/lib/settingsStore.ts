import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  lowQualityMode: boolean;
  setLowQualityMode: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lowQualityMode: false,
      setLowQualityMode: (value) => set({ lowQualityMode: value }),
    }),
    { name: 'hogwarts-settings' }
  )
);
