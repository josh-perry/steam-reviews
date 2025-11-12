import { Middleware } from '@reduxjs/toolkit';
import { saveDailyResult, saveCurrentProgress, clearCurrentProgress, clearOldProgress } from '../../services/localSave';
import type { RoundResult } from '../slices/gameStatusSlice';

export const gameCompleteMiddleware: Middleware = (store) => (next) => (action: any) => {
	const prevState = store.getState();
	const result = next(action);
	const nextState = store.getState();

	if (action.type === 'gameStatus/submitRoundAnswer') {
		const { dailyDate } = nextState.date;
		const { score, currentRound, roundResults } = nextState.gameStatus;

		if (dailyDate) {
			const savedRoundResults = roundResults.map((round: RoundResult) => ({
				gameAId: round.gameA.appId,
				gameBId: round.gameB.appId,
				selectedGameId: round.selectedGame?.appId || 0,
				correctGameId: round.correctGame.appId,
				isCorrect: round.isCorrect
			}));

			saveCurrentProgress(dailyDate, score, currentRound, savedRoundResults);
		}
	}

	if (!prevState.gameStatus.gameComplete && nextState.gameStatus.gameComplete) {
		const { dailyDate } = nextState.date;
		const { score, roundResults } = nextState.gameStatus;

		if (dailyDate) {
			const booleanResults = roundResults.map((round: RoundResult) => round.isCorrect);
			saveDailyResult(dailyDate, score, booleanResults);
			clearCurrentProgress(dailyDate);
		}
	}

	return result;
};
