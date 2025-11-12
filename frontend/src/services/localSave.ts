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