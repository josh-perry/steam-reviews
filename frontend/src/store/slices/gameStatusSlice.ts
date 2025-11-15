import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService, GameRound as ApiGameRound } from '../../services/api';
import { clearOldProgress } from '../../services/localSave';
import { ImagePreloader } from '../../services/imagePreloader';
import type { RootState } from '../store';

export interface Game {
	id: number;
	name: string;
	appId: number;
	rating: number;
	reviewCount: number;
	imgUrl: string;
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

interface GameStatusState {
	currentRound: number;
	totalRounds: number;
	roundResults: RoundResult[];
	preGeneratedRounds: GameRound[];
	gameInProgress: boolean;
	gameComplete: boolean;
	score: number;
	loading: boolean;
	currentRoundAnswered: boolean;
	showingResults: boolean;
	error: string | null;
}

const initialState: GameStatusState = {
	currentRound: 0,
	totalRounds: 10,
	roundResults: [],
	preGeneratedRounds: [],
	gameInProgress: false,
	gameComplete: false,
	score: 0,
	loading: false,
	currentRoundAnswered: false,
	showingResults: false,
	error: null,
};

export const fetchRounds = createAsyncThunk(
	'gameStatus/fetchRounds',
	async (_, { rejectWithValue }) => {
		const response = await apiService.getRounds();
		if (response.error) {
			return rejectWithValue(response.error);
		}
		return response.data || [];
	}
);

export const startGameWithData = createAsyncThunk(
	'gameStatus/startGameWithData',
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

export const getCurrentRoundData = (state: { gameStatus: GameStatusState }): GameRound | null => {
	const { currentRound, preGeneratedRounds } = state.gameStatus;
	return preGeneratedRounds[currentRound - 1] || null;
};

const gameStatusSlice = createSlice({
	name: 'gameStatus',
	initialState,
	reducers: {
		submitRoundAnswer: (state, action: PayloadAction<{ selectedGame: Game }>) => {
			const { selectedGame } = action.payload;
			const currentRoundIndex = state.currentRound - 1;
			
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

			const nextRoundIndex = state.currentRound;
			if (nextRoundIndex < state.preGeneratedRounds.length) {
				const nextRound = state.preGeneratedRounds[nextRoundIndex];
				const imagePreloader = ImagePreloader.getInstance();
				
				imagePreloader.preloadNextRoundImages([
					nextRound.gameA.appId,
					nextRound.gameB.appId
				]);
			}
		},

		proceedToNextRound: (state) => {
			state.showingResults = false;
			
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
			state.gameInProgress = true;
			state.gameComplete = false;
			state.currentRoundAnswered = false;
			state.showingResults = false;
			
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
			
			// Needed if user refreshes while on last round
			const allRoundsPlayed = state.roundResults.every(round => round.played);
			if (allRoundsPlayed) {
				state.gameComplete = true;
				state.gameInProgress = false;
			}
		},
		
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},

		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRounds.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchRounds.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				
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
			.addCase(fetchRounds.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string || 'Failed to fetch rounds';
			})
			.addCase(startGameWithData.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(startGameWithData.fulfilled, (state, action) => {
				state.loading = false;
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
			})
			.addCase(startGameWithData.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Failed to start game';
			});
	}
});

export const { 
	submitRoundAnswer,
	showRoundResult,
	proceedToNextRound,
	restoreProgress,
	setLoading,
	clearError
} = gameStatusSlice.actions;

export default gameStatusSlice.reducer;
