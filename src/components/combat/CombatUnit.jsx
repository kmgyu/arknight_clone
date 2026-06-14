// src/components/combat/CombatUnit.jsx
import React from 'react';

const CombatUnit = ({ unit, isEnemy, isActive, onSelect, isTargetable, isSelectedTarget }) => {
  if (!unit) {
    // 빈 슬롯 표시
    return (
      <div className="w-28 h-44 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-600 bg-gray-950/20">
        빈 열
      </div>
    );
  }

  const isDead = unit.hp <= 0;
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  const isAffin = unit.combatAffliction && unit.combatAffliction !== 'virtue';
  const isVirtue = unit.combatAffliction === 'virtue';

  // 아군 특화 수치 (SP, 정신력)
  const maxSp = !isEnemy ? (Math.max(...unit.skills.map(s => s.spReq)) || 1) : 1;
  const spPercent = !isEnemy ? (unit.sp / maxSp) * 100 : 0;
  const hasMaxSp = !isEnemy && unit.sp >= maxSp;

  // 상태 이상 배열
  const statusEffects = [];
  if (unit.stunnedTurns > 0) statusEffects.push({ text: '💫 기절', color: 'bg-yellow-600' });
  if (unit.blindTurns > 0) statusEffects.push({ text: '🌫️ 실명', color: 'bg-zinc-600' });
  if (unit.defBuffTurns > 0) statusEffects.push({ text: '🛡️ 방버프', color: 'bg-blue-600' });
  if (unit.immortalTurns > 0) statusEffects.push({ text: '💀 불사', color: 'bg-red-700 animate-pulse' });
  if (unit.artsVulnerableTurns > 0) statusEffects.push({ text: '🧪 마약화', color: 'bg-purple-600' });

  // CSS 클래스 구성
  const borderClass = isDead
    ? 'border-red-900 opacity-40 bg-gray-950'
    : isActive
    ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] ring-2 ring-yellow-400 bg-gray-800'
    : isSelectedTarget
    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] cursor-pointer ring-2 ring-red-500 bg-gray-850'
    : isTargetable
    ? 'border-red-900/50 hover:border-red-500 cursor-pointer hover:bg-gray-800/50 bg-gray-900/60'
    : 'border-gray-700 bg-gray-900/40';

  const avatarBg = unit.avatarColor || (isEnemy ? 'from-red-900 to-black' : 'from-gray-600 to-gray-800');

  return (
    <div 
      className={`relative w-28 h-52 flex flex-col items-center justify-between p-2 rounded-lg border transition-all duration-300 select-none ${borderClass}`}
      onClick={() => !isDead && (isTargetable || isEnemy) && onSelect?.()}
    >
      {/* 붕괴/각성 라벨 */}
      {isAffin && (
        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-extrabold bg-red-600 text-white px-1.5 py-0.5 rounded shadow border border-red-500 animate-bounce uppercase">
          {unit.combatAffliction}
        </span>
      )}
      {isVirtue && (
        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow border border-blue-400 animate-bounce uppercase">
          VIRTUE
        </span>
      )}

      {/* 캐릭터 아이콘 / 그라데이션 원 */}
      <div className="relative w-14 h-14 mt-1 rounded-full overflow-hidden border border-gray-600 shadow-inner">
        <div className={`w-full h-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-black text-sm`}>
          {unit.name.substring(0, 2)}
        </div>
        {isDead && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-600 font-extrabold text-[10px]">
            작전불가
          </div>
        )}
      </div>

      {/* 캐릭터 이름 및 클래스 */}
      <div className="text-center mt-1">
        <div className="text-xs font-bold truncate max-w-[95px]">{unit.name}</div>
        <div className="text-[9px] text-gray-400 font-medium">{unit.class || (isEnemy ? '적군' : '오퍼레이터')}</div>
      </div>

      {/* 상태 이상 아이콘 목록 */}
      <div className="flex flex-wrap gap-0.5 justify-center w-full min-h-[14px]">
        {statusEffects.map((eff, i) => (
          <span key={i} className={`text-[8px] text-white px-1 rounded ${eff.color}`}>
            {eff.text}
          </span>
        ))}
      </div>

      {/* 체력 게이지 */}
      <div className="w-full space-y-1 mt-1">
        {/* HP */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[8px] font-mono text-gray-300">
            <span>HP</span>
            <span>{Math.round(unit.hp)}/{unit.maxHp}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-950 rounded overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300" 
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* 정신력 (아군 전용) */}
        {!isEnemy && (
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] font-mono text-purple-300">
              <span>SAN</span>
              <span>{Math.round(unit.sanity)}/100</span>
            </div>
            <div className="w-full h-1 bg-gray-950 rounded overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300" 
                style={{ width: `${unit.sanity}%` }}
              />
            </div>
          </div>
        )}

        {/* SP (아군 전용) */}
        {!isEnemy && (
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] font-mono text-amber-300">
              <span>SP</span>
              <span>{Math.round(unit.sp)}/{maxSp}</span>
            </div>
            <div className="w-full h-1 bg-gray-950 rounded overflow-hidden relative">
              <div 
                className={`h-full ${hasMaxSp ? 'bg-amber-400 animate-pulse' : 'bg-amber-600'} transition-all duration-300`} 
                style={{ width: `${Math.min(100, spPercent)}%` }}
              />
              {hasMaxSp && (
                <div className="absolute inset-0 bg-yellow-400/30 animate-ping pointer-events-none" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombatUnit;
