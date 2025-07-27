// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from '@/stores/slices/resourceSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
  },
});

export default store;