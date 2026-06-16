// src/hooks/useCombat.js
import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCombatState, endCombat, gainHope } from '@/stores/slices/runSlice';
import { earnHistoryRemake } from '@/stores/slices/metaSlice';

// --- 원소 및 상태이상 보조 함수 정의 ---
const getVulnerabilityMult = (target, dmgType) => {
  let mult = 1.0;
  target.statusEffects?.forEach(eff => {
    if (eff.type === 'vulnerability') {
      mult += (eff.value || 0) / 100;
    }
    if (dmgType === 'physical' && eff.type === 'phys_vulnerability') {
      mult += (eff.value || 0) / 100;
    }
    if (dmgType === 'arts' && eff.type === 'arts_vulnerability') {
      mult += (eff.value || 0) / 100;
    }
    if (dmgType === 'elemental' && eff.type === 'elem_vulnerability') {
      mult += (eff.value || 0) / 100;
    }
  });
  
  if (dmgType === 'arts' && target.artsVulnerableTurns > 0) {
    mult += 0.3;
  }
  if (target.statusEffects?.some(e => e.type === 'freeze')) {
    mult += 0.1;
  }
  return mult;
};

const getDefShredMult = (target) => {
  let mult = 1.0;
  target.statusEffects?.forEach(eff => {
    if (eff.type === 'def_shred') {
      mult *= (1 - (eff.value || 0) / 100);
    }
  });
  return mult;
};

const getDefBuffMult = (target) => {
  let mult = 1.0;
  if (target.defBuffTurns > 0) {
    mult += 0.4;
  }
  target.statusEffects?.forEach(eff => {
    if (eff.type === 'def_buff_temp') {
      mult += (eff.value || 0) / 100;
    }
  });
  return mult;
};

const getAtkMult = (unit) => {
  let mult = 1.0;
  unit.statusEffects?.forEach(eff => {
    if (eff.type === 'languish') {
      mult -= 0.2;
    }
  });
  return mult;
};

const isImmuneTo = (unit, statusType) => {
  if (unit.isBoss) {
    return ['stun', 'freeze', 'bind', 'decel', 'chill'].includes(statusType);
  }
  return false;
};

const applyElementalDamage = (nextCombat, caster, target, targetIndex, isTargetEnemy, skill, logMessages, addLog) => {
  const elemDmgBase = skill.elementalDmg || 0;
  const elemResist = target.elementalResist || 0;
  
  const effectiveElemResist = target.elementalBurst ? (elemResist * 0.5) : elemResist;
  let finalElemDmg = elemDmgBase * (1 - effectiveElemResist / 100);
  
  const vulnerabilityMult = getVulnerabilityMult(target, 'elemental');
  finalElemDmg = Math.round(finalElemDmg * vulnerabilityMult);
  finalElemDmg = Math.max(50, finalElemDmg);
  
  if (target.elementalBurst) {
    target.hp = Math.max(0, target.hp - finalElemDmg);
    logMessages.push(`🌀 [원소 폭발 중] [${target.name}]이(가) ${finalElemDmg}의 원소 피해를 입었습니다! (HP: ${target.hp}/${target.maxHp})`);
  } else {
    target.hp = Math.max(0, target.hp - finalElemDmg);
    target.elementalHp = Math.max(0, (target.elementalHp !== undefined ? target.elementalHp : 1000) - finalElemDmg);
    logMessages.push(`🌀 [${target.name}]이(가) ${finalElemDmg}의 원소 피해를 입었습니다! (HP: ${target.hp}, 원소HP: ${target.elementalHp})`);
    
    if (target.elementalHp <= 0) {
      const artsType = skill.artsType || 'unknown';
      target.elementalBurst = { duration: 2, type: artsType };
      logMessages.push(`🚨 [원소 폭발 발동] [${target.name}]의 원소 체력이 고갈되어 2턴간 원소 폭발 상태에 진입합니다! (속성: ${artsType})`);
      
      if (artsType === 'burn') {
        target.hp = Math.max(0, target.hp - 2500);
        logMessages.push(`🔥 [소각] [${target.name}]에게 즉시 2500의 마법 피해를 입칩니다!`);
        if (!target.statusEffects) target.statusEffects = [];
        if (!isImmuneTo(target, 'arts_vulnerability')) {
          target.statusEffects.push({ type: 'arts_vulnerability', duration: 3, value: 30 });
        }
        target.statusEffects.push({ type: 'burn_dot', duration: 3, value: 100 });
      } 
      else if (artsType === 'water' || artsType === 'flood') {
        const defShred = getDefShredMult(target);
        const targetDef = (target.stats?.def || target.def || 0) * defShred;
        const physDmg = Math.max(50, 1000 - targetDef);
        target.hp = Math.max(0, target.hp - physDmg);
        logMessages.push(`💧 [침수] [${target.name}]에게 즉시 ${physDmg}의 물리 피해를 입칩니다!`);
        if (!target.statusEffects) target.statusEffects = [];
        target.statusEffects.push({ type: 'def_shred', duration: 5, value: 10 });
      } 
      else if (artsType === 'cold' || artsType === 'chill' || artsType === 'frost') {
        const hasCold = target.statusEffects?.some(e => e.type === 'chill' || e.type === 'freeze');
        if (hasCold) {
          logMessages.push(`🥶 [동상 발동] [${target.name}]이(가) 이미 냉기/빙결 상태이므로 동상이 발동하여 3턴간 빙결됩니다!`);
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects = target.statusEffects.filter(e => e.type !== 'chill' && e.type !== 'freeze');
          if (!isImmuneTo(target, 'freeze')) {
            target.statusEffects.push({ type: 'freeze', duration: 3 });
            target.statusEffects.push({ type: 'def_buff_temp', duration: 3, value: 50 });
          }
        } else {
          logMessages.push(`❄️ [냉기 부여] [${target.name}]에게 2턴간 냉기를 부여합니다.`);
          if (!target.statusEffects) target.statusEffects = [];
          if (!isImmuneTo(target, 'chill')) {
            target.statusEffects.push({ type: 'chill', duration: 2 });
          }
        }
      } 
      else if (artsType === 'electric' || artsType === 'shock') {
        target.hp = Math.max(0, target.hp - 3000);
        logMessages.push(`⚡ [감전] [${target.name}]에게 즉시 3000의 마법 피해와 마비 1중첩을 부여합니다!`);
        if (!target.statusEffects) target.statusEffects = [];
        let existingParalysis = target.statusEffects.find(e => e.type === 'paralysis');
        if (existingParalysis) {
          existingParalysis.count += 1;
        } else {
          target.statusEffects.push({ type: 'paralysis', count: 1 });
        }
        
        const unitArray = isTargetEnemy ? nextCombat.enemies : nextCombat.party;
        const leftUnit = unitArray[targetIndex - 1];
        const rightUnit = unitArray[targetIndex + 1];
        if (leftUnit && leftUnit.hp > 0) {
          leftUnit.hp = Math.max(0, leftUnit.hp - 1500);
          logMessages.push(`⚡ [전이] 좌측의 [${leftUnit.name}]에게 1500 마법 피해 전이!`);
        }
        if (rightUnit && rightUnit.hp > 0) {
          rightUnit.hp = Math.max(0, rightUnit.hp - 1500);
          logMessages.push(`⚡ [전이] 우측의 [${rightUnit.name}]에게 1500 마법 피해 전이!`);
        }
      } 
      else if (artsType === 'psychic_nervous') {
        target.hp = Math.max(0, target.hp - 3000);
        logMessages.push(`🧠 [신경 손상] [${target.name}]에게 3000의 즉시 원소 피해와 마비 3중첩을 부여합니다!`);
        if (!target.statusEffects) target.statusEffects = [];
        let existingParalysis = target.statusEffects.find(e => e.type === 'paralysis');
        if (existingParalysis) {
          existingParalysis.count += 3;
        } else {
          target.statusEffects.push({ type: 'paralysis', count: 3 });
        }
      } 
      else if (artsType === 'psychic_languish') {
        target.hp = Math.max(0, target.hp - 1500);
        logMessages.push(`🥀 [쇠약 손상] [${target.name}]에게 1500의 즉시 원소 피해와 쇠약 상태(5턴)를 부여합니다!`);
        if (!target.statusEffects) target.statusEffects = [];
        target.statusEffects.push({ type: 'languish', duration: 5 });
      }
    }
  }
};

const processUnitTurnStart = (currentCombat, nextUnit, addLog) => {
  let nextCombat = { ...currentCombat };
  nextCombat.party = [...nextCombat.party];
  nextCombat.enemies = [...nextCombat.enemies];
  
  const logMessages = [];
  const isEnemy = nextUnit.isEnemy;
  const unitIndex = isEnemy ? nextUnit.enemyIndex : nextUnit.partyIndex;
  
  const unit = isEnemy 
    ? { ...nextCombat.enemies[unitIndex] }
    : { ...nextCombat.party[unitIndex] };
    
  if (isEnemy) {
    nextCombat.enemies[unitIndex] = unit;
  } else {
    nextCombat.party[unitIndex] = unit;
  }
  
  if (!unit || unit.hp <= 0) {
    return { nextCombat, shouldSkip: true };
  }
  
  // 1. 턴 시작 시점 도트 피해 및 자원 연산
  if (unit.statusEffects) {
    // 1-1. 출혈 (bleed)
    const bleedEff = unit.statusEffects.find(e => e.type === 'bleed');
    if (bleedEff) {
      const targetDef = unit.stats?.def || unit.def || 0;
      const finalBleedDmg = Math.max(5, Math.round(bleedEff.damage || 50) - targetDef);
      unit.hp = Math.max(0, unit.hp - finalBleedDmg);
      logMessages.push(`🩸 [출혈] [${unit.name}]이(가) 출혈로 인해 ${finalBleedDmg}의 물리 피해를 입었습니다! (HP: ${unit.hp}/${unit.maxHp})`);
    }
    
    // 1-2. 소각 (burn_dot)
    const burnDotEff = unit.statusEffects.find(e => e.type === 'burn_dot');
    if (burnDotEff) {
      const elemResist = unit.elementalResist || 0;
      const effectiveElemResist = unit.elementalBurst ? (elemResist * 0.5) : elemResist;
      const finalElemDmg = Math.max(50, Math.round(100 * (1 - effectiveElemResist / 100)));
      
      unit.hp = Math.max(0, unit.hp - finalElemDmg);
      if (!unit.elementalBurst) {
        unit.elementalHp = Math.max(0, (unit.elementalHp !== undefined ? unit.elementalHp : 1000) - finalElemDmg);
      }
      logMessages.push(`🔥 [소각] [${unit.name}]이(가) 소각 도트 피해로 인해 ${finalElemDmg}의 원소 피해를 입었습니다!`);
      
      if (!unit.elementalBurst && unit.elementalHp <= 0) {
        unit.elementalBurst = { duration: 2, type: 'burn' };
        logMessages.push(`🚨 [원소 폭발] [${unit.name}]의 원소 체력이 고갈되어 원소 폭발 상태에 진입합니다!`);
        if (!isImmuneTo(unit, 'arts_vulnerability')) {
          unit.statusEffects.push({ type: 'arts_vulnerability', duration: 3, value: 30 });
        }
        unit.statusEffects.push({ type: 'burn_dot', duration: 3, value: 100 });
      }
    }
    
    // 1-3. 쇠약 손상 (languish)
    const languishEff = unit.statusEffects.find(e => e.type === 'languish');
    if (languishEff) {
      if (!isEnemy && unit.sp > 0) {
        unit.sp = Math.max(0, unit.sp - 1);
        logMessages.push(`🥀 [쇠약] [${unit.name}]의 SP가 쇠약 효과로 인해 1 감소했습니다.`);
      }
      const elemResist = unit.elementalResist || 0;
      const effectiveElemResist = unit.elementalBurst ? (elemResist * 0.5) : elemResist;
      const finalElemDmg = Math.max(50, Math.round(100 * (1 - effectiveElemResist / 100)));
      
      unit.hp = Math.max(0, unit.hp - finalElemDmg);
      if (!unit.elementalBurst) {
        unit.elementalHp = Math.max(0, (unit.elementalHp !== undefined ? unit.elementalHp : 1000) - finalElemDmg);
      }
      logMessages.push(`🥀 [쇠약] [${unit.name}]이(가) 쇠약 도트 피해로 인해 ${finalElemDmg}의 원소 피해를 입었습니다!`);
      
      if (!unit.elementalBurst && unit.elementalHp <= 0) {
        unit.elementalBurst = { duration: 2, type: 'psychic_languish' };
        logMessages.push(`🚨 [원소 폭발] [${unit.name}]의 원소 체력이 고갈되어 원소 폭발 상태에 진입합니다!`);
      }
    }
  }
  
  if (unit.hp <= 0) {
    logMessages.push(`💀 [${unit.name}]이(가) 지속 피해로 인해 작전 불가 상태가 되었습니다.`);
    logMessages.forEach(msg => { nextCombat = addLog(nextCombat, msg); });
    return { nextCombat, shouldSkip: true };
  }
  
  // 2. 행동 제한 및 스킵 처리
  
  // 2-1. 공포 (fear)
  const fearEff = unit.statusEffects?.find(e => e.type === 'fear');
  if (fearEff) {
    const isBound = unit.statusEffects?.some(e => e.type === 'bind');
    if (!isBound) {
      if (isEnemy) {
        let temp = nextCombat.enemies[3];
        nextCombat.enemies[3] = unit;
        nextCombat.enemies[unitIndex] = temp;
      } else {
        let temp = nextCombat.party[0];
        nextCombat.party[0] = unit;
        nextCombat.party[unitIndex] = temp;
      }
      logMessages.push(`😱 [공포] [${unit.name}]이(가) 공포에 사로잡혀 가장 뒤쪽 열로 밀려나고 행동을 스킵합니다!`);
    } else {
      logMessages.push(`😱 [공포] [${unit.name}]이(가) 공포에 사로잡혔으나 속박되어 뒤쪽 열로 이동하지 못했습니다!`);
    }
    
    // 스킵 시 다른 상태이상도 차감
    nextCombat = decrementUnitDurations(nextCombat, nextUnit, addLog);
    logMessages.forEach(msg => { nextCombat = addLog(nextCombat, msg); });
    return { nextCombat, shouldSkip: true };
  }
  
  // 2-2. 기절 (stun) 또는 빙결 (freeze)
  const hasStun = unit.statusEffects?.some(e => e.type === 'stun') || unit.stunnedTurns > 0;
  const hasFreeze = unit.statusEffects?.some(e => e.type === 'freeze');
  if (hasStun || hasFreeze) {
    const condName = hasFreeze ? '빙결' : '기절';
    logMessages.push(`💫 [${unit.name}]은(는) ${condName} 상태이므로 이번 턴 행동이 스킵됩니다.`);
    
    // 스킵 시 다른 상태이상도 차감
    nextCombat = decrementUnitDurations(nextCombat, nextUnit, addLog);
    logMessages.forEach(msg => { nextCombat = addLog(nextCombat, msg); });
    return { nextCombat, shouldSkip: true };
  }
  
  // 2-3. 마비 (paralysis) - 행동 시도 시 차감
  const paralysisEff = unit.statusEffects?.find(e => e.type === 'paralysis');
  if (paralysisEff && paralysisEff.count > 0) {
    paralysisEff.count--;
    logMessages.push(`⚡ [마비] [${unit.name}]이(가) 마비 상태이므로 행동을 스킵합니다! (남은 마비 중첩: ${paralysisEff.count})`);
    if (paralysisEff.count <= 0) {
      unit.statusEffects = unit.statusEffects.filter(e => e.type !== 'paralysis');
    }
    
    // 스킵 시 다른 상태이상도 차감
    nextCombat = decrementUnitDurations(nextCombat, nextUnit, addLog);
    logMessages.forEach(msg => { nextCombat = addLog(nextCombat, msg); });
    return { nextCombat, shouldSkip: true };
  }
  
  logMessages.forEach(msg => { nextCombat = addLog(nextCombat, msg); });
  return { nextCombat, shouldSkip: false };
};

const decrementUnitDurations = (combatState, activeUnit, addLog) => {
  let nextCombat = { ...combatState };
  nextCombat.party = [...nextCombat.party];
  nextCombat.enemies = [...nextCombat.enemies];
  
  const isEnemy = activeUnit.isEnemy;
  const unitIndex = isEnemy ? activeUnit.enemyIndex : activeUnit.partyIndex;
  
  const unit = isEnemy 
    ? { ...nextCombat.enemies[unitIndex] }
    : { ...nextCombat.party[unitIndex] };
    
  if (isEnemy) {
    nextCombat.enemies[unitIndex] = unit;
  } else {
    nextCombat.party[unitIndex] = unit;
  }
  
  if (unit && unit.hp > 0) {
    if (unit.immortalTurns > 0) unit.immortalTurns--;
    if (unit.defBuffTurns > 0) {
      unit.defBuffTurns--;
      if (unit.defBuffTurns === 0) unit.tempDefenseMult = 1.0;
    }
    if (unit.stunnedTurns > 0) unit.stunnedTurns--;
    if (unit.blindTurns > 0) unit.blindTurns--;
    if (unit.artsVulnerableTurns > 0) unit.artsVulnerableTurns--;
    
    if (unit.statusEffects) {
      let addVulnerability = false;
      unit.statusEffects = unit.statusEffects.map(eff => {
        if (eff.type === 'paralysis') return eff;
        
        let nextEff = { ...eff };
        if (nextEff.duration !== undefined) {
          nextEff.duration--;
        }
        return nextEff;
      }).filter(eff => {
        if (eff.type === 'paralysis') return true;
        if (eff.duration <= 0) {
          if (eff.type === 'def_buff_temp' && eff.value === 50) {
            addVulnerability = true;
          }
          return false;
        }
        return true;
      });
      
      if (addVulnerability) {
        unit.statusEffects.push({ type: 'vulnerability', duration: 1, value: 10 });
      }
    }
    
    if (unit.elementalBurst) {
      unit.elementalBurst.duration--;
      if (unit.elementalBurst.duration <= 0) {
        unit.elementalBurst = null;
        unit.elementalHp = 1000;
        nextCombat = addLog(nextCombat, `✨ [${unit.name}]의 원소 폭발 상태가 해제되고 원소 체력이 회복되었습니다.`);
      }
    }
  }
  return nextCombat;
};

export const useCombat = () => {
  const dispatch = useDispatch();
  const combat = useSelector(state => state.run.activeCombat);
  const relics = useSelector(state => state.run.relics);
  const metaBuffs = useSelector(state => state.run.metaBuffs) || {};

  const combatRef = useRef(combat);
  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);

  const relicsRef = useRef(relics);
  useEffect(() => {
    relicsRef.current = relics;
  }, [relics]);

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

  // 턴 큐(Timeline) 생성 함수 - 생존 중인 유닛만 생성
  const generateTurnQueue = useCallback((combatState) => {
    const queue = [];
    
    // 아군 추가
    combatState.party.forEach((op, index) => {
      if (op && op.hp > 0) {
        const roll = Math.floor(Math.random() * 8) + 1;
        
        let sniperSpdBonus = 0;
        if (op.class === '스나이퍼' && relicsRef.current.some(r => r.id === 'sniper_glove')) {
          sniperSpdBonus = 3;
        }

        // 행동 속도 감소 디버프 계산 (정지: 0.2, 냉기: 0.7, 감속: 1 - value/100)
        let speedMultiplier = 1.0;
        op.statusEffects?.forEach(eff => {
          if (eff.type === 'decel') speedMultiplier *= 0.2;
          else if (eff.type === 'slow') speedMultiplier *= (1 - (eff.value || 0) / 100);
          else if (eff.type === 'chill') speedMultiplier *= 0.7;
        });

        const baseSpd = op.stats?.spd !== undefined ? op.stats.spd : 5;
        const finalSpd = Math.max(1, Math.round((baseSpd + sniperSpdBonus) * speedMultiplier));
        
        queue.push({
          id: op.id,
          isEnemy: false,
          name: op.name,
          speed: finalSpd + roll,
          partyIndex: index
        });
      }
    });

    // 적군 추가
    combatState.enemies.forEach((enemy, index) => {
      if (enemy && enemy.hp > 0) {
        const roll = Math.floor(Math.random() * 8) + 1;

        // 행동 속도 감소 디버프 계산
        let speedMultiplier = 1.0;
        enemy.statusEffects?.forEach(eff => {
          if (eff.type === 'decel') speedMultiplier *= 0.2;
          else if (eff.type === 'slow') speedMultiplier *= (1 - (eff.value || 0) / 100);
          else if (eff.type === 'chill') speedMultiplier *= 0.7;
        });

        const baseSpd = enemy.spd !== undefined ? enemy.spd : 5;
        const finalSpd = Math.max(1, Math.round(baseSpd * speedMultiplier));

        queue.push({
          id: enemy.id,
          isEnemy: true,
          name: enemy.name,
          speed: finalSpd + roll,
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
    if (nextCombat.phase === 'setup') {
      nextCombat.wave = 1;
    } else {
      nextCombat.wave = nextCombat.wave + 1;
    }
    
    nextCombat.party = nextCombat.party.map(op => {
      if (!op || op.hp <= 0) return op;
      
      let nextOp = { ...op };
      // 턴 시작 시 SP +1 충전 (스킬 spReq 중 최대 요구량의 2배가 상한선, 최대 요구량 없으면 기본 10)
      const maxSpReq = Math.max(...nextOp.skills.map(s => s.spReq || 0)) || 10;
      nextOp.sp = Math.min(maxSpReq * 2, nextOp.sp + 1);
      return nextOp;
    });

    const queue = generateTurnQueue(nextCombat);
    nextCombat.turnQueue = queue;
    nextCombat.currentTurnIndex = 0;
    
    nextCombat = addLog(nextCombat, `--- 라운드 ${nextCombat.wave} 시작! ---`);
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

  // 1. 스킬 실행 함수
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
      const requiresSp = skill.spReq > 0;
      if (requiresSp && realOp.sp >= skill.spReq) {
        realOp.sp = 0;
        logMessages.push(`🔥 [${caster.name}] 시그니처 스킬 [${skill.name}] 발동!`);
      } else {
        logMessages.push(`[${caster.name}]이(가) [${skill.name}]을(를) 사용합니다.`);
      }
      
      // 희망 획득 효과 처리
      if (skill.effect && skill.effect.type === 'gain_hope') {
        dispatch(gainHope(skill.effect.value));
        logMessages.push(`⭐ [희망 획득] 희망을 ${skill.effect.value} 얻었습니다.`);
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
        let healAmount = Math.round((caster.stats?.atk * getAtkMult(caster) || caster.atk * getAtkMult(caster)) * skill.healMult);
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

        // 힐 결과 상태 저장
        if (!isCasterEnemy) {
          nextCombat.party[idx] = unit;
        } else {
          nextCombat.enemies[idx] = unit;
        }
      } else {
        const evasion = unit.stats?.eva || unit.eva || 0;
        const isMissed = Math.random() * 100 < evasion;

        if (isMissed) {
          logMessages.push(`💨 [${unit.name}]이(가) 공격을 회피했습니다!`);
          return;
        }

        const baseAtk = (caster.stats?.atk || caster.atk || 100) * getAtkMult(caster);
        const defShredMult = getDefShredMult(unit);
        const defBuffMult = getDefBuffMult(unit);
        const targetDef = (unit.stats?.def || unit.def || 0) * defShredMult * defBuffMult;
        
        let finalDmg = 0;
        const hits = skill.hits || 1;

        for (let i = 0; i < hits; i++) {
          if (skill.isArts) {
            let artsDmg = baseAtk * skill.damageMult;
            if (!isCasterEnemy && caster.class === '캐스터' && relicsRef.current.some(r => r.id === 'civilight')) {
              artsDmg *= 1.25;
            }
            const artsVulnerability = getVulnerabilityMult(unit, 'arts');
            artsDmg *= artsVulnerability;
            finalDmg += Math.round(artsDmg);
          } else {
            let effectiveDef = targetDef;
            if (!isCasterEnemy && caster.class === '가드' && relicsRef.current.some(r => r.id === 'guard_sharpener')) {
              effectiveDef = Math.round(targetDef * 0.8);
            }
            let dmg = (baseAtk * skill.damageMult) - effectiveDef;
            const minDmg = Math.round((baseAtk * skill.damageMult) * 0.1);
            let finalHitDmg = Math.max(minDmg, dmg);
            
            const physVulnerability = getVulnerabilityMult(unit, 'physical');
            finalHitDmg *= physVulnerability;
            
            finalDmg += Math.round(finalHitDmg);
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

        if (isCasterEnemy) {
          let sanityDmg = 4;
          if (skill.effect && skill.effect.sanity_drain) {
            sanityDmg = skill.effect.sanity_drain;
          } else if (skill.effect && skill.effect.sanity_strike) {
            sanityDmg = skill.effect.sanity_strike;
          }
          const updatedOp = applySanityDamage(unit, sanityDmg, logMessages);
          nextCombat.party[idx] = updatedOp;
        } else {
          nextCombat.enemies[idx] = unit;
        }

        // 원소 피해 연산
        if (skill.elementalDmg > 0 && unit.hp > 0) {
          applyElementalDamage(nextCombat, caster, unit, idx, !isCasterEnemy, skill, logMessages, addLog);
        }

        if (skill.effect) {
          if (skill.effect.type === 'stun') {
            let stunDuration = skill.effect.duration;
            if (!isCasterEnemy && relicsRef.current.some(r => r.id === 'shattering_crystal')) {
              stunDuration += 1;
            }
            if (!isImmuneTo(unit, 'stun')) {
              unit.stunnedTurns = stunDuration;
              logMessages.push(`💫 [${unit.name}]이(가) ${stunDuration}턴간 기절 상태에 빠집니다!`);
            } else {
              logMessages.push(`💫 [${unit.name}]은(는) 기절 면역 상태입니다.`);
            }
          }
          if (skill.effect.type === 'stun_chance') {
            if (Math.random() * 100 < skill.effect.chance) {
              if (!isImmuneTo(unit, 'stun')) {
                unit.stunnedTurns = skill.effect.duration;
                logMessages.push(`💫 [${unit.name}]이(가) 충격으로 기절 상태에 빠집니다!`);
              } else {
                logMessages.push(`💫 [${unit.name}]은(는) 기절 면역 상태입니다.`);
              }
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

  // 1.5 유닛 활성화 헬퍼
  const activateUnitTurn = useCallback((combatState, activeUnit) => {
    let nextCombat = { ...combatState };
    
    // 상태이상 턴 시작 정산 및 스킵 여부 확인
    const { nextCombat: processedCombat, shouldSkip } = processUnitTurnStart(nextCombat, activeUnit, addLog);
    nextCombat = processedCombat;
    
    if (shouldSkip) {
      dispatch(updateCombatState(nextCombat));
      setTimeout(() => {
        proceedTurnRef.current(nextCombat);
      }, 1000);
      return;
    }
    
    const isEnemy = activeUnit.isEnemy;
    const unitIndex = isEnemy ? activeUnit.enemyIndex : activeUnit.partyIndex;
    const unit = isEnemy ? nextCombat.enemies[unitIndex] : nextCombat.party[unitIndex];
    
    if (isEnemy) {
      nextCombat.phase = 'enemy_turn';
      nextCombat = addLog(nextCombat, `[${unit.name}]의 차례입니다.`);
    } else {
      nextCombat.phase = 'player_turn';
      nextCombat = addLog(nextCombat, `[${unit.name}]의 차례입니다. 스킬을 선택하십시오.`);
    }
    
    dispatch(updateCombatState(nextCombat));
  }, [addLog, dispatch]);

  // 2. 턴 진행 처리 함수
  proceedTurnRef.current = (currentCombat) => {
    let nextCombat = { ...currentCombat };
    
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

    // 직전에 행동을 끝마친 유닛의 디버프 지속시간 차감
    if (nextCombat.turnQueue && nextCombat.turnQueue[nextCombat.currentTurnIndex]) {
      const prevUnitInfo = nextCombat.turnQueue[nextCombat.currentTurnIndex];
      nextCombat = decrementUnitDurations(nextCombat, prevUnitInfo, addLog);
    }

    // 다음 차례 이동
    let nextIdx = nextCombat.currentTurnIndex + 1;
    if (nextIdx >= nextCombat.turnQueue.length) {
      const roundResetCombat = startNextRound(nextCombat);
      const firstUnit = roundResetCombat.turnQueue[0];
      if (firstUnit) {
        activateUnitTurn(roundResetCombat, firstUnit);
      } else {
        dispatch(updateCombatState(roundResetCombat));
      }
      return;
    }

    // 턴 인덱스 적용 및 유닛 추출
    nextCombat.currentTurnIndex = nextIdx;
    const nextUnit = nextCombat.turnQueue[nextIdx];
    
    // 대상 생존 여부 체크 (사망 유닛 턴 스킵 처리)
    const isUnitAlive = nextUnit.isEnemy 
      ? (nextCombat.enemies[nextUnit.enemyIndex]?.hp > 0)
      : (nextCombat.party[nextUnit.partyIndex]?.hp > 0);

    if (!isUnitAlive) {
      // 사망한 경우 즉시 다음 인덱스로 턴 넘김 (재귀)
      proceedTurnRef.current(nextCombat);
      return;
    }

    activateUnitTurn(nextCombat, nextUnit);
  };

  // 3. 적 AI 동작 함수
  executeEnemyAiRef.current = (enemyIdx) => {
    const currentCombat = combatRef.current;
    if (!currentCombat) return;

    const enemy = currentCombat.enemies[enemyIdx];
    if (!enemy || enemy.hp <= 0) return;

    // 전율 상태이상 검증 (공격 타입 스킬 사용 불가)
    const hasTremble = enemy.statusEffects?.some(e => e.type === 'tremble');
    let availableSkills = enemy.skills;
    if (hasTremble) {
      availableSkills = enemy.skills.filter(s => s.type !== 'attack');
    }

    if (availableSkills.length === 0) {
      proceedTurnRef.current(currentCombat);
      return;
    }

    const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    
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
    executeEnemyAi: useCallback((enemyIdx) => {
      executeEnemyAiRef.current(enemyIdx);
    }, []),
    validateSkillRange
  };
};
