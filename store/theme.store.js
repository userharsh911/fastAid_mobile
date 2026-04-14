import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_PREFERENCE_KEY = "themePreference";
const FALLBACK_THEME_PREFERENCE = "system";
const VALID_THEME_PREFERENCES = new Set(["system", "light", "dark"]);

const normalizeThemePreference = (value) => {
  if (typeof value !== "string") return FALLBACK_THEME_PREFERENCE;

  const normalized = value.trim().toLowerCase();
  if (!VALID_THEME_PREFERENCES.has(normalized)) {
    return FALLBACK_THEME_PREFERENCE;
  }

  return normalized;
};

const useThemeBear = create((set) => ({
  themePreference: FALLBACK_THEME_PREFERENCE,
  themeHydrated: false,

  loadThemePreference: async () => {
    try {
      const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      const normalizedPreference = normalizeThemePreference(storedPreference);
      set({
        themePreference: normalizedPreference,
        themeHydrated: true,
      });
    } catch (error) {
      console.log("error while loading theme preference ", error);
      set({ themeHydrated: true });
    }
  },

  setThemePreference: async (preference) => {
    const normalizedPreference = normalizeThemePreference(preference);

    set({ themePreference: normalizedPreference });

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, normalizedPreference);
      return { success: true, themePreference: normalizedPreference };
    } catch (error) {
      console.log("error while setting theme preference ", error);
      return { success: false, message: "Unable to save theme preference" };
    }
  },
}));

export default useThemeBear;
