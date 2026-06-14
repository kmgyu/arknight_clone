// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from '@/stores/slices/resourceSlice';
import runReducer from '@/stores/slices/runSlice';
import metaReducer from '@/stores/slices/metaSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
    run: runReducer,
    meta: metaReducer,
  },
});

export default store;