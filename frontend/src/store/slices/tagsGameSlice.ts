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
	developers: string[];
	publishers: string[];
}

export interface TagsRoundResult {
	correctGame: Game;
	userGuesses: string[];
	isCorrect: boolean;
	played: boolean;
	resultVisible: boolean;
}

interface TagsGameState {
	currentRound: number;
	totalRounds: number;
	roundResults: TagsRoundResult[];
	hints: string[];
	dailyGame: Game | null;
	score: number;
	currentRoundAnswered: boolean;
	showingResults: boolean;
	showResultColors: boolean;
	gameInProgress: boolean;
	gameComplete: boolean;
	currentGuesses: string[];
	maxGuesses: number;
}

const initialState: TagsGameState = {
	currentRound: 0,
	totalRounds: 1,
	roundResults: [],
	hints: [],
	dailyGame: null,
	score: 0,
	currentRoundAnswered: false,
	showingResults: false,
	showResultColors: false,
	gameInProgress: false,
	gameComplete: false,
	currentGuesses: [],
	maxGuesses: 10,
};

export const fetchTagGame = createAsyncThunk(
	'tagsGame/fetchTagGame',
	async (_, { rejectWithValue }) => {
		const response = await apiService.getTagGame();
		if (response.error) {
			return rejectWithValue(response.error);
		}

		return response.data!;
	}
);

export const startTagsGame = createAsyncThunk(
	'tagsGame/startGame',
	async (_, { dispatch, getState }) => {
		const result = await dispatch(fetchTagGame());
		if (fetchTagGame.rejected.match(result)) {
			throw new Error(result.payload as string);
		}
		
		const state = getState() as RootState;
		const dailyDate = state.date.dailyDate;
		
		if (dailyDate) {
			clearOldProgress(dailyDate);
		}
		
		return result.payload as Game;
	}
);

export const getCurrentGame = (state: { tagsGame: TagsGameState }): Game | null => {
	return state.tagsGame.dailyGame;
};

const tagsGameSlice = createSlice({
	name: 'tagsGame',
	initialState,
	reducers: {
		submitGuess: (state, action: PayloadAction<{ guess: string; isCorrect: boolean }>) => {
			const { guess, isCorrect } = action.payload;
			const currentRoundIndex = state.currentRound - 1;
			
			state.currentGuesses.push(guess);
			
			const shouldEndRound = isCorrect || state.currentGuesses.length >= state.maxGuesses;
			
			if (shouldEndRound) {
				state.currentRoundAnswered = true;
				state.showingResults = true;
			}
			
			if (currentRoundIndex >= 0 && currentRoundIndex < state.roundResults.length) {
				const roundResult = state.roundResults[currentRoundIndex];
				
				roundResult.userGuesses = [...state.currentGuesses];
				roundResult.isCorrect = isCorrect;
				roundResult.played = true;
				roundResult.resultVisible = false;
				
				if (isCorrect) {
					state.score += 1;
				} else {
					if (state.currentGuesses.length === 1) {
						state.hints.push(`Publisher: ${state.dailyGame?.publishers.join(', ')}`);
					} else if (state.currentGuesses.length === 2) {
						state.hints.push(`Developer: ${state.dailyGame?.developers.join(', ')}`);
					}
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
			state.currentGuesses = [];
			
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
			.addCase(fetchTagGame.fulfilled, (state, action) => {
				state.dailyGame = action.payload;
				state.roundResults = [{
					correctGame: action.payload,
					userGuesses: [],
					isCorrect: false,
					played: false,
					resultVisible: false
				}];
			})
			.addCase(startTagsGame.fulfilled, (state, action) => {
				state.gameInProgress = true;
				state.gameComplete = false;
				state.currentRound = 1;
				state.score = 0;
				state.currentRoundAnswered = false;
				state.showingResults = false;
				state.currentGuesses = [];
				
				state.dailyGame = action.payload;
				
				state.roundResults = [{
					correctGame: action.payload,
					userGuesses: [],
					isCorrect: false,
					played: false,
					resultVisible: false
				}];
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
