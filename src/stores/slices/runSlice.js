// src/stores/slices/runSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { generateDAGGraph } from '@/utils/graphGenerator';

// 로컬스토리지 세이브 로드 헬퍼
const saveToLocalStorage = (state) => {
  try {
    localStorage.setItem('arknights_fan_run_state', JSON.stringify(state));
  } catch (err) {
    console.error('로컬스토리지 저장 실패:', err);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('arknights_fan_run_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Set 등으로 변경된 데이터 타입 보정 필요시 처리
      return parsed;
    }
  } catch (err) {
    console.error('로컬스토리지 로드 실패:', err);
  }
  return null;
};

const initialRunState = {
  isActive: false,
  floor: 1,
  level: 0,
  lifePoints: 6,
  maxLifePoints: 6,
  hope: 6,
  horn: 12,
  recruitedOperators: [], // { id, templateId, name, class, hp, maxHp, sanity, sp, level, stats, skills, avatarColor }
  relics: [], // relic definitions
  mapNodes: [],
  mapEdges: [],
  currentNodeId: null,
  completedNodes: [],
  activeCombat: null, // { wave, party: [opId, opId, ...], enemies: [...], turnQueue: [], currentTurnIndex, logs: [], phase }
  combatHistory: [],
  squadType: 'default',
  metaBuffs: {} // { startingLife, startingHope, startingHorn, sanityResist, damageMult, defenseMult }
};

const savedState = loadFromLocalStorage();
const initialState = savedState || initialRunState;

const runSlice = createSlice({
  name: 'run',
  initialState,
  reducers: {
    startNewRun: (state, action) => {
      const { squadType, metaBuffs, initialOperators } = action.payload;
      
      const startingLife = 6 + (metaBuffs.startingLife || 0) + (squadType === 'support' ? 2 : 0);
      const startingHope = 6 + (metaBuffs.startingHope || 0) + (squadType === 'leader' ? 2 : 0);
      const startingHorn = 12 + (metaBuffs.startingHorn || 0) + (squadType === 'gather' ? 20 : 0);
      
      const graph = generateDAGGraph(1, 4, 4);
      
      state.isActive = true;
      state.floor = 1;
      state.level = 0;
      state.maxLifePoints = startingLife;
      state.lifePoints = startingLife;
      state.hope = startingHope;
      state.horn = startingHorn;
      state.recruitedOperators = initialOperators || [];
      state.relics = [];
      state.mapNodes = graph.nodes;
      state.mapEdges = graph.edges;
      state.currentNodeId = null;
      state.completedNodes = [];
      state.activeCombat = null;
      state.combatHistory = [];
      state.squadType = squadType;
      state.metaBuffs = metaBuffs;
      
      saveToLocalStorage(state);
    },
    
    recruitOperator: (state, action) => {
      const { operator, hopeCost, hornCost } = action.payload;
      state.recruitedOperators.push(operator);
      state.hope = Math.max(0, state.hope - hopeCost);
      state.horn = Math.max(0, state.horn - hornCost);
      saveToLocalStorage(state);
    },
    
    promoteOperator: (state, action) => {
      const { opId, hopeCost } = action.payload;
      const op = state.recruitedOperators.find(o => o.id === opId);
      if (op) {
        op.level = 2; // Elite 2
        op.maxHp = Math.round(op.maxHp * 1.25);
        op.hp = op.maxHp;
        op.stats.atk = Math.round(op.stats.atk * 1.25);
        op.stats.def = Math.round(op.stats.def * 1.25);
        state.hope = Math.max(0, state.hope - hopeCost);
      }
      saveToLocalStorage(state);
    },
    
    healOperator: (state, action) => {
      const { opId, hpAmount, sanityAmount, cost } = action.payload;
      const op = state.recruitedOperators.find(o => o.id === opId);
      if (op) {
        op.hp = Math.min(op.maxHp, op.hp + hpAmount);
        op.sanity = Math.min(100, op.sanity + sanityAmount);
        if (cost) state.horn = Math.max(0, state.horn - cost);
      }
      saveToLocalStorage(state);
    },

    healAllOperators: (state, action) => {
      const { hpPct, sanityAmount } = action.payload;
      state.recruitedOperators.forEach(op => {
        op.hp = Math.min(op.maxHp, op.hp + Math.round(op.maxHp * hpPct));
        op.sanity = Math.min(100, op.sanity + sanityAmount);
      });
      saveToLocalStorage(state);
    },
    
    gainHorn: (state, action) => {
      state.horn += action.payload;
      saveToLocalStorage(state);
    },
    
    spendHorn: (state, action) => {
      state.horn = Math.max(0, state.horn - action.payload);
      saveToLocalStorage(state);
    },
    
    gainHope: (state, action) => {
      state.hope += action.payload;
      saveToLocalStorage(state);
    },
    
    spendHope: (state, action) => {
      state.hope = Math.max(0, state.hope - action.payload);
      saveToLocalStorage(state);
    },
    
    changeLifePoints: (state, action) => {
      state.lifePoints = Math.max(0, state.lifePoints + action.payload);
      if (state.lifePoints <= 0) {
        // 게임 오버 처리
        state.isActive = false;
      }
      saveToLocalStorage(state);
    },
    
    addRelic: (state, action) => {
      const relic = action.payload;
      if (!state.relics.some(r => r.id === relic.id)) {
        state.relics.push(relic);
        // 소장품 즉시 효과 (희망 등)
        if (relic.effect && relic.effect.hope) {
          state.hope += relic.effect.hope;
        }
      }
      saveToLocalStorage(state);
    },
    
    selectNode: (state, action) => {
      const nodeId = action.payload;
      state.currentNodeId = nodeId;
      saveToLocalStorage(state);
    },
    
    completeActiveNode: (state) => {
      if (state.currentNodeId && !state.completedNodes.includes(state.currentNodeId)) {
        state.completedNodes.push(state.currentNodeId);
        
        // 보스 노드 클리어 시 다음 Floor로 진행
        const node = state.mapNodes.find(n => n.id === state.currentNodeId);
        if (node && node.type === 'BOSS') {
          if (state.floor >= 5) {
            // 게임 승리
            state.isActive = false;
          } else {
            // 다음 층 그래프 생성
            const nextFloor = state.floor + 1;
            const graph = generateDAGGraph(nextFloor, 4, 4);
            state.floor = nextFloor;
            state.level = 0;
            state.mapNodes = graph.nodes;
            state.mapEdges = graph.edges;
            state.currentNodeId = null;
            state.completedNodes = [];
          }
        } else {
          // 일반 노드 완료 시 level 조정 (노드의 레벨을 기준으로 최종 클리어 높이 증가)
          if (node) {
            state.level = Math.max(state.level, node.level + 1);
          }
        }
      }
      saveToLocalStorage(state);
    },
    
    startCombat: (state, action) => {
      const { partyOperatorIds, enemyTemplates } = action.payload;
      
      // 전투 시작 전, 아군의 임시 SP 및 전투 상태 초기화
      const party = partyOperatorIds.map(id => {
        const op = state.recruitedOperators.find(o => o.id === id);
        if (op) {
          // 오리지늄 배터리 소장품 보유 시 시작 SP 부여
          const batteryRelic = state.relics.find(r => r.id === 'battery');
          const startingSp = batteryRelic ? batteryRelic.effect.value : 0;
          return {
            ...op,
            sp: startingSp,
            combatAffliction: null,
            combatShield: 0,
            tempDefenseMult: 1.0,
            tempDamageMult: 1.0,
            elementalHp: 1000,
            maxElementalHp: 1000,
            elementalResist: op.stats?.elemRes !== undefined ? op.stats.elemRes : (op.baseStats?.elemRes || 0),
            statusEffects: [],
            elementalBurst: null
          };
        }
        return null;
      });
      
      const enemies = enemyTemplates.map((template, idx) => {
        if (!template) return null;
        return {
          ...template,
          id: `enemy_${idx}`,
          hp: template.maxHp,
          maxHp: template.maxHp,
          sp: 0,
          elementalHp: 1000,
          maxElementalHp: 1000,
          elementalResist: template.elemRes !== undefined ? template.elemRes : 0,
          statusEffects: [],
          elementalBurst: null
        };
      });
      
      state.activeCombat = {
        wave: 1,
        party, // index 0: 4열, 1: 3열, 2: 2열, 3: 1열 (1열이 최전방)
        enemies, // index 0: 1열, 1: 2열, 2: 3열, 3: 4열 (1열이 최전방)
        turnQueue: [],
        currentTurnIndex: 0,
        logs: ['전투가 시작되었습니다!'],
        phase: 'setup'
      };
      saveToLocalStorage(state);
    },
    
    updateCombatState: (state, action) => {
      state.activeCombat = action.payload;
      // 전투 중 입은 피해를 실제 파티원 상태에도 업데이트
      if (state.activeCombat && state.activeCombat.party) {
        state.activeCombat.party.forEach(combatOp => {
          if (combatOp) {
            const op = state.recruitedOperators.find(o => o.id === combatOp.id);
            if (op) {
              op.hp = combatOp.hp;
              op.sanity = combatOp.sanity;
            }
          }
        });
      }
      saveToLocalStorage(state);
    },
    
    endCombat: (state, action) => {
      const { victory, hornReward, hopeReward, relicReward } = action.payload;
      if (victory) {
        // 소장품 보너스 각뿔
        const coinRelic = state.relics.find(r => r.id === 'gold_coin');
        const coinBonus = coinRelic ? coinRelic.effect.value : 0;
        
        state.horn += (hornReward || 0) + coinBonus;
        state.hope += (hopeReward || 0);
        if (relicReward) {
          state.relics.push(relicReward);
          if (relicReward.effect && relicReward.effect.hope) {
            state.hope += relicReward.effect.hope;
          }
        }
        
        // 전투가 성공하면 현재 노드 완료 처리
        if (state.currentNodeId && !state.completedNodes.includes(state.currentNodeId)) {
          state.completedNodes.push(state.currentNodeId);
          const node = state.mapNodes.find(n => n.id === state.currentNodeId);
          if (node && node.type === 'BOSS') {
            if (state.floor >= 5) {
              state.isActive = false;
            } else {
              const nextFloor = state.floor + 1;
              const graph = generateDAGGraph(nextFloor, 4, 4);
              state.floor = nextFloor;
              state.level = 0;
              state.mapNodes = graph.nodes;
              state.mapEdges = graph.edges;
              state.currentNodeId = null;
              state.completedNodes = [];
            }
          } else if (node) {
            state.level = Math.max(state.level, node.level + 1);
          }
        }
      } else {
        // 패배 시 목숨 차감 (전투 패배 시 3 차감)
        state.lifePoints = Math.max(0, state.lifePoints - 3);
        if (state.lifePoints <= 0) {
          state.isActive = false;
        }
      }
      state.activeCombat = null;
      saveToLocalStorage(state);
    },
    
    quitRun: (state) => {
      state.isActive = false;
      state.activeCombat = null;
      localStorage.removeItem('arknights_fan_run_state');
      // 초기화
      Object.assign(state, initialRunState);
    }
  }
});

export const {
  startNewRun,
  recruitOperator,
  promoteOperator,
  healOperator,
  healAllOperators,
  gainHorn,
  spendHorn,
  gainHope,
  spendHope,
  changeLifePoints,
  addRelic,
  selectNode,
  completeActiveNode,
  startCombat,
  updateCombatState,
  endCombat,
  quitRun
} = runSlice.actions;

export default runSlice.reducer;
