import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
};

const HARDCODED_GAMES: Game[] = [
	{
		id: 1,
		name: "Counter-Strike 2",
		appId: 730,
		rating: 4.2,
		reviewCount: 15420
	},
	{
		id: 2,
		name: "Dota 2",
		appId: 570,
		rating: 4.5,
		reviewCount: 28650
	},
	{
		id: 3,
		name: "Steam Deck",
		appId: 1675200,
		rating: 4.8,
		reviewCount: 8943
	},
	{
		id: 4,
		name: "Apex Legends",
		appId: 1172470,
		rating: 3.9,
		reviewCount: 45231
	},
	{
		id: 5,
		name: "Team Fortress 2",
		appId: 440,
		rating: 4.6,
		reviewCount: 67890
	},
	{
		id: 6,
		name: "Portal 2",
		appId: 620,
		rating: 4.9,
		reviewCount: 12567
	},
	{
		id: 7,
		name: "Half-Life: Alyx",
		appId: 546560,
		rating: 4.7,
		reviewCount: 9834
	}
];

const generateGameRounds = (totalRounds: number): GameRound[] => {
	const rounds: GameRound[] = [];
	
	for (let i = 0; i < totalRounds; i++) {
		const shuffled = [...HARDCODED_GAMES].sort(() => 0.5 - Math.random());
		const gameA = shuffled[0];
		const gameB = shuffled[1];
		
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
		startGame: (state) => {
			state.gameInProgress = true;
			state.gameComplete = false;
			state.currentRound = 1;
			state.score = 0;
			state.currentRoundAnswered = false;
			
			state.preGeneratedRounds = generateGameRounds(state.totalRounds);
			
			state.roundResults = state.preGeneratedRounds.map((round) => ({
				gameA: round.gameA,
				gameB: round.gameB,
				selectedGame: null,
				correctGame: round.correctGame,
				isCorrect: false,
				played: false
			}));
		},
		
		submitRoundAnswer: (state, action: PayloadAction<{ selectedGame: Game }>) => {
			const { selectedGame } = action.payload;
			const currentRoundIndex = state.currentRound - 1;
			
			state.currentRoundAnswered = true;
			
			if (currentRoundIndex >= 0 && currentRoundIndex < state.roundResults.length) {
				const roundResult = state.roundResults[currentRoundIndex];
				const isCorrect = selectedGame.appId === roundResult.correctGame.appId;
				
				roundResult.selectedGame = selectedGame;
				roundResult.isCorrect = isCorrect;
				roundResult.played = true;
				
				if (isCorrect) {
					state.score += 1;
				}
				
				if (state.currentRound >= state.totalRounds) {
					state.gameComplete = true;
					state.gameInProgress = false;
				} else {
					state.currentRound += 1;
					state.currentRoundAnswered = false;
				}
			}
		},
		
		resetGame: (_) => {
			return initialState;
		},
		
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		}
	}
});

export const { 
	startGame, 
	submitRoundAnswer, 
	resetGame, 
	setLoading 
} = gameStatusSlice.actions;

export default gameStatusSlice.reducer;
