// src/components/combat/CombatScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useCombat } from '@/hooks/useCombat';
import CombatUnit from './CombatUnit';
import { OPERATORS } from '@/config/gameData';

const CombatScreen = () => {
  const dispatch = useDispatch();
  const { combat, executeSkill, proceedTurn, executeEnemyAi, validateSkillRange } = useCombat();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const logEndRef = useRef(null);

  // 1. 전투 시작 시 (setup 페이즈) 첫 번째 턴 라운드를 자동 기동
  useEffect(() => {
    if (combat && combat.phase === 'setup') {
      proceedTurn(combat);
    }
  }, [combat, proceedTurn]);

  // 2. 적의 차례가 되면 1.2초 후 AI가 자동 공격을 실행하도록 연동 (Stale Closure 예방)
  const activeUnitInfo = combat?.turnQueue?.[combat?.currentTurnIndex];
  useEffect(() => {
    if (combat && combat.phase === 'enemy_turn' && activeUnitInfo && activeUnitInfo.isEnemy) {
      const timer = setTimeout(() => {
        executeEnemyAi(activeUnitInfo.enemyIndex);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [combat?.phase, combat?.currentTurnIndex, activeUnitInfo, executeEnemyAi]);

  // 자동 로그 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combat?.logs]);

  if (!combat) return null;

  const { party, enemies, turnQueue, currentTurnIndex, logs, phase } = combat;
  const isPlayerTurn = phase === 'player_turn';

  // 현재 턴을 가진 아군 오퍼레이터
  const activeOperator = !isPlayerTurn || !activeUnitInfo ? null : party[activeUnitInfo.partyIndex];
  const activeOperatorIndex = !isPlayerTurn || !activeUnitInfo ? -1 : activeUnitInfo.partyIndex;

  // 오래된 세이브 데이터 대응용 스킬 맵핑 헬퍼 (스킬 개수가 3개 미만이면 gameData 템플릿의 스킬 적용)
  const activeOperatorSkills = activeOperator 
    ? (activeOperator.skills?.length >= 3 
        ? activeOperator.skills 
        : (OPERATORS[activeOperator.id]?.skills || activeOperator.skills))
    : [];

  // 스킬 클릭 핸들러
  const handleSkillClick = (skill) => {
    if (!isPlayerTurn || !activeOperator) return;

    // SP 조건 검증
    const requiresSp = skill.spReq > 0;
    if (requiresSp && activeOperator.sp < skill.spReq) {
      alert('SP가 부족합니다!');
      return;
    }

    if (selectedSkill?.name === skill.name) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skill);
    }
  };

  // 대원 또는 적 타겟 클릭 핸들러
  const handleTargetSelect = (targetIdx, isTargetEnemy) => {
    if (!isPlayerTurn || !selectedSkill || activeOperatorIndex === -1) return;

    // 사거리 체크
    const isValid = validateSkillRange(
      false,
      selectedSkill,
      activeOperatorIndex,
      targetIdx
    );

    if (!isValid) return;

    // 타겟 유형 검증
    if (selectedSkill.type === 'heal' && isTargetEnemy) return;
    if (selectedSkill.type === 'attack' && !isTargetEnemy) return;

    // 공격 실행!
    executeSkill(selectedSkill, activeOperatorIndex, targetIdx, false);
    setSelectedSkill(null);
  };

  // 턴 넘기기
  const handleSkipTurn = () => {
    if (!isPlayerTurn) return;
    setSelectedSkill(null);
    proceedTurn(combat);
  };

  // 사거리 조건에 맞는지 확인하여 하이라이트 여부 결정
  const checkTargetable = (targetIdx, isTargetEnemy) => {
    if (!selectedSkill || activeOperatorIndex === -1) return false;
    
    if (selectedSkill.type === 'attack' && !isTargetEnemy) return false;
    if (selectedSkill.type === 'heal' && isTargetEnemy) return false;

    return validateSkillRange(
      false,
      selectedSkill,
      activeOperatorIndex,
      targetIdx
    );
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col p-4 relative font-sans">
      
      {/* 1. 상단 타임라인 / 턴 순서 */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center justify-between mb-4 backdrop-blur-sm">
        <div className="text-xs text-amber-500 font-bold uppercase tracking-wider pl-2">
          Turn Order
        </div>
        <div className="flex-1 flex gap-2 justify-start items-center overflow-x-auto px-4">
          {turnQueue.map((unit, idx) => {
            const isCurrent = idx === currentTurnIndex;
            return (
              <div
                key={idx}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0 ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : unit.isEnemy
                    ? 'bg-red-950/40 text-red-400 border border-red-900/60'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${unit.isEnemy ? 'bg-red-500' : 'bg-blue-400'}`} />
                {unit.name}
                <span className="text-[10px] opacity-75 font-mono">({unit.speed})</span>
              </div>
            );
          })}
        </div>
        <div className="text-xs font-mono pr-2 text-slate-400">
          ROUND {combat.wave}
        </div>
      </div>

      {/* 2. 중앙 전투 전장 */}
      <div className="flex-1 grid grid-cols-9 items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/60 via-slate-950 to-slate-950 border border-slate-900 rounded-lg py-6 px-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,24,38,0.1)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        {/* 아군 영역 (4열 ~ 1열) */}
        <div className="col-span-4 flex flex-row justify-around items-center h-full">
          {party.map((op, idx) => {
            const isCurrent = isPlayerTurn && activeOperatorIndex === idx;
            const isTargetable = checkTargetable(idx, false);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-500">{4 - idx}열</span>
                <CombatUnit
                  unit={op}
                  isEnemy={false}
                  isActive={isCurrent}
                  isTargetable={isTargetable}
                  onSelect={() => handleTargetSelect(idx, false)}
                />
              </div>
            );
          })}
        </div>

        {/* 대치선 */}
        <div className="col-span-1 flex flex-col justify-center items-center">
          <div className="h-40 w-0.5 bg-gradient-to-b from-transparent via-slate-800 to-transparent relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-2 py-1 border border-slate-800 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
              VS
            </div>
          </div>
        </div>

        {/* 적군 영역 (1열 ~ 4열) */}
        <div className="col-span-4 flex flex-row justify-around items-center h-full">
          {enemies.map((en, idx) => {
            const isCurrent = !isPlayerTurn && activeUnitInfo?.isEnemy && activeUnitInfo?.enemyIndex === idx;
            const isTargetable = checkTargetable(idx, true);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-500">{idx + 1}열</span>
                <CombatUnit
                  unit={en}
                  isEnemy={true}
                  isActive={isCurrent}
                  isTargetable={isTargetable}
                  onSelect={() => handleTargetSelect(idx, true)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 하단 컨트롤 패널 & 로그 */}
      <div className="mt-4 grid grid-cols-12 gap-4 h-48">
        
        {/* 스킬 및 아군 명령 콘트롤러 */}
        <div className="col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between backdrop-blur-sm">
          {isPlayerTurn && activeOperator ? (
            <div className="flex flex-col h-full justify-between">
              {/* 상단: 액티브 유닛 프로필 */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-blue-400">{activeOperator.name}</div>
                  <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900 px-1.5 py-0.2 rounded font-semibold">
                    {activeOperator.class}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedSkill ? (
                    <span className="text-amber-400 animate-pulse">타겟을 선택하십시오...</span>
                  ) : (
                    <span>스킬을 선택하십시오</span>
                  )}
                </div>
              </div>

              {/* 중단: 스킬 리스트 (3스킬 대응) */}
              <div className="grid grid-cols-3 gap-2 my-2">
                {activeOperatorSkills.map((skill, sIdx) => {
                  const requiresSp = skill.spReq > 0;
                  const isCharged = activeOperator.sp >= skill.spReq;
                  const canUse = !requiresSp || isCharged;
                  const isSelected = selectedSkill?.name === skill.name;

                  const launchRanksStr = skill.launchRanks.join(',');
                  const targetRanksStr = skill.targetRanks.join(',');

                  return (
                    <button
                      key={sIdx}
                      disabled={!canUse}
                      onClick={() => handleSkillClick(skill)}
                      className={`group relative text-left p-2 rounded border transition-all duration-200 flex flex-col justify-between h-[76px] ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                          : !canUse
                          ? 'bg-slate-950/50 border-slate-900 text-slate-650 cursor-not-allowed opacity-50'
                          : isCharged
                          ? 'bg-slate-950 border-amber-600 hover:border-amber-400 text-white hover:bg-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[11px] font-black truncate pr-1">{skill.name}</span>
                        {requiresSp && (
                          <span className={`text-[8.5px] px-1 rounded font-mono ${
                            isSelected ? 'bg-slate-900 text-amber-400' : 'bg-amber-600 text-slate-950 font-bold'
                          }`}>
                            SP {activeOperator.sp}/{skill.spReq}
                          </span>
                        )}
                      </div>
                      <div className={`text-[9.5px] leading-normal mt-0.5 line-clamp-2 ${isSelected ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {skill.description}
                      </div>
                      <div className="flex justify-between items-center w-full text-[8px] mt-0.5 font-mono opacity-80">
                        <span>시전: {launchRanksStr}열</span>
                        <span>타격: {targetRanksStr}열</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 하단: 보조 제어 */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSkipTurn}
                  className="px-4 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-bold transition duration-200"
                >
                  대기 / 턴 넘기기
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <svg className="w-8 h-8 mb-2 animate-spin text-slate-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              전술 계산 중... (상대방의 턴이 진행 중입니다.)
            </div>
          )}
        </div>

        {/* 우측 전투 기록 로그 */}
        <div className="col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col backdrop-blur-sm">
          <div className="text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-1 font-bold uppercase tracking-wider">
            Combat Log
          </div>
          <div className="h-[124px] overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {logs.map((log, lIdx) => {
              const isStart = log.includes('라운드');
              const isWin = log.includes('승리');
              const isDead = log.includes('사망') || log.includes('전멸');
              const isSkill = log.includes('필살기') || log.includes('시전') || log.includes('발동');

              let color = 'text-slate-300';
              if (isStart) color = 'text-yellow-400 font-bold border-b border-slate-800/50 pb-0.5 mt-1.5';
              else if (isWin) color = 'text-emerald-400 font-extrabold';
              else if (isDead) color = 'text-red-500 font-bold';
              else if (isSkill) color = 'text-amber-300';

              return (
                <div key={lIdx} className={color}>
                  {log}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CombatScreen;
