import { Middleware } from '@reduxjs/toolkit';
import { saveDailyResult, saveCurrentProgress, clearCurrentProgress, clearOldProgress } from '../../services/localSave';
import { showRoundResult, showRoundResultColors, proceedToNextRound } from '../slices/gameStatusSlice';
import type { RoundResult } from '../slices/gameStatusSlice';

const ANIMATION_DURATION = 750;
const WAIT_AFTER_ANIMATION = 1500;
const TOTAL_WAIT = ANIMATION_DURATION + WAIT_AFTER_ANIMATION;

export const gameCompleteMiddleware: Middleware = (store) => (next) => (action: any) => {
	const prevState = store.getState();
	const result = next(action);
	const nextState = store.getState();

	if (action.type === 'gameStatus/submitRoundAnswer') {
		store.dispatch(showRoundResult());

		setTimeout(() => {
			store.dispatch(showRoundResultColors());
		}, ANIMATION_DURATION);

		setTimeout(() => {
			store.dispatch(proceedToNextRound());
		}, TOTAL_WAIT);

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
