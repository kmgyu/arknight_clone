// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from '@/features/resources/resourceSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
  },
});

export default store;