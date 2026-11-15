import { configureStore } from '@reduxjs/toolkit';
import tradeReducer from './tradeSlice';
import taxReducer from './taxSlice';
import dividendReducer from './dividendSlice';
import filingReducer from './filingSlice';

export const store = configureStore({
  reducer: {
    trade: tradeReducer,
    tax: taxReducer,
    dividend: dividendReducer,
    filing: filingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
