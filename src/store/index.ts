import { configureStore } from '@reduxjs/toolkit';
import tradeReducer from './tradeSlice';
import taxReducer from './taxSlice';

export const store = configureStore({
  reducer: {
    trade: tradeReducer,
    tax: taxReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
