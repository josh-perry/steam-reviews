interface RoundResult {
    gameAId: number;
    gameBId: number;
    selectedGameId: number;
    correctGameId: number;
    isCorrect: boolean;
}

interface DailyResult {
    day: string;
    success: boolean;
    guessesUsed: number;
}

interface Save {
    currentStreak: DailyResult[];
    highestStreak: number;
}

interface InProgressGame {
    score: number;
    currentRound: number;
    roundResults: RoundResult[];
    timestamp: number;
    currentGuesses?: string[];
    hints?: string[];
}

const SAVE_KEY = 'dailySaveTags';
const GAME_MODE = 'tags';

export function saveDailyResult(day: string, success: boolean, guessesUsed: number): void {
    const saveStr = localStorage.getItem(SAVE_KEY);

    let save: Save;
    if (saveStr) {
        save = JSON.parse(saveStr);
    } else {
        save = {
            currentStreak: [],
            highestStreak: 0
        };
    }

    const existingIndex = save.currentStreak.findIndex(result => result.day === day);
    
    if (existingIndex !== -1) {
        save.currentStreak[existingIndex] = { day, success, guessesUsed };
    } else {
        if (success) {
            save.currentStreak.push({ day, success, guessesUsed });
            save.highestStreak = Math.max(save.highestStreak, save.currentStreak.length);
        } else {
            save.currentStreak = [{ day, success, guessesUsed }];
        }
    }
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function hasPlayedToday(day: string): boolean {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return save.currentStreak.some(result => result.day === day);
    }

    return false;
}

export function getTodaysResult(day: string): DailyResult | null {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
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
    roundResults: RoundResult[], 
    currentGuesses?: string[], 
    hints?: string[]
): void {
    const key = `progress_${day}_${GAME_MODE}`;
    const progress: InProgressGame = {
        score,
        currentRound: currentRound + 1,
        roundResults,
        timestamp: Date.now(),
        ...(currentGuesses && { currentGuesses }),
        ...(hints && { hints })
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
