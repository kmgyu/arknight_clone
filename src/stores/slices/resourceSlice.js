import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userResources: {
    historyRemake: 0,
    mythFragments: 0,
  },
  gameResources: {
    horn: 0,
    hope: 0,
    deployable: 0,
    toilLimit: 0,
    toil: 0,
  }
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    // userResources 관련
    setHistoryRemake: (state, action) => {
      state.userResources.historyRemake = action.payload;
    },
    addMythFragments: (state, action) => {
      state.userResources.mythFragments += action.payload;
    },

    // gameResources 관련
    incrementHorn: (state, action) => {
      state.gameResources.horn += action.payload;
    },
    spendHope: (state, action) => {
      state.gameResources.hope -= action.payload;
    },
    setDeployable: (state, action) => {
      state.gameResources.deployable = action.payload;
    },
    increaseToil: (state, action) => {
      state.gameResources.toil += action.payload;
    },
    setToilLimit: (state, action) => {
      state.gameResources.toilLimit = action.payload;
    },

    resetGameResources: (state) => {
      state.gameResources = initialState.gameResources;
    }
  }
});

export const {
  setHistoryRemake,
  addMythFragments,
  incrementHorn,
  spendHope,
  setDeployable,
  increaseToil,
  setToilLimit,
  resetGameResources
} = resourceSlice.actions;

export default resourceSlice.reducer;
