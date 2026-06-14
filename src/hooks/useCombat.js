// src/hooks/useCombat.js
import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCombatState, endCombat } from '@/stores/slices/runSlice';
import { earnHistoryRemake } from '@/stores/slices/metaSlice';

export const useCombat = () => {
  const dispatch = useDispatch();
  const combat = useSelector(state => state.run.activeCombat);
  const relics = useSelector(state => state.run.relics);
  const metaBuffs = useSelector(state => state.run.metaBuffs) || {};

  // 최신 상태를 항상 참조하기 위한 Ref 바인딩 (Stale Closure 방지 핵심)
  const combatRef = useRef(combat);
  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);

  const relicsRef = useRef(relics);
  useEffect(() => {
    relicsRef.current = relics;
  }, [relics]);

  // 상호 참조 순환 의존성 해결을 위한 함수 Refs
  const executeSkillRef = useRef();
  const proceedTurnRef = useRef();
  const executeEnemyAiRef = useRef();

  // 전투 로그 추가 헬퍼
  const addLog = useCallback((combatState, message) => {
    return {
      ...combatState,
      logs: [...combatState.logs, message].slice(-50)
    };
  }, []);

  // 턴 큐(Timeline) 생성 함수
  const generateTurnQueue = useCallback((combatState) => {
    const queue = [];
    
    // 아군 추가
    combatState.party.forEach((op, index) => {
      if (op && op.hp > 0) {
        const roll = Math.floor(Math.random() * 8) + 1;
        
        // 소장품 보너스 속도 적용 (스나이퍼)
        let sniperSpdBonus = 0;
        if (op.class === '스나이퍼' && relicsRef.current.some(r => r.id === 'sniper_glove')) {
          sniperSpdBonus = 3;
        }
        
        queue.push({
          id: op.id,
          isEnemy: false,
          name: op.name,
          speed: op.stats.spd + sniperSpdBonus + roll,
          partyIndex: index
        });
      }
    });

    // 적군 추가
    combatState.enemies.forEach((enemy, index) => {
      if (enemy && enemy.hp > 0) {
        const roll = Math.floor(Math.random() * 8) + 1;
        queue.push({
          id: enemy.id,
          isEnemy: true,
          name: enemy.name,
          speed: enemy.spd + roll,
          enemyIndex: index
        });
      }
    });

    queue.sort((a, b) => b.speed - a.speed);
    return queue;
  }, []);

  // 전투 초기화 / 라운드 시작
  const startNextRound = useCallback((currentCombat) => {
    let nextCombat = { ...currentCombat };
    nextCombat.wave = nextCombat.wave + 1;
    
    nextCombat.party = nextCombat.party.map(op => {
      if (!op || op.hp <= 0) return op;
      
      let nextOp = { ...op };
      // 턴 시작 시 SP +1 충전
      nextOp.sp = Math.min(nextOp.skills[0].spReq * 2, nextOp.sp + 1);
      return nextOp;
    });

    const queue = generateTurnQueue(nextCombat);
    nextCombat.turnQueue = queue;
    nextCombat.currentTurnIndex = 0;
    
    nextCombat = addLog(nextCombat, `--- 라운드 ${nextCombat.wave} 시작! ---`);
    
    if (queue.length > 0) {
      const activeUnit = queue[0];
      nextCombat.phase = activeUnit.isEnemy ? 'enemy_turn' : 'player_turn';
      nextCombat = addLog(nextCombat, `[${activeUnit.name}]의 차례입니다. (속도: ${activeUnit.speed})`);
    } else {
      nextCombat.phase = 'victory';
    }

    return nextCombat;
  }, [generateTurnQueue, addLog]);

  // 스킬 사거리 검사
  const validateSkillRange = useCallback((isEnemy, skill, casterPos, targetPos) => {
    const casterRank = isEnemy ? (casterPos + 1) : (4 - casterPos);
    const targetRank = isEnemy ? (4 - targetPos) : (targetPos + 1);

    const isCasterValid = skill.launchRanks.includes(casterRank);
    const isTargetValid = skill.targetRanks.includes(targetRank);

    return isCasterValid && isTargetValid;
  }, []);

  // 피격 시 정신력 차감 및 붕괴/각성 계산
  const applySanityDamage = useCallback((op, amount, logMessages) => {
    let nextOp = { ...op };
    
    const resist = metaBuffs.sanity_resist || 0;
    const finalAmount = Math.max(1, Math.round(amount * (1 - resist)));

    nextOp.sanity = Math.max(0, nextOp.sanity - finalAmount);
    logMessages.push(`${nextOp.name}의 정신력이 ${finalAmount} 감소했습니다. (현재: ${nextOp.sanity}/100)`);

    if (nextOp.sanity === 0 && !nextOp.combatAffliction) {
      const isVirtue = Math.random() < 0.25;
      if (isVirtue) {
        nextOp.combatAffliction = 'virtue';
        nextOp.sanity = 40;
        logMessages.push(`🎉 ${nextOp.name}이(가) 가혹한 전장에서 각성했습니다! 영웅적 기상 발동!`);
      } else {
        const afflictions = ['panic', 'selfish', 'abusive'];
        const chosen = afflictions[Math.floor(Math.random() * afflictions.length)];
        nextOp.combatAffliction = chosen;
        logMessages.push(`💀 ${nextOp.name}이(가) 정신적 붕괴에 빠졌습니다! (상태: ${chosen.toUpperCase()})`);
      }
    }

    return nextOp;
  }, [metaBuffs]);

  // 대원 및 적들의 생존 유무 확인 및 승패 판정
  const checkCombatOutcome = useCallback((combatState) => {
    const isAllPartyDead = combatState.party.every(op => !op || op.hp <= 0);
    const isAllEnemiesDead = combatState.enemies.every(en => !en || en.hp <= 0);

    if (isAllPartyDead) return 'defeat';
    if (isAllEnemiesDead) return 'victory';
    return null;
  }, []);

  // 1. 스킬 실행 함수 Ref 구현
  executeSkillRef.current = (skill, casterIndex, targetIndex, isCasterEnemy) => {
    const currentCombat = combatRef.current;
    if (!currentCombat) return;

    let nextCombat = JSON.parse(JSON.stringify(currentCombat));
    const logMessages = [];

    const caster = isCasterEnemy 
      ? nextCombat.enemies[casterIndex]
      : nextCombat.party[casterIndex];
      
    if (!caster || caster.hp <= 0) return;

    let targets = [];
    if (skill.isAoe) {
      targets = isCasterEnemy 
        ? nextCombat.party.map((op, idx) => op && op.hp > 0 ? { unit: op, idx } : null).filter(Boolean)
        : nextCombat.enemies.map((en, idx) => en && en.hp > 0 ? { unit: en, idx } : null).filter(Boolean);
    } else {
      const targetUnit = isCasterEnemy 
        ? nextCombat.party[targetIndex]
        : nextCombat.enemies[targetIndex];
      if (targetUnit && targetUnit.hp > 0) {
        targets.push({ unit: targetUnit, idx: targetIndex });
      }
    }

    if (targets.length === 0) {
      nextCombat = addLog(nextCombat, `[${caster.name}]이(가) ${skill.name}을(를) 시도했으나 대상이 없습니다.`);
      proceedTurnRef.current(nextCombat);
      return;
    }

    if (!isCasterEnemy) {
      const realOp = nextCombat.party[casterIndex];
      if (realOp.sp >= skill.spReq) {
        realOp.sp = 0;
        logMessages.push(`🔥 [${caster.name}] 시그니처 스킬 [${skill.name}] 발동!`);
      } else {
        logMessages.push(`[${caster.name}]이(가) [${skill.name}]을(를) 사용합니다.`);
      }
    } else {
      logMessages.push(`[${caster.name}]이(가) [${skill.name}]을(를) 시전합니다.`);
    }

    if (!isCasterEnemy && caster.combatAffliction === 'panic' && Math.random() < 0.3) {
      nextCombat = addLog(nextCombat, `💀 ${caster.name}은(는) 공포에 사로잡혀 공격 행동을 거부했습니다!`);
      proceedTurnRef.current(nextCombat);
      return;
    }

    targets.forEach(({ unit, idx }) => {
      if (skill.type === 'heal') {
        let healAmount = Math.round(caster.stats?.atk * skill.healMult || caster.atk * skill.healMult);
        if (!isCasterEnemy && caster.class === '메딕' && relicsRef.current.some(r => r.id === 'medic_cross')) {
          healAmount = Math.round(healAmount * 1.2);
        }

        unit.hp = Math.min(unit.maxHp, unit.hp + healAmount);
        logMessages.push(`💚 [${unit.name}]이(가) ${healAmount} 체력을 회복했습니다.`);

        if (!isCasterEnemy && caster.class === '메딕' && relicsRef.current.some(r => r.id === 'spaghetti')) {
          unit.sanity = Math.min(100, unit.sanity + 5);
          logMessages.push(`🍝 [미트소스 스파게티] 효과로 ${unit.name}의 정신력이 5 회복되었습니다.`);
        }

        if (!isCasterEnemy && skill.effect && skill.effect.sanity) {
          unit.sanity = Math.min(100, unit.sanity + skill.effect.sanity);
          logMessages.push(`${unit.name}의 정신력이 ${skill.effect.sanity} 회복되었습니다.`);
        }
      } else {
        const evasion = unit.stats?.eva || unit.eva || 0;
        const isMissed = Math.random() * 100 < evasion;

        if (isMissed) {
          logMessages.push(`💨 [${unit.name}]이(가) 공격을 회피했습니다!`);
          return;
        }

        const baseAtk = caster.stats?.atk || caster.atk || 100;
        const targetDef = unit.stats?.def || unit.def || 0;
        
        let finalDmg = 0;
        const hits = skill.hits || 1;

        for (let i = 0; i < hits; i++) {
          if (skill.isArts) {
            let artsDmg = baseAtk * skill.damageMult;
            if (!isCasterEnemy && caster.class === '캐스터' && relicsRef.current.some(r => r.id === 'civilight')) {
              artsDmg *= 1.25;
            }
            const artsVulnerability = unit.artsVulnerableTurns > 0 ? 1.3 : 1.0;
            artsDmg *= artsVulnerability;
            finalDmg += Math.round(artsDmg);
          } else {
            let effectiveDef = targetDef;
            if (!isCasterEnemy && caster.class === '가드' && relicsRef.current.some(r => r.id === 'guard_sharpener')) {
              effectiveDef = Math.round(targetDef * 0.8);
            }
            let dmg = (baseAtk * skill.damageMult) - effectiveDef;
            const minDmg = Math.round((baseAtk * skill.damageMult) * 0.1);
            finalDmg += Math.round(Math.max(minDmg, dmg));
          }
        }

        if (isCasterEnemy) {
          const globalDefBuff = metaBuffs.global_defense || 0;
          finalDmg = Math.round(finalDmg * (1 - globalDefBuff));
        } else {
          const globalDmgBuff = metaBuffs.global_damage || 0;
          finalDmg = Math.round(finalDmg * (1 + globalDmgBuff));
        }

        const isImmortal = !isCasterEnemy && unit.immortalTurns > 0;
        if (isImmortal) {
          unit.hp = Math.max(1, unit.hp - finalDmg);
          logMessages.push(`💥 [${unit.name}]이(가) ${finalDmg}의 피해를 입었습니다! (불사 상태로 버팀, HP: ${unit.hp})`);
        } else {
          unit.hp = Math.max(0, unit.hp - finalDmg);
          logMessages.push(`💥 [${unit.name}]이(가) ${finalDmg}의 피해를 입었습니다! (HP: ${unit.hp}/${unit.maxHp})`);
        }

        if (!isCasterEnemy) {
          let sanityDmg = 4;
          if (skill.effect && skill.effect.sanity_drain) {
            sanityDmg = skill.effect.sanity_drain;
          } else if (skill.effect && skill.effect.sanity_strike) {
            sanityDmg = skill.effect.sanity_strike;
          }
          const updatedOp = applySanityDamage(unit, sanityDmg, logMessages);
          nextCombat.party[idx] = updatedOp;
        }

        if (skill.effect) {
          if (skill.effect.type === 'stun') {
            let stunDuration = skill.effect.duration;
            if (!isCasterEnemy && relicsRef.current.some(r => r.id === 'shattering_crystal')) {
              stunDuration += 1;
            }
            unit.stunnedTurns = stunDuration;
            logMessages.push(`💫 [${unit.name}]이(가) ${stunDuration}턴간 기절 상태에 빠집니다!`);
          }
          if (skill.effect.type === 'stun_chance') {
            if (Math.random() * 100 < skill.effect.chance) {
              unit.stunnedTurns = skill.effect.duration;
              logMessages.push(`💫 [${unit.name}]이(가) 충격으로 기절 상태에 빠집니다!`);
            }
          }
          if (skill.effect.type === 'blind') {
            unit.blindTurns = skill.effect.duration;
            logMessages.push(`🌫️ [${unit.name}]의 명중률이 2턴간 격감합니다.`);
          }
        }
      }
    });

    if (!isCasterEnemy && skill.effect && skill.effect.type === 'immortality') {
      const op = nextCombat.party[casterIndex];
      op.immortalTurns = skill.effect.duration;
      logMessages.push(`💀 [${op.name}]의 영웅 불사 본능 가동! ${skill.effect.duration}턴간 쓰러지지 않습니다.`);
    }

    if (!isCasterEnemy && skill.effect && skill.effect.type === 'arts_vulnerability') {
      nextCombat.enemies.forEach(en => {
        if (en && en.hp > 0) {
          en.artsVulnerableTurns = skill.effect.duration;
        }
      });
      logMessages.push(`🧪 [사리아]의 칼슘 분출로 전장에 마법 약화 역장이 펼쳐집니다! (3턴간 적 마법 피해 +30%)`);
    }

    if (!isCasterEnemy && skill.effect && skill.effect.type === 'buff_def') {
      const op = nextCombat.party[targetIndex];
      if (op) {
        op.tempDefenseMult = 1.4;
        op.defBuffTurns = skill.effect.duration;
        logMessages.push(`🛡️ ${op.name}의 방어력이 ${skill.effect.duration}턴간 40% 증가합니다.`);
      }
    }

    logMessages.forEach(msg => {
      nextCombat = addLog(nextCombat, msg);
    });

    proceedTurnRef.current(nextCombat);
  };

  // 2. 턴 진행 처리 함수 Ref 구현
  proceedTurnRef.current = (currentCombat) => {
    let nextCombat = { ...currentCombat };
    
    // 사망한 유닛 제거 및 턴 큐 정제
    nextCombat.turnQueue = nextCombat.turnQueue.filter(unit => {
      if (unit.isEnemy) {
        const en = nextCombat.enemies[unit.enemyIndex];
        return en && en.hp > 0;
      } else {
        const op = nextCombat.party[unit.partyIndex];
        return op && op.hp > 0;
      }
    });

    const outcome = checkCombatOutcome(nextCombat);
    if (outcome === 'victory') {
      nextCombat.phase = 'victory';
      nextCombat = addLog(nextCombat, '🎉 전투에서 승리했습니다!');
      
      const goldEarned = Math.floor(Math.random() * 6) + 12;
      const hopeEarned = Math.floor(Math.random() * 2) + 2;
      
      const hasRelicReward = Math.random() < 0.5;
      let relicReward = null;
      if (hasRelicReward) {
        const { RELICS } = require('@/config/gameData');
        relicReward = RELICS[Math.floor(Math.random() * RELICS.length)];
      }

      dispatch(updateCombatState(nextCombat));
      
      setTimeout(() => {
        dispatch(earnHistoryRemake(2));
        dispatch(endCombat({
          victory: true,
          hornReward: goldEarned,
          hopeReward: hopeEarned,
          relicReward
        }));
      }, 2000);
      return;
    }

    if (outcome === 'defeat') {
      nextCombat.phase = 'defeat';
      nextCombat = addLog(nextCombat, '💀 파티가 전멸했습니다...');
      dispatch(updateCombatState(nextCombat));
      
      setTimeout(() => {
        dispatch(endCombat({ victory: false }));
      }, 2000);
      return;
    }

    let nextIdx = nextCombat.currentTurnIndex + 1;
    if (nextIdx >= nextCombat.turnQueue.length) {
      const roundResetCombat = startNextRound(nextCombat);
      dispatch(updateCombatState(roundResetCombat));
      return;
    }

    nextCombat.currentTurnIndex = nextIdx;
    const nextUnit = nextCombat.turnQueue[nextIdx];
    
    if (nextUnit.isEnemy) {
      const en = nextCombat.enemies[nextUnit.enemyIndex];
      
      if (en.artsVulnerableTurns > 0) en.artsVulnerableTurns--;

      if (en.stunnedTurns > 0) {
        en.stunnedTurns--;
        nextCombat = addLog(nextCombat, `💫 [${en.name}]은(는) 기절하여 턴을 스킵합니다.`);
        dispatch(updateCombatState(nextCombat));
        
        setTimeout(() => {
          proceedTurnRef.current(nextCombat);
        }, 1000);
        return;
      }
      
      nextCombat.phase = 'enemy_turn';
      nextCombat = addLog(nextCombat, `[${en.name}]의 차례입니다.`);
      dispatch(updateCombatState(nextCombat));
      
      // 적 AI 자동 공격 실행 (Ref를 거쳐 1.2초 후의 최신 상태에서 동작하도록 유도)
      setTimeout(() => {
        executeEnemyAiRef.current(nextUnit.enemyIndex);
      }, 1200);

    } else {
      const op = nextCombat.party[nextUnit.partyIndex];
      
      if (op.immortalTurns > 0) op.immortalTurns--;
      if (op.defBuffTurns > 0) {
        op.defBuffTurns--;
        if (op.defBuffTurns === 0) op.tempDefenseMult = 1.0;
      }

      if (op.stunnedTurns > 0) {
        op.stunnedTurns--;
        nextCombat = addLog(nextCombat, `💫 [${op.name}]은(는) 기절하여 턴을 스킵합니다.`);
        dispatch(updateCombatState(nextCombat));
        
        setTimeout(() => {
          proceedTurnRef.current(nextCombat);
        }, 1000);
        return;
      }

      nextCombat.phase = 'player_turn';
      nextCombat = addLog(nextCombat, `[${op.name}]의 차례입니다. 스킬을 선택하십시오.`);
      dispatch(updateCombatState(nextCombat));
    }
  };

  // 3. 적 AI 동작 함수 Ref 구현
  executeEnemyAiRef.current = (enemyIdx) => {
    const currentCombat = combatRef.current;
    if (!currentCombat) return;

    const enemy = currentCombat.enemies[enemyIdx];
    if (!enemy || enemy.hp <= 0) return;

    const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    
    const validTargetIndices = [];
    currentCombat.party.forEach((op, opIdx) => {
      if (op && op.hp > 0 && validateSkillRange(true, skill, enemyIdx, opIdx)) {
        validTargetIndices.push(opIdx);
      }
    });

    if (validTargetIndices.length === 0) {
      currentCombat.party.forEach((op, opIdx) => {
        if (op && op.hp > 0) validTargetIndices.push(opIdx);
      });
    }

    if (validTargetIndices.length > 0) {
      let chosenTargetIdx = validTargetIndices[Math.floor(Math.random() * validTargetIndices.length)];
      const frontIndices = validTargetIndices.filter(idx => idx === 3 || idx === 2);
      if (frontIndices.length > 0 && Math.random() < 0.7) {
        chosenTargetIdx = frontIndices[Math.floor(Math.random() * frontIndices.length)];
      }

      executeSkillRef.current(skill, enemyIdx, chosenTargetIdx, true);
    } else {
      proceedTurnRef.current(currentCombat);
    }
  };

  return {
    combat,
    executeSkill: useCallback((skill, casterIndex, targetIndex, isCasterEnemy) => {
      executeSkillRef.current(skill, casterIndex, targetIndex, isCasterEnemy);
    }, []),
    proceedTurn: useCallback((currentCombat) => {
      proceedTurnRef.current(currentCombat);
    }, []),
    validateSkillRange
  };
};
