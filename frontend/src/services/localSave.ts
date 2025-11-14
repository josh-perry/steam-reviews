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
}

interface InProgressGame {
    score: number;
    currentRound: number;
    roundResults: RoundResult[];
    timestamp: number;
}

export function saveDailyResult(day: string, correct: number, roundResults: boolean[]): void {
    const saveStr = localStorage.getItem('dailySave');

    let save: Save;
    if (saveStr) {
        save = JSON.parse(saveStr);
    } else {
        save = {
            currentStreak: [],
            highestStreak: 0
        };
    }

    save.currentStreak.push({ day, numberCorrect: correct, roundResults });
    save.highestStreak = Math.max(save.highestStreak, save.currentStreak.length);
    
    localStorage.setItem('dailySave', JSON.stringify(save));
}

export function hasPlayedToday(day: string): boolean {
    const saveStr = localStorage.getItem('dailySave');

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return save.currentStreak.some(result => result.day === day);
    }

    return false;
}

export function getTodaysResult(day: string): DailyResult | null {
    const saveStr = localStorage.getItem('dailySave');

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return save.currentStreak.find(result => result.day === day) || null;
    }

    return null;
}

export function getStreakInfo(): { currentStreak: number; highestStreak: number } {
    const saveStr = localStorage.getItem('dailySave');

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return {
            currentStreak: save.currentStreak.length,
            highestStreak: save.highestStreak
        };
    }
    
    return { currentStreak: 0, highestStreak: 0 };
}

export function saveCurrentProgress(day: string, score: number, currentRound: number, roundResults: RoundResult[]): void {
    const key = `progress_${day}`;
    const progress: InProgressGame = {
        score,
        currentRound: currentRound + 1,
        roundResults,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(progress));
}

export function loadCurrentProgress(day: string): InProgressGame | null {
    const key = `progress_${day}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        return JSON.parse(saved);
    }
    return null;
}

export function clearCurrentProgress(day: string): void {
    const key = `progress_${day}`;
    localStorage.removeItem(key);
}

export function clearOldProgress(currentDay: string): void {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find and remove any progress keys that don't match today
    keys.forEach(key => {
        if (key.startsWith('progress_') && key !== `progress_${currentDay}`) {
            localStorage.removeItem(key);
        }
    });
}