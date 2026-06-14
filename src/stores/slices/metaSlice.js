// src/stores/slices/metaSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { UPGRADES } from '@/config/gameData';

const saveToLocalStorage = (state) => {
  try {
    localStorage.setItem('arknights_fan_meta_state', JSON.stringify(state));
  } catch (err) {
    console.error('메타 상태 저장 실패:', err);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('arknights_fan_meta_state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('메타 상태 로드 실패:', err);
  }
  return null;
};

const initialMetaState = {
  historyRemake: 10, // 테스트를 위해 초기값 10 지급
  mythFragments: 0,
  upgrades: [] // 구매 완료된 업그레이드 ID 목록
};

const savedState = loadFromLocalStorage();
const initialState = savedState || initialMetaState;

const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    earnHistoryRemake: (state, action) => {
      state.historyRemake += action.payload;
      saveToLocalStorage(state);
    },
    earnMythFragments: (state, action) => {
      state.mythFragments += action.payload;
      saveToLocalStorage(state);
    },
    purchaseUpgrade: (state, action) => {
      const upgradeId = action.payload;
      const upgrade = UPGRADES.find(u => u.id === upgradeId);
      if (upgrade && !state.upgrades.includes(upgradeId) && state.historyRemake >= upgrade.cost) {
        state.historyRemake -= upgrade.cost;
        state.upgrades.push(upgradeId);
        saveToLocalStorage(state);
      }
    },
    resetMeta: (state) => {
      Object.assign(state, initialMetaState);
      saveToLocalStorage(state);
    }
  }
});

// 영구 업그레이드로 획득한 누적 버프 효과를 계산하는 헬퍼 함수
export const selectMetaBuffs = (state) => {
  const meta = state.meta;
  const buffs = {
    startingLife: 0,
    startingHorn: 0,
    startingHope: 0,
    sanity_resist: 0,
    global_damage: 0,
    global_defense: 0
  };

  meta.upgrades.forEach(id => {
    const upgrade = UPGRADES.find(u => u.id === id);
    if (upgrade && upgrade.effect) {
      Object.keys(upgrade.effect).forEach(key => {
        buffs[key] = (buffs[key] || 0) + upgrade.effect[key];
      });
    }
  });

  return buffs;
};

export const {
  earnHistoryRemake,
  earnMythFragments,
  purchaseUpgrade,
  resetMeta
} = metaSlice.actions;

export default metaSlice.reducer;
