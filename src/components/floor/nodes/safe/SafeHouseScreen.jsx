// src/components/floor/nodes/safe/SafeHouseScreen.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  healAllOperators, promoteOperator, recruitOperator, completeActiveNode 
} from '@/stores/slices/runSlice';
import { OPERATORS } from '@/config/gameData';

const SafeHouseScreen = () => {
  const dispatch = useDispatch();
  const run = useSelector(state => state.run);
  const [selectedAction, setSelectedAction] = useState(null); // 'heal', 'promote', 'recruit'
  const [promotionTarget, setPromotionTarget] = useState(null);
  const [recruitedTarget, setRecruitedTarget] = useState(null);
  const [message, setMessage] = useState(null);

  const { recruitedOperators } = run;

  // 진급 가능한 대원 리스트 (Elite 1인 대원들)
  const promoteCandidates = recruitedOperators.filter(op => op.level === 1);

  // 영입 가능한 대원 리스트
  const recruitedIds = recruitedOperators.map(o => o.id);
  const recruitCandidates = Object.values(OPERATORS).filter(o => !recruitedIds.includes(o.id));

  // 치료 처리
  const handleHeal = () => {
    dispatch(healAllOperators({ hpPct: 0.6, sanityAmount: 40 }));
    setMessage('안전 가옥에서 따뜻한 차와 전술 정비를 취했습니다. 모든 대원들의 체력이 60% 회복되고 정신력이 40 회복되었습니다.');
    setSelectedAction('done');
  };

  // 진급 처리
  const handlePromote = (opId) => {
    dispatch(promoteOperator({ opId, hopeCost: 0 }));
    const target = recruitedOperators.find(o => o.id === opId);
    setMessage(`축하합니다! [${target.name}]이(가) Elite 2로 진급하여 능력치가 대폭 증가하고 모든 전술 스킬이 활성화되었습니다!`);
    setSelectedAction('done');
  };

  // 모집 처리
  const handleRecruit = (template) => {
    const newOp = {
      ...template,
      hp: template.baseStats.hp,
      maxHp: template.baseStats.maxHp,
      sanity: 100,
      sp: 0,
      level: 1,
      stats: { ...template.baseStats }
    };
    dispatch(recruitOperator({ operator: newOp, hopeCost: 0, hornCost: 0 }));
    setMessage(`전략 배치 완료! [${template.name}]이(가) 아군 파티에 긴급 전투 대원으로 모집되었습니다.`);
    setSelectedAction('done');
  };

  const handleComplete = () => {
    dispatch(completeActiveNode());
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex items-center justify-center p-8 font-sans">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        
        {/* 사이버 테두리 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-800" />

        {/* 상단 타이틀 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 border border-blue-900 rounded">
            안전지대 (Safe House)
          </span>
          <h2 className="text-2xl font-black">안전한 곳</h2>
        </div>

        {/* 미선택 단계 */}
        {!selectedAction && (
          <div className="space-y-6">
            <p className="text-slate-400 text-sm">
              위험천만한 탐사 도중 아군 로도스 아일랜드 소대가 임시로 안전을 확보할 수 있는 대피소를 구축했습니다.
              이곳에서 단 한 가지 정비 활동을 진행할 수 있습니다.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              
              {/* 치료 */}
              <button 
                onClick={handleHeal}
                className="bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg p-6 text-center hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between items-center group cursor-pointer h-48"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💚</div>
                <div className="text-sm font-bold mb-1">소대 긴급 휴식</div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  모든 대원의 체력을 60% 치료하고 정신력을 40 회복합니다.
                </p>
              </button>

              {/* 진급 */}
              <button 
                disabled={promoteCandidates.length === 0}
                onClick={() => setSelectedAction('promote')}
                className={`border rounded-lg p-6 text-center transition-all duration-300 flex flex-col justify-between items-center group h-48 ${
                  promoteCandidates.length > 0 
                    ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-900 cursor-pointer text-white'
                    : 'bg-slate-950/20 border-slate-950 text-slate-600 cursor-not-allowed'
                }`}
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⭐</div>
                <div className="text-sm font-bold mb-1">오퍼레이터 진급</div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  대원 한 명을 무료로 2정예화 승급하여 능력치를 높이고 스킬을 해제합니다.
                </p>
              </button>

              {/* 임시 모집 */}
              <button 
                disabled={recruitCandidates.length === 0}
                onClick={() => setSelectedAction('recruit')}
                className={`border rounded-lg p-6 text-center transition-all duration-300 flex flex-col justify-between items-center group h-48 ${
                  recruitCandidates.length > 0 
                    ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-900 cursor-pointer text-white'
                    : 'bg-slate-950/20 border-slate-950 text-slate-600 cursor-not-allowed'
                }`}
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤝</div>
                <div className="text-sm font-bold mb-1">예비 인력 영입</div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  희망 비용을 소모하지 않고 무작위 아군 오퍼레이터를 즉시 영입합니다.
                </p>
              </button>

            </div>
          </div>
        )}

        {/* 진급 대상 선택 단계 */}
        {selectedAction === 'promote' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-blue-400">진급시킬 대원을 선택하십시오:</h3>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {promoteCandidates.map(op => (
                <button
                  key={op.id}
                  onClick={() => handlePromote(op.id)}
                  className="bg-slate-950 border border-slate-800 hover:border-blue-500 p-4 rounded-lg flex items-center justify-between text-left hover:bg-slate-900 transition cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-bold">{op.name}</div>
                    <div className="text-[10px] text-slate-400">{op.class}</div>
                  </div>
                  <span className="text-xs text-amber-500 font-bold">진급하기 →</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectedAction(null)}
              className="mt-4 text-xs text-slate-400 hover:text-white"
            >
              이전으로 돌아가기
            </button>
          </div>
        )}

        {/* 예비 모집 대상 선택 단계 */}
        {selectedAction === 'recruit' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-blue-400">합류시킬 오퍼레이터를 선택하십시오:</h3>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {recruitCandidates.map(op => (
                <button
                  key={op.id}
                  onClick={() => handleRecruit(op)}
                  className="bg-slate-950 border border-slate-800 hover:border-blue-500 p-4 rounded-lg flex items-center justify-between text-left hover:bg-slate-900 transition cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-bold">{op.name}</div>
                    <div className="text-[10px] text-slate-400">{op.class}</div>
                  </div>
                  <span className="text-xs text-emerald-500 font-bold">고용하기 →</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectedAction(null)}
              className="mt-4 text-xs text-slate-400 hover:text-white"
            >
              이전으로 돌아가기
            </button>
          </div>
        )}

        {/* 완료 단계 */}
        {selectedAction === 'done' && (
          <div className="space-y-8 flex flex-col justify-between h-full">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-blue-400 border-b border-slate-800 pb-2">정비 완료</h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-6 border border-slate-950 rounded-lg">
                {message}
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-lg transition duration-200 cursor-pointer text-center"
            >
              탐사 작전지로 복귀
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SafeHouseScreen;
