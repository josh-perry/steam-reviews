import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GameMode = 'reviews' | 'tags';

interface GameModeState {
	currentMode: GameMode;
}

const initialState: GameModeState = {
	currentMode: 'reviews',
};

const gameModeSlice = createSlice({
	name: 'gameMode',
	initialState,
	reducers: {
		setGameMode: (state, action: PayloadAction<GameMode>) => {
			state.currentMode = action.payload;
		},
	},
});

export const { 
	setGameMode,
} = gameModeSlice.actions;

export default gameModeSlice.reducer;
