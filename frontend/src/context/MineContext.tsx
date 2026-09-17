import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Mine } from '../types';
import { mineService } from '../services';
import { useAuth } from './AuthContext';

interface FocusedTarget {
  type: 'sensor' | 'camera' | 'equipment' | 'zone' | 'incident' | 'anomaly';
  id?: number;
  x: number;
  y: number;
  z: number;
  title?: string;
  distance?: number;
}

interface MineContextType {
  mines: Mine[];
  selectedMine: Mine | null;
  selectedMineId: number | null;
  setSelectedMineId: (id: number) => void;
  isLoading: boolean;
  refreshMines: () => Promise<void>;
  focusedTarget: FocusedTarget | null;
  setFocusedTarget: (target: FocusedTarget | null) => void;
  focusInDigitalTwin: (target: FocusedTarget) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const MineContext = createContext<MineContextType | undefined>(undefined);

export const MineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedTarget, setFocusedTarget] = useState<FocusedTarget | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const refreshMines = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await mineService.getMines();
      setMines(data);
      if (data.length > 0) {
        setSelectedMineIdState((prev) => {
          if (prev && data.some((m) => m.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
      } else {
        setSelectedMineIdState(null);
      }
    } catch (err) {
      console.error('Failed to fetch mines:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshMines();
    } else {
      setMines([]);
      setSelectedMineIdState(null);
    }
  }, [isAuthenticated, refreshMines]);

  const setSelectedMineId = (id: number) => {
    setSelectedMineIdState(id);
  };

  const focusInDigitalTwin = (target: FocusedTarget) => {
    setFocusedTarget(target);
    setCurrentTab('digital-twin');
  };

  const selectedMine = mines.find((m) => m.id === selectedMineId) || null;

  return (
    <MineContext.Provider
      value={{
        mines,
        selectedMine,
        selectedMineId,
        setSelectedMineId,
        isLoading,
        refreshMines,
        focusedTarget,
        setFocusedTarget,
        focusInDigitalTwin,
        currentTab,
        setCurrentTab
      }}
    >
      {children}
    </MineContext.Provider>
  );
};

export const useMineContext = (): MineContextType => {
  const context = useContext(MineContext);
  if (!context) {
    throw new Error('useMineContext must be used within a MineProvider');
  }
  return context;
};
