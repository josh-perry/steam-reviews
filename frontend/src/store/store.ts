import { configureStore } from '@reduxjs/toolkit';
import gameStatusReducer from './slices/gameStatusSlice';
import dateReducer from './slices/dateSlice';

export const store = configureStore({
  reducer: {
    gameStatus: gameStatusReducer,
    date: dateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
