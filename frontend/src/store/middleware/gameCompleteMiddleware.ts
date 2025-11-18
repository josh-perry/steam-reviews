import { Middleware } from '@reduxjs/toolkit';
import { saveDailyResult as saveReviewsDailyResult, saveCurrentProgress as saveReviewsCurrentProgress, clearCurrentProgress as clearReviewsCurrentProgress, hasPlayedToday as hasPlayedTodayReviews } from '../../services/reviews/localSave';
import { saveDailyResult as saveTagsDailyResult, saveCurrentProgress as saveTagsCurrentProgress, clearCurrentProgress as clearTagsCurrentProgress, hasPlayedToday as hasPlayedTodayTags } from '../../services/tags/localSave';
import { 
	showRoundResult as showReviewsRoundResult, 
	showRoundResultColors as showReviewsRoundResultColors, 
	proceedToNextRound as proceedReviewsToNextRound 
} from '../slices/reviewsGameSlice';
import { 
	showRoundResult as showTagsRoundResult, 
	showRoundResultColors as showTagsRoundResultColors, 
	proceedToNextRound as proceedTagsToNextRound 
} from '../slices/tagsGameSlice';
import type { RoundResult } from '../slices/reviewsGameSlice';
import type { TagsRoundResult } from '../slices/tagsGameSlice';

const ANIMATION_DURATION = 750;
const WAIT_AFTER_ANIMATION = 1500;
const TOTAL_WAIT = ANIMATION_DURATION + WAIT_AFTER_ANIMATION;

export const gameCompleteMiddleware: Middleware = (store) => (next) => (action: any) => {
	const prevState = store.getState();
	const result = next(action);
	const nextState = store.getState();

	if (action.type === 'reviewsGame/submitRoundAnswer') {
		store.dispatch(showReviewsRoundResult());

		setTimeout(() => {
			store.dispatch(showReviewsRoundResultColors());
		}, ANIMATION_DURATION);

		setTimeout(() => {
			store.dispatch(proceedReviewsToNextRound());
		}, TOTAL_WAIT);

		const { dailyDate } = nextState.date;
		const { score, currentRound, roundResults } = nextState.reviewsGame;

		if (dailyDate) {
			const savedRoundResults = roundResults.map((round: RoundResult) => ({
				gameAId: round.gameA.appId,
				gameBId: round.gameB.appId,
				selectedGameId: round.selectedGame?.appId || 0,
				correctGameId: round.correctGame.appId,
				isCorrect: round.isCorrect
			}));

			saveReviewsCurrentProgress(dailyDate, score, currentRound, savedRoundResults);
		}
	}

	if (action.type === 'tagsGame/submitGuess') {
		const { currentRoundAnswered } = nextState.tagsGame;
		
		if (currentRoundAnswered) {
			store.dispatch(showTagsRoundResult());

			setTimeout(() => {
				store.dispatch(showTagsRoundResultColors());
			}, ANIMATION_DURATION);
		}

		const { dailyDate } = nextState.date;
		const { score, currentRound, roundResults, currentGuesses, hints } = nextState.tagsGame;

		if (dailyDate) {
			const savedRoundResults = roundResults.map((round: TagsRoundResult, index: number) => ({
				gameAId: round.correctGame.appId,
				gameBId: round.correctGame.appId,
				selectedGameId: round.isCorrect ? round.correctGame.appId : 0,
				correctGameId: round.correctGame.appId,
				isCorrect: round.isCorrect
			}));

			saveTagsCurrentProgress(dailyDate, score, currentRound, savedRoundResults, currentGuesses, hints);
		}
	}

	if (!prevState.reviewsGame.gameComplete && nextState.reviewsGame.gameComplete) {
		const { dailyDate } = nextState.date;
		
		if (dailyDate && !hasPlayedTodayReviews(dailyDate)) {
			const { score, roundResults } = nextState.reviewsGame;
			const booleanResults = roundResults.map((round: RoundResult) => round.isCorrect);
			saveReviewsDailyResult(dailyDate, score, booleanResults);
			clearReviewsCurrentProgress(dailyDate);
		}
	}

	if (!prevState.tagsGame.gameComplete && nextState.tagsGame.gameComplete) {
		const { dailyDate } = nextState.date;
		
		if (dailyDate && !hasPlayedTodayTags(dailyDate)) {
			const { roundResults, currentGuesses } = nextState.tagsGame;
			const isCorrect = roundResults[0]?.isCorrect || false;
			const guessesUsed = currentGuesses.length;
			saveTagsDailyResult(dailyDate, isCorrect, guessesUsed);
			clearTagsCurrentProgress(dailyDate);
		}
	}

	return result;
};
