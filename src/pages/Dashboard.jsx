// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startNewRun } from '@/stores/slices/runSlice';
import { purchaseUpgrade, selectMetaBuffs } from '@/stores/slices/metaSlice';
import { UPGRADES, OPERATORS } from '@/config/gameData';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const run = useSelector(state => state.run);
  const meta = useSelector(state => state.meta);
  const metaBuffs = useSelector(selectMetaBuffs);

  // 로컬 UI 상태
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1: 분대 선택, 2: 스타팅 대원 영입
  const [selectedSquad, setSelectedSquad] = useState('default');
  const [selectedOpIds, setSelectedOpIds] = useState([]);

  const { historyRemake, upgrades } = meta;
  const isRunActive = run.isActive;

  // 분대 종류 정의
  const squads = [
    { id: 'default', name: '기본 탐색대', desc: '아군 로도스 아일랜드 표준 탐사 소대입니다. (추가 보너스 없음)', icon: '🛡️' },
    { id: 'leader', name: '지휘 분대 (Leader)', desc: '지휘력 강화. 시작 희망 수치가 2 증가합니다.', icon: '👑' },
    { id: 'gather', name: '집화 분대 (Gathering)', desc: '자금 확보 우선. 시작 각뿔 수치가 20 증가합니다.', icon: '💰' },
    { id: 'support', name: '지원 분대 (Support)', desc: '생존성 중점. 시작 목숨(Life Points)이 2 증가합니다.', icon: '🩺' }
  ];

  // 각 오퍼레이터 영입 희망 비용 설정 (3성급은 없고 밸런스를 고려하여 1~3 희망 설정)
  const hopeCosts = {
    myrtle: 1,
    texas: 2,
    shining: 2,
    silverash: 3,
    specter: 3,
    saria: 3,
    exusiai: 3,
    eyjafjalla: 3
  };

  // 선택된 분대에 따른 시작 희망 총량 계산
  const baseHope = 6 + (metaBuffs.startingHope || 0) + (selectedSquad === 'leader' ? 2 : 0);
  const remainingHope = baseHope - selectedOpIds.reduce((sum, id) => sum + (hopeCosts[id] || 0), 0);

  // 영구 강화 해금 핸들러
  const handleUpgradeBuy = (id, cost) => {
    if (historyRemake >= cost) {
      dispatch(purchaseUpgrade(id));
    }
  };

  // 신규 게임 준비 모달 열기
  const handleStartSetup = () => {
    setSelectedSquad('default');
    setSelectedOpIds([]);
    setSetupStep(1);
    setShowSetupModal(true);
  };

  // 대원 선택 핸들러
  const toggleOpSelection = (id) => {
    const cost = hopeCosts[id] || 0;
    if (selectedOpIds.includes(id)) {
      setSelectedOpIds(prev => prev.filter(x => x !== id));
    } else {
      if (remainingHope >= cost) {
        if (selectedOpIds.length >= 4) {
          alert('스타팅 대원은 최대 4명까지 선택할 수 있습니다!');
          return;
        }
        setSelectedOpIds(prev => [...prev, id]);
      } else {
        alert('희망 수치가 부족하여 영입할 수 없습니다!');
      }
    }
  };

  // 게임 시작 실행
  const handleLaunchGame = () => {
    if (selectedOpIds.length === 0) {
      alert('최소 1명 이상의 스타팅 대원을 영입해야 합니다!');
      return;
    }

    // 선택된 템플릿 정보 인스턴스화
    const initialOperators = selectedOpIds.map(id => {
      const template = OPERATORS[id];
      return {
        ...template,
        hp: template.baseStats.hp,
        maxHp: template.baseStats.maxHp,
        sanity: 100,
        sp: 0,
        level: 1, // Elite 1 시작
        stats: { ...template.baseStats }
      };
    });

    // 신규 게임 시작 디스패치
    dispatch(startNewRun({
      squadType: selectedSquad,
      metaBuffs,
      initialOperators
    }));

    setShowSetupModal(false);
    navigate('/scenario');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 백그라운드 디자인 그라데이션 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />

      {/* 전체 그리드 컨테이너 */}
      <div className="w-full max-w-6xl grid grid-cols-12 gap-8 z-10">
        
        {/* 좌측 패널: 로비 메뉴 (7칸) */}
        <div className="col-span-7 bg-slate-900/40 border border-slate-900/80 rounded-2xl p-10 flex flex-col justify-between backdrop-blur-md shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-blue-500" />
          
          <div className="space-y-6">
            <div>
              <div className="text-[10px] text-red-500 font-extrabold tracking-[0.3em] uppercase">Rhodes Island Tactical Simulator</div>
              <h1 className="text-4xl font-black tracking-tight mt-1 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                명일방주 : 통합전략
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-2">
                다키스트 던전 스타일의 위치 전술 전투가 접목된 팬 메이드 로그라이크 작전 회랑.
              </p>
            </div>

            <div className="pt-8 space-y-4 max-w-xs">
              {isRunActive && (
                <button
                  onClick={() => navigate('/scenario')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-lg transition duration-300 shadow-lg shadow-blue-950/50 cursor-pointer text-center text-sm"
                >
                  작전 이어하기 (Floor {run.floor})
                </button>
              )}
              
              <button
                onClick={handleStartSetup}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black rounded-lg transition duration-300 shadow-lg shadow-amber-950/20 cursor-pointer text-center text-sm"
              >
                새로운 작전 개시
              </button>
            </div>
          </div>

          <div className="pt-10 text-[10px] text-slate-500 font-mono">
            V1.0.0 FAN-MADE GAME // ARKNIGHTS & DARKEST DUNGEON HYBRID
          </div>
        </div>

        {/* 우측 패널: 인지 형성 영구 강화 (5칸) */}
        <div className="col-span-5 bg-slate-900/40 border border-slate-900/80 rounded-2xl p-8 flex flex-col justify-between backdrop-blur-md shadow-2xl">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                🔮 인지 형성 (Cognition Shaping)
              </h2>
              <div className="bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-lg text-xs flex items-center gap-1.5 font-bold font-mono">
                <span className="text-amber-500">역사 재구성:</span>
                <span className="text-white text-sm">{historyRemake}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              탐사 작전 중 획득한 '역사의 재구성' 코인을 정제하여 로도스 아일랜드 소대원들에게 영구 전술 보너스를 부여합니다.
            </p>

            {/* 업그레이드 리스트 */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {UPGRADES.map(up => {
                const purchased = upgrades.includes(up.id);
                const canAfford = historyRemake >= up.cost;

                return (
                  <div 
                    key={up.id} 
                    className={`p-3 rounded-xl border bg-slate-950/80 flex items-center justify-between transition duration-200 ${
                      purchased ? 'border-indigo-950 opacity-70' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 pr-4">
                      <div className="text-xs font-black text-slate-200 flex items-center gap-2">
                        {up.name}
                        {purchased && (
                          <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1 rounded">해금됨</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">{up.description}</p>
                    </div>

                    {!purchased && (
                      <button
                        disabled={!canAfford}
                        onClick={() => handleUpgradeBuy(up.id, up.cost)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded transition shrink-0 ${
                          canAfford 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' 
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {up.cost} 코인
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 스타팅 설정 모달 */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 relative flex flex-col justify-between shadow-2xl max-h-[90vh]">
            
            {/* 상단 탭/타이틀 */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">
                  Operation Setup
                </span>
                <h3 className="text-lg font-black mt-1">
                  {setupStep === 1 ? '1단계: 전술 지휘 분대 결정' : '2단계: 작전 소대원 최초 영입'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 1단계: 분대 선택 */}
            {setupStep === 1 && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  {squads.map(sq => (
                    <button
                      key={sq.id}
                      onClick={() => setSelectedSquad(sq.id)}
                      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                        selectedSquad === sq.id
                          ? 'bg-slate-950 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl mt-1">{sq.icon}</span>
                      <div className="space-y-1">
                        <div className="text-xs font-black text-slate-200">{sq.name}</div>
                        <p className="text-[10px] text-slate-400 leading-normal">{sq.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-8">
                  <button
                    onClick={() => setSetupStep(2)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded transition cursor-pointer"
                  >
                    다음 단계로 →
                  </button>
                </div>
              </div>
            )}

            {/* 2단계: 스타팅 모집 */}
            {setupStep === 2 && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  {/* 자원 HUD 상황 */}
                  <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-800 rounded-lg text-xs font-bold font-mono">
                    <span className="text-slate-400">스타팅 전술 예산 (희망):</span>
                    <span className={`text-sm ${remainingHope === 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {remainingHope} / {baseHope}
                    </span>
                  </div>

                  {/* 모집 대상 캐릭터 카드들 */}
                  <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[300px] pr-1 py-1">
                    {Object.values(OPERATORS).map(op => {
                      const cost = hopeCosts[op.id] || 0;
                      const isSelected = selectedOpIds.includes(op.id);
                      const isAffordable = remainingHope >= cost;

                      return (
                        <button
                          key={op.id}
                          disabled={!isSelected && !isAffordable}
                          onClick={() => toggleOpSelection(op.id)}
                          className={`p-3 rounded-lg border text-center flex flex-col items-center justify-between gap-2 transition duration-200 ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-slate-950 scale-102 shadow-md shadow-amber-950/20 cursor-pointer'
                              : isAffordable
                              ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-white cursor-pointer'
                              : 'bg-slate-950/20 border-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${op.avatarColor} flex items-center justify-center text-white font-extrabold text-[11px]`}>
                            {op.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-[11px] font-black">{op.name}</div>
                            <div className={`text-[8px] ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>{op.class}</div>
                          </div>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-slate-900 text-amber-400' : 'bg-slate-900 text-slate-400'
                          }`}>
                            희망 {cost}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => setSetupStep(1)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← 분대 선택으로
                  </button>
                  <button
                    disabled={selectedOpIds.length === 0}
                    onClick={handleLaunchGame}
                    className={`px-6 py-2.5 text-xs font-black rounded transition ${
                      selectedOpIds.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    작전 회랑 진입!
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
