import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

export interface Game {
	id: number;
	name: string;
	appId: number;
	rating: number;
	reviewCount: number;
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
	games: Game[];
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
	games: [],
	error: null,
};

export const fetchGames = createAsyncThunk(
	'gameStatus/fetchGames',
	async (_, { rejectWithValue }) => {
		const response = await apiService.getGames();
		if (response.error) {
			return rejectWithValue(response.error);
		}
		return response.data || [];
	}
);

export const startGameWithData = createAsyncThunk(
	'gameStatus/startGameWithData',
	async (_, { dispatch, getState }) => {
		const state = getState() as { gameStatus: GameStatusState };
		
		if (state.gameStatus.games.length === 0) {
			const result = await dispatch(fetchGames());
			if (fetchGames.rejected.match(result)) {
				throw new Error(result.payload as string);
			}
			return result.payload as Game[];
		}
		
		return state.gameStatus.games;
	}
);

const generateGameRounds = (games: Game[], totalRounds: number): GameRound[] => {
	const rounds: GameRound[] = [];
	
	if (games.length < 2) {
		return rounds;
	}
	
	const shuffledGames = [...games].sort(() => 0.5 - Math.random());
	let gameIndex = 0;
	
	for (let i = 0; i < totalRounds; i++) {
		if (gameIndex + 1 >= shuffledGames.length) {
			const remainingGames = shuffledGames.slice(gameIndex);
			const newShuffled = [...games].filter(g => !remainingGames.includes(g)).sort(() => 0.5 - Math.random());
			shuffledGames.splice(gameIndex, 0, ...newShuffled);
		}
		
		const gameA = shuffledGames[gameIndex];
		const gameB = shuffledGames[gameIndex + 1];
		gameIndex += 2;
		
		const correctGame = gameA.rating! > gameB.rating! ? gameA : gameB;
		
		rounds.push({
			gameA,
			gameB,
			correctGame
		});
	}
	
	return rounds;
};

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
		
		resetGame: (state) => {
			return {
				...initialState,
				games: state.games,
			};
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
			.addCase(fetchGames.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchGames.fulfilled, (state, action) => {
				state.loading = false;
				state.games = action.payload;
				state.error = null;
			})
			.addCase(fetchGames.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string || 'Failed to fetch games';
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
				state.games = action.payload;
				
				state.preGeneratedRounds = generateGameRounds(action.payload, state.totalRounds);
				
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
	resetGame, 
	setLoading,
	clearError
} = gameStatusSlice.actions;

export default gameStatusSlice.reducer;
