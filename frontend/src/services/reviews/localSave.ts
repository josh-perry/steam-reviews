interface RoundResult {
    gameAId: number;
    gameBId: number;
    selectedGameId: number;
    correctGameId: number;
    isCorrect: boolean;
}

interface DailyResult {
    day: string;
    numberCorrect: number;
    roundResults: boolean[];
}

interface Save {
    currentStreak: DailyResult[];
    highestStreak: number;
    allDays: { [key: string]: DailyResult };
}

interface InProgressGame {
    score: number;
    currentRound: number;
    roundResults: RoundResult[];
    timestamp: number;
}

const SAVE_KEY = 'dailySave';
const GAME_MODE = 'reviews';

export function saveDailyResult(day: string, correct: number, roundResults: boolean[]): void {
    const saveStr = localStorage.getItem(SAVE_KEY);

    let save: Save;
    if (saveStr) {
        save = JSON.parse(saveStr);
        if (!save.allDays) {
            save.allDays = {};
        }
    } else {
        save = {
            currentStreak: [],
            highestStreak: 0,
            allDays: {}
        };
    }

    if (save.allDays[day]) {
        save.allDays[day] = { day, numberCorrect: correct, roundResults };
        
        const existingIndex = save.currentStreak.findIndex(result => result.day === day);
        if (existingIndex !== -1) {
            save.currentStreak[existingIndex] = { day, numberCorrect: correct, roundResults };
        }
    } else {
        save.allDays[day] = { day, numberCorrect: correct, roundResults };
        
        if (save.currentStreak.length > 0) {
            const lastDay = save.currentStreak[save.currentStreak.length - 1].day;
            const lastDate = new Date(lastDay);
            const currentDate = new Date(day);
            
            const diffTime = currentDate.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays !== 1) {
                save.currentStreak = [];
            }
        }
        
        save.currentStreak.push({ day, numberCorrect: correct, roundResults });
        save.highestStreak = Math.max(save.highestStreak, save.currentStreak.length);
    }
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function hasPlayedToday(day: string): boolean {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        if (save.allDays && save.allDays[day]) {
            return true;
        }

        return save.currentStreak.some(result => result.day === day);
    }

    return false;
}

export function getTodaysResult(day: string): DailyResult | null {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);

        if (save.allDays && save.allDays[day]) {
            return save.allDays[day];
        }

        return save.currentStreak.find(result => result.day === day) || null;
    }

    return null;
}

export function getStreakInfo(): { currentStreak: number; highestStreak: number } {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return {
            currentStreak: save.currentStreak.length,
            highestStreak: save.highestStreak
        };
    }
    
    return { currentStreak: 0, highestStreak: 0 };
}

export function saveCurrentProgress(
    day: string,
    score: number, 
    currentRound: number, 
    roundResults: RoundResult[]
): void {
    const key = `progress_${day}_${GAME_MODE}`;
    const progress: InProgressGame = {
        score,
        currentRound: currentRound + 1,
        roundResults,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(progress));
}

export function loadCurrentProgress(day: string): InProgressGame | null {
    const key = `progress_${day}_${GAME_MODE}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        return JSON.parse(saved);
    }
    return null;
}

export function clearCurrentProgress(day: string): void {
    const key = `progress_${day}_${GAME_MODE}`;
    localStorage.removeItem(key);
}

export function clearOldProgress(currentDay: string): void {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith(`progress_`) && key.endsWith(`_${GAME_MODE}`)) {
            const parts = key.split('_');
            if (parts.length >= 3) {
                const dateInKey = parts.slice(1, -1).join('_');
                if (dateInKey !== currentDay) {
                    localStorage.removeItem(key);
                }
            }
        }
    });
}
