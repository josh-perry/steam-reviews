import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { clearOldProgress } from '../../services/localSave';
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

export interface TagsRoundResult {
	correctGame: Game;
	userGuess: string | null;
	isCorrect: boolean;
	played: boolean;
	resultVisible: boolean;
}

interface TagsGameState {
	currentRound: number;
	totalRounds: number;
	roundResults: TagsRoundResult[];
	preGeneratedGames: Game[];
	score: number;
	currentRoundAnswered: boolean;
	showingResults: boolean;
	showResultColors: boolean;
	gameInProgress: boolean;
	gameComplete: boolean;
}

const initialState: TagsGameState = {
	currentRound: 0,
	totalRounds: 10,
	roundResults: [],
	preGeneratedGames: [],
	score: 0,
	currentRoundAnswered: false,
	showingResults: false,
	showResultColors: false,
	gameInProgress: false,
	gameComplete: false,
};

export const fetchTagsGames = createAsyncThunk(
	'tagsGame/fetchGames',
	async (_, { rejectWithValue }) => {
		const response = await apiService.getRounds();
		if (response.error) {
			return rejectWithValue(response.error);
		}

		return (response.data || []).map(round => round.correctGame);
	}
);

export const startTagsGame = createAsyncThunk(
	'tagsGame/startGame',
	async (_, { dispatch, getState }) => {
		const result = await dispatch(fetchTagsGames());
		if (fetchTagsGames.rejected.match(result)) {
			throw new Error(result.payload as string);
		}
		
		const state = getState() as RootState;
		const dailyDate = state.date.dailyDate;
		
		if (dailyDate) {
			clearOldProgress(dailyDate);
		}
		
		return result.payload as Game[];
	}
);

export const getCurrentGame = (state: { tagsGame: TagsGameState }): Game | null => {
	const { currentRound, preGeneratedGames } = state.tagsGame;
	return preGeneratedGames[currentRound - 1] || null;
};

const tagsGameSlice = createSlice({
	name: 'tagsGame',
	initialState,
	reducers: {
		submitGuess: (state, action: PayloadAction<{ guess: string; isCorrect: boolean }>) => {
			const { guess, isCorrect } = action.payload;
			const currentRoundIndex = state.currentRound - 1;
			
			state.currentRoundAnswered = true;
			state.showingResults = true;
			
			if (currentRoundIndex >= 0 && currentRoundIndex < state.roundResults.length) {
				const roundResult = state.roundResults[currentRoundIndex];
				
				roundResult.userGuess = guess;
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
		
		resetTagsGame: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchTagsGames.fulfilled, (state, action) => {
				state.preGeneratedGames = action.payload;
				state.roundResults = state.preGeneratedGames.map((game) => ({
					correctGame: game,
					userGuess: null,
					isCorrect: false,
					played: false,
					resultVisible: false
				}));
			})
			.addCase(startTagsGame.fulfilled, (state, action) => {
				state.gameInProgress = true;
				state.gameComplete = false;
				state.currentRound = 1;
				state.score = 0;
				state.currentRoundAnswered = false;
				state.showingResults = false;
				
				state.preGeneratedGames = action.payload;
				
				state.roundResults = state.preGeneratedGames.map((game) => ({
					correctGame: game,
					userGuess: null,
					isCorrect: false,
					played: false,
					resultVisible: false
				}));
			});
	}
});

export const { 
	submitGuess,
	showRoundResult,
	showRoundResultColors,
	proceedToNextRound,
	resetTagsGame
} = tagsGameSlice.actions;

export default tagsGameSlice.reducer;
