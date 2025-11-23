import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService, GameRound as ApiGameRound } from '../../services/api';
import { clearOldProgress } from '../../services/reviews/localSave';
import { ImagePreloader } from '../../services/imagePreloader';
import type { RootState } from '../store';

export interface Game {
	id: number;
	name: string;
	appId: number;
	rating: number;
	reviewCount: number;
	imgUrl: string;
	tags?: string[];
}

export interface RoundResult {
	gameA: Game;
	gameB: Game;
	selectedGame: Game | null;
	correctGame: Game;
	isCorrect: boolean;
	played: boolean;
	resultVisible: boolean;
}

export interface GameRound {
	gameA: Game;
	gameB: Game;
	correctGame: Game;
}

interface ReviewsGameState {
	currentRound: number;
	totalRounds: number;
	roundResults: RoundResult[];
	preGeneratedRounds: GameRound[];
	score: number;
	currentRoundAnswered: boolean;
	showingResults: boolean;
	showResultColors: boolean;
	gameInProgress: boolean;
	gameComplete: boolean;
	selectedResultRound: number;
}

const initialState: ReviewsGameState = {
	currentRound: 0,
	totalRounds: 10,
	roundResults: [],
	preGeneratedRounds: [],
	score: 0,
	currentRoundAnswered: false,
	showingResults: false,
	showResultColors: false,
	gameInProgress: false,
	gameComplete: false,
	selectedResultRound: 0,
};

export const fetchRounds = createAsyncThunk(
	'reviewsGame/fetchRounds',
	async (_, { rejectWithValue }) => {
		const response = await apiService.getRounds();
		if (response.error) {
			return rejectWithValue(response.error);
		}
		return response.data || [];
	}
);

export const startReviewsGame = createAsyncThunk(
	'reviewsGame/startGame',
	async (_, { dispatch, getState }) => {
		const result = await dispatch(fetchRounds());
		if (fetchRounds.rejected.match(result)) {
			throw new Error(result.payload as string);
		}
		
		const state = getState() as RootState;
		const dailyDate = state.date.dailyDate;
		
		if (dailyDate) {
			clearOldProgress(dailyDate);
		}
		
		return result.payload as ApiGameRound[];
	}
);

export const getCurrentRoundData = (state: { reviewsGame: ReviewsGameState }): GameRound | null => {
	const { currentRound, preGeneratedRounds } = state.reviewsGame;
	return preGeneratedRounds[currentRound - 1] || null;
};

const reviewsGameSlice = createSlice({
	name: 'reviewsGame',
	initialState,
	reducers: {
		submitRoundAnswer: (state, action: PayloadAction<{ selectedGame: Game }>) => {
			const { selectedGame } = action.payload;
			const currentRoundIndex = state.currentRound - 1;
			const nextRoundIndex = state.currentRound;

			if (nextRoundIndex < state.preGeneratedRounds.length) {
				const nextRound = state.preGeneratedRounds[nextRoundIndex];
				const imagePreloader = ImagePreloader.getInstance();
				
				imagePreloader.preloadNextRoundImages([
					nextRound.gameA.appId,
					nextRound.gameB.appId
				]);
			}
			
			state.currentRoundAnswered = true;
			state.showingResults = true;
			
			if (currentRoundIndex >= 0 && currentRoundIndex < state.roundResults.length) {
				const roundResult = state.roundResults[currentRoundIndex];
				const isCorrect = selectedGame.appId === roundResult.correctGame.appId;
				
				roundResult.selectedGame = selectedGame;
				roundResult.isCorrect = isCorrect;
				roundResult.played = true;
				roundResult.resultVisible = false;
				
				if (isCorrect) {
					state.score += 1;
				}
			}
		},

		showRoundResult: (state) => {
			const currentRoundIndex = state.currentRound - 1;
			
			if (currentRoundIndex >= 0 && currentRoundIndex < state.roundResults.length) {
				const roundResult = state.roundResults[currentRoundIndex];
				roundResult.resultVisible = true;
			}
		},

		showRoundResultColors: (state) => {
			state.showResultColors = true;
		},

		proceedToNextRound: (state) => {
			state.showingResults = false;
			state.showResultColors = false;
			
			if (state.currentRound >= state.totalRounds) {
				state.gameComplete = true;
				state.gameInProgress = false;
			} else {
				state.currentRound += 1;
				state.currentRoundAnswered = false;
			}
		},
		
		restoreProgress: (state, action: PayloadAction<{
			score: number;
			currentRound: number;
			roundResults: Array<{
				gameAId: number;
				gameBId: number;
				selectedGameId: number;
				correctGameId: number;
				isCorrect: boolean;
			}>;
		}>) => {
			const { score, currentRound, roundResults: savedRoundResults } = action.payload;
			
			state.score = score;
			state.currentRound = currentRound;
			state.currentRoundAnswered = false;
			state.showingResults = false;
			state.gameInProgress = true;
			state.gameComplete = false;
			
			savedRoundResults.forEach((savedRound, index) => {
				if (index < state.roundResults.length) {
					const roundResult = state.roundResults[index];
					if (savedRound.selectedGameId) {
						roundResult.selectedGame = savedRound.selectedGameId === roundResult.gameA.appId 
							? roundResult.gameA 
							: roundResult.gameB;
						roundResult.isCorrect = savedRound.isCorrect;
						roundResult.played = true;
						roundResult.resultVisible = true;
					}
				 }
			});
			
			const allRoundsPlayed = state.roundResults.every(round => round.played);
			if (allRoundsPlayed) {
				state.gameComplete = true;
				state.gameInProgress = false;
			}
		},
		
		resetReviewsGame: () => initialState,
		
		showCompletedGame: (state) => {
			state.gameComplete = true;
			state.gameInProgress = false;
		},

		setSelectedResultRound: (state, action: PayloadAction<number>) => {
			state.selectedResultRound = action.payload;
		},

		jumpToRound: (state, action: PayloadAction<number>) => {
			const targetRound = action.payload;
			const nextUnplayedRound = state.roundResults.findIndex(r => !r.played) + 1;
			
			// When game is complete, allow jumping to any round
			const canJump = state.gameComplete 
				? (targetRound >= 1 && targetRound <= state.totalRounds)
				: (targetRound <= nextUnplayedRound && targetRound >= 1 && targetRound <= state.totalRounds);
			
			if (canJump) {
				state.currentRound = targetRound;
				state.currentRoundAnswered = true;
				state.showingResults = true;
				state.showResultColors = false;
				
				// Ensure result is marked as visible for this round
				const roundResult = state.roundResults[targetRound - 1];
				if (roundResult) {
					roundResult.resultVisible = true;
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRounds.fulfilled, (state, action) => {
				state.preGeneratedRounds = action.payload;
				state.roundResults = state.preGeneratedRounds.map((round) => ({
					gameA: round.gameA,
					gameB: round.gameB,
					selectedGame: null,
					correctGame: round.correctGame,
					isCorrect: false,
					played: false,
					resultVisible: false
				}));
			})
			.addCase(startReviewsGame.fulfilled, (state, action) => {
				state.gameInProgress = true;
				state.gameComplete = false;
				state.currentRound = 1;
				state.score = 0;
				state.currentRoundAnswered = false;
				state.showingResults = false;
				
				state.preGeneratedRounds = action.payload;
				
				state.roundResults = state.preGeneratedRounds.map((round) => ({
					gameA: round.gameA,
					gameB: round.gameB,
					selectedGame: null,
					correctGame: round.correctGame,
					isCorrect: false,
					played: false,
					resultVisible: false
				}));
			});
	}
});

export const { 
	submitRoundAnswer,
	showRoundResult,
	showRoundResultColors,
	proceedToNextRound,
	jumpToRound,
	restoreProgress,
	resetReviewsGame,
	showCompletedGame,
	setSelectedResultRound
} = reviewsGameSlice.actions;

export default reviewsGameSlice.reducer;
