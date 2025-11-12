import { configureStore } from '@reduxjs/toolkit';
import gameStatusReducer from './slices/gameStatusSlice';
import dateReducer from './slices/dateSlice';
import { gameCompleteMiddleware } from './middleware/gameCompleteMiddleware';

export const store = configureStore({
  reducer: {
    gameStatus: gameStatusReducer,
    date: dateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(gameCompleteMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;