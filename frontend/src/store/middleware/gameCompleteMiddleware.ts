import { Middleware } from '@reduxjs/toolkit';
import { saveDailyResult } from '../../services/localSave';
import type { RoundResult } from '../slices/gameStatusSlice';

export const gameCompleteMiddleware: Middleware = (store) => (next) => (action) => {
	const prevState = store.getState();
	const result = next(action);
	const nextState = store.getState();

    // Not complete -> complete. Need to save result.
	if (!prevState.gameStatus.gameComplete && nextState.gameStatus.gameComplete) {
		const { dailyDate } = nextState.date;
		const { score, roundResults } = nextState.gameStatus;

		if (dailyDate) {
			const booleanResults = roundResults.map((round: RoundResult) => round.isCorrect);
			saveDailyResult(dailyDate, score, booleanResults);
		}
	}

	return result;
};
