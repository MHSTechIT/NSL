import { createContext, useContext } from 'react';
import { TIMER_DEFAULTS } from '../config/timerSchema';
export const TimerSettingsContext = createContext(TIMER_DEFAULTS);
export function useTimerSettings() { return useContext(TimerSettingsContext); }
