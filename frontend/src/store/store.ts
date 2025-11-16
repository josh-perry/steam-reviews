import { configureStore } from '@reduxjs/toolkit';
import gameModeReducer from './slices/gameModeSlice';
import reviewsGameReducer from './slices/reviewsGameSlice';
import tagsGameReducer from './slices/tagsGameSlice';
import dateReducer from './slices/dateSlice';
import { gameCompleteMiddleware } from './middleware/gameCompleteMiddleware';

export const store = configureStore({
  reducer: {
    gameMode: gameModeReducer,
    reviewsGame: reviewsGameReducer,
    tagsGame: tagsGameReducer,
    date: dateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(gameCompleteMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;