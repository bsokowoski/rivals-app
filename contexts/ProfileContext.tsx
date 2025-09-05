// context/ProfileContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of a user profile
export type UserProfile = {
  name: string;
  email: string;
  rewards: number;
  favoritePokemon: string;
};

// Define the shape of the context
export type ProfileContextType = {
  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => void;
  setRewards: (points: number) => void;
  updateFavoritePokemon: (pokemon: string) => void;
};

// Create the context with default values
const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  saveProfile: () => {},
  setRewards: () => {},
  updateFavoritePokemon: () => {},
});

// Custom hook to use the context
export const useProfile = () => useContext(ProfileContext);

// The context provider
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile on first render
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userProfile');
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Save/update profile
  const saveProfile = async (newProfile: UserProfile) => {
    try {
      setProfile(newProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  // Update reward points
  const setRewards = async (points: number) => {
    if (profile) {
      const updated = { ...profile, rewards: points };
      setProfile(updated);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    }
  };

  // Update favorite Pokémon
  const updateFavoritePokemon = async (pokemon: string) => {
    if (profile) {
      const updated = { ...profile, favoritePokemon: pokemon };
      setProfile(updated);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, saveProfile, setRewards, updateFavoritePokemon }}>
      {children}
    </ProfileContext.Provider>
  );
};
