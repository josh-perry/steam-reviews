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
    highestStreak: number;
    allDays: { [key: string]: DailyResult };
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

function migrateOldFormat(): void {
    const saveStr = localStorage.getItem(SAVE_KEY);
    
    if (saveStr) {
        try {
            const save = JSON.parse(saveStr);
            
            if (Array.isArray(save.currentStreak)) {
                const newSave: Save = {
                    highestStreak: save.highestStreak || 0,
                    allDays: save.allDays || {}
                };
                
                if (save.currentStreak.length > 0) {
                    save.currentStreak.forEach((result: DailyResult) => {
                        if (result.day && !newSave.allDays[result.day]) {
                            newSave.allDays[result.day] = result;
                        }
                    });
                }
                
                localStorage.setItem(SAVE_KEY, JSON.stringify(newSave));
            }
        } catch (e) {
            localStorage.removeItem(SAVE_KEY);
        }
    }
}

export function testMigrateOldFormat(): void {
    migrateOldFormat();
}

function calculateCurrentStreak(allDays: { [key: string]: DailyResult }): number {
    if (Object.keys(allDays).length === 0) {
        return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    let currentDate = new Date(today);

    if (!allDays[todayStr]) {
        currentDate.setDate(currentDate.getDate() - 1);
        const yesterdayStr = currentDate.toISOString().split('T')[0];
        
        if (!allDays[yesterdayStr]) {
            return 0;
        }
    }

    let streakCount = 0;

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const result = allDays[dateStr];

        if (!result || !result.success) {
            break;
        }

        streakCount++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streakCount;
}

function calculateLongestStreak(allDays: { [key: string]: DailyResult }): number {
    const days = Object.keys(allDays).sort();
    
    if (days.length === 0) {
        return 0;
    }

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const day of days) {
        const result = allDays[day];
        const currentDate = new Date(day);

        if (lastDate) {
            const expectedDate = new Date(lastDate);
            expectedDate.setDate(expectedDate.getDate() + 1);
            
            if (currentDate.getTime() !== expectedDate.getTime() || !result.success) {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = result.success ? 1 : 0;
                lastDate = result.success ? currentDate : null;
                continue;
            }
        }

        if (result.success) {
            currentStreak++;
            lastDate = currentDate;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
            lastDate = null;
        }
    }

    return Math.max(longestStreak, currentStreak);
}

export function saveDailyResult(day: string, success: boolean, guessesUsed: number): void {
    const saveStr = localStorage.getItem(SAVE_KEY);

    let save: Save;
    if (saveStr) {
        save = JSON.parse(saveStr);
        if (!save.allDays) {
            save.allDays = {};
        }
    } else {
        save = {
            highestStreak: 0,
            allDays: {}
        };
    }

    save.allDays[day] = { day, success, guessesUsed };

    const currentStreak = calculateCurrentStreak(save.allDays);
    const longestStreak = calculateLongestStreak(save.allDays);
    save.highestStreak = Math.max(save.highestStreak, longestStreak);
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function hasPlayedToday(day: string): boolean {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return save.allDays && save.allDays[day] !== undefined;
    }

    return false;
}

export function getTodaysResult(day: string): DailyResult | null {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return save.allDays && save.allDays[day] ? save.allDays[day] : null;
    }

    return null;
}

export function getStreakInfo(): { currentStreak: number; highestStreak: number } {
    const saveStr = localStorage.getItem(SAVE_KEY);

    if (saveStr) {
        const save: Save = JSON.parse(saveStr);
        return {
            currentStreak: calculateCurrentStreak(save.allDays),
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

migrateOldFormat();
