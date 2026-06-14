// src/pages/Scenario.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startCombat, quitRun } from '@/stores/slices/runSlice';
import LevelGraph from '@/components/floor/LevelGraph';
import SidebarPanel from '@/components/floor/SidebarPanel';
import ResourceHUD from '@/components/resources/ResourceHUD';
import CombatScreen from '@/components/combat/CombatScreen';
import EncounterScreen from '@/components/encounter/EncounterScreen';
import SafeHouseScreen from '@/components/floor/nodes/safe/SafeHouseScreen';
import TraderScreen from '@/components/floor/nodes/roll/TraderScreen';
import { ENEMIES } from '@/config/gameData';

const Scenario = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const run = useSelector(state => state.run);
  
  const [selectedNode, setSelectedNode] = useState(null);
  
  // 전투 대형 편성 로컬 상태
  // index 0: 4열(후방), 1: 3열, 2: 2열, 3: 1열(전방)
  const [deployment, setDeployment] = useState([null, null, null, null]);
  const [selectedOpToDeploy, setSelectedOpToDeploy] = useState(null);

  const { 
    isActive, floor, level, currentNodeId, mapNodes, 
    recruitedOperators, activeCombat, completedNodes, lifePoints, relics 
  } = run;

  // 1. 활성화된 런이 없을 때 (승리/패배 정산 화면 포함)
  if (!isActive) {
    const isVictory = floor >= 5 && completedNodes.some(id => {
      const n = mapNodes.find(x => x.id === id);
      return n && n.type === 'BOSS';
    });

    const isDefeat = lifePoints <= 0;

    const handleExit = () => {
      dispatch(quitRun());
      navigate('/');
    };

    return (
      <div className="w-full min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden text-center">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${isVictory ? 'bg-emerald-500' : 'bg-red-600'}`} />
          
          <div className="space-y-6">
            <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              Mission Debriefing
            </div>

            {isVictory ? (
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-emerald-400">작전 성공 (Mission Accomplished)</h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  로도스 아일랜드 작전 소대가 미지의 비정상 구역을 성공적으로 돌파하고 Floor 5 보스를 격퇴했습니다!
                </p>
              </div>
            ) : isDefeat ? (
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-red-500">작전 실패 (Mission Failed)</h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  통신 두절... 소대의 신호가 오염된 회랑 깊은 곳에서 끊어졌습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h1 className="text-xl font-bold text-slate-300">진행 중인 작전이 없습니다.</h1>
                <p className="text-xs text-slate-500">
                  메인 화면에서 새로운 작전 개시를 실행해주십시오.
                </p>
              </div>
            )}

            {/* 통계 정산 */}
            <div className="bg-slate-950 p-6 border border-slate-800 rounded-xl space-y-3 text-left text-xs text-slate-300 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-800 pb-1.5 font-bold">
                <span>진행 결과</span>
                <span className={isVictory ? 'text-emerald-400' : 'text-red-500'}>
                  {isVictory ? '전역 제패' : '중도 낙오'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>진행한 Floor</span>
                <span className="font-bold text-blue-400">{floor}층 (Level {level})</span>
              </div>
              <div className="flex justify-between">
                <span>클리어한 노드</span>
                <span className="font-bold">{completedNodes.length}개</span>
              </div>
              <div className="flex justify-between">
                <span>확보한 소장품</span>
                <span className="font-bold">{relics.length}개</span>
              </div>
              <div className="flex justify-between text-amber-500 font-bold border-t border-slate-800 pt-1.5">
                <span>인지 형성 재화 획득</span>
                <span>+ {isVictory ? 15 : Math.max(2, completedNodes.length * 2)} 코인</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExit}
            className="w-full py-3 mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-sm transition duration-200 cursor-pointer text-center"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 2. 현재 전투 중인 경우 -> 전투 화면 렌더링
  if (activeCombat) {
    return (
      <div className="w-full h-screen bg-slate-950">
        <CombatScreen />
      </div>
    );
  }

  // 3. 노드 선택 진입 상태 처리
  if (currentNodeId) {
    const currentNodeObj = mapNodes.find(n => n.id === currentNodeId);
    
    if (currentNodeObj && !completedNodes.includes(currentNodeId)) {
      
      // 전투 구역 진입 시 -> 대원 배치/편성 화면 표시
      if (currentNodeObj.type === 'COMBAT' || currentNodeObj.type === 'EMERGENCY' || currentNodeObj.type === 'BOSS') {
        
        // 자동 배치 함수
        const handleAutoDeploy = () => {
          const aliveOps = recruitedOperators.filter(o => o.hp > 0);
          const newDeployment = [null, null, null, null];
          
          // 탱커(디펜더)를 맨 앞(1열), 딜러(가드, 뱅가드)를 중방(2,3열), 메딕/스나이퍼/캐스터를 후방(4열)에 선호 배치
          const sortedOps = [...aliveOps].sort((a, b) => {
            const priority = { '디펜더': 5, '가드': 4, '뱅가드': 3, '스나이퍼': 2, '캐스터': 1, '메딕': 0 };
            return (priority[b.class] || 0) - (priority[a.class] || 0);
          });

          // 탱커부터 전방(1열 -> idx 3)에 우선 채우기
          let dIdx = 3;
          sortedOps.forEach(op => {
            if (dIdx >= 0) {
              newDeployment[dIdx] = op.id;
              dIdx--;
            }
          });

          setDeployment(newDeployment);
        };

        // 배치 슬롯 클릭
        const handleSlotClick = (slotIdx) => {
          if (!selectedOpToDeploy) {
            // 슬롯 비우기
            setDeployment(prev => {
              const next = [...prev];
              next[slotIdx] = null;
              return next;
            });
            return;
          }

          // 중복 배치 방지
          if (deployment.includes(selectedOpToDeploy)) {
            const existingIdx = deployment.indexOf(selectedOpToDeploy);
            setDeployment(prev => {
              const next = [...prev];
              next[existingIdx] = null;
              next[slotIdx] = selectedOpToDeploy;
              return next;
            });
          } else {
            setDeployment(prev => {
              const next = [...prev];
              next[slotIdx] = selectedOpToDeploy;
              return next;
            });
          }
          setSelectedOpToDeploy(null);
        };

        // 전투 시작 디스패치
        const handleStartBattle = () => {
          const partyOperatorIds = deployment;
          const assignedCount = partyOperatorIds.filter(Boolean).length;
          
          if (assignedCount === 0) {
            alert('최소 1명 이상의 대원을 전장에 배치해야 합니다!');
            return;
          }

          // 난이도별 적 생성
          const enemyTemplates = getEnemiesForNode(currentNodeObj, floor);

          dispatch(startCombat({
            partyOperatorIds,
            enemyTemplates
          }));
        };

        // 살아있는 대원 목록
        const aliveOps = recruitedOperators.filter(o => o.hp > 0);

        return (
          <div className="w-full min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
            <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-amber-600" />
              
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider">Tactical Deployment</span>
                  <h2 className="text-xl font-black mt-1">작전 부대 편성</h2>
                </div>
                <button 
                  onClick={handleAutoDeploy}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold rounded transition"
                >
                  자동 최적화 배치
                </button>
              </div>

              <div className="grid grid-cols-12 gap-6 items-stretch">
                
                {/* 좌측: 오퍼레이터 목록 (5칸) */}
                <div className="col-span-5 bg-slate-950 border border-slate-900 p-4 rounded-lg flex flex-col">
                  <h3 className="text-xs font-extrabold text-slate-500 mb-3 uppercase tracking-wider">대기 오퍼레이터</h3>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {aliveOps.map(op => {
                      const isDeployed = deployment.includes(op.id);
                      const isSelected = selectedOpToDeploy === op.id;
                      
                      return (
                        <button
                          key={op.id}
                          onClick={() => setSelectedOpToDeploy(isSelected ? null : op.id)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                              : isDeployed
                              ? 'bg-slate-900/50 border-slate-900 text-slate-500 opacity-60'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{op.name}</div>
                            <div className="text-[9px] opacity-75">{op.class} (Lv.{op.level})</div>
                          </div>
                          <span className="text-[9px] font-mono">
                            {isDeployed ? '배치됨' : '선택 대기'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 우측: 4개 전투 대형 슬롯 (7칸) */}
                <div className="col-span-7 bg-slate-950 border border-slate-900 p-4 rounded-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-500 mb-4 uppercase tracking-wider">전술 배치대형 (다키스트 던전 룰)</h3>
                    <div className="flex justify-around items-center h-48">
                      {deployment.map((opId, slotIdx) => {
                        const op = recruitedOperators.find(o => o.id === opId);
                        const isSlotSelected = selectedOpToDeploy && deployment.includes(selectedOpToDeploy) && deployment.indexOf(selectedOpToDeploy) === slotIdx;
                        
                        return (
                          <div 
                            key={slotIdx}
                            onClick={() => handleSlotClick(slotIdx)}
                            className={`w-24 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-between p-2 cursor-pointer transition duration-200 ${
                              op 
                                ? 'bg-slate-900 border-blue-500/50 hover:border-blue-400' 
                                : isSlotSelected 
                                ? 'bg-amber-500/10 border-amber-500'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[9px] font-mono text-slate-500">{4 - slotIdx}열 (후방~전방)</span>
                            {op ? (
                              <>
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${op.avatarColor} flex items-center justify-center text-white font-extrabold text-[10px]`}>
                                  {op.name.substring(0, 2)}
                                </div>
                                <div className="text-[10px] font-bold text-center truncate w-full">{op.name}</div>
                                <div className="text-[8px] text-gray-400">{op.class}</div>
                              </>
                            ) : (
                              <div className="text-[10px] text-slate-600 my-auto text-center">
                                {selectedOpToDeploy ? '여기에 배치' : '슬롯 비어있음'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 leading-normal max-w-sm">
                      * 4열(후방)은 스나이퍼/메딕/캐스터 배치 권장, 1열(최전방)은 디펜더/가드 배치를 권장합니다.
                    </span>
                    <button
                      onClick={handleStartBattle}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition duration-200 cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      전투 개시 (Commence Battle)
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      }

      // 우연한 만남 노드 진입 시
      if (currentNodeObj.type === 'ENCOUNTER') {
        return (
          <div className="w-full h-screen bg-slate-950">
            <EncounterScreen />
          </div>
        );
      }

      // 안전지대 진입 시
      if (currentNodeObj.type === 'SAFE') {
        return (
          <div className="w-full h-screen bg-slate-950">
            <SafeHouseScreen />
          </div>
        );
      }

      // 상점 진입 시
      if (currentNodeObj.type === 'ROLL') {
        return (
          <div className="w-full h-screen bg-slate-950">
            <TraderScreen />
          </div>
        );
      }
    }
  }

  // 4. 기본: 작전 지도 화면 (LevelGraph + HUD)
  const isNodeClickable = (nodeId) => {
    // 맵 뷰에서 해당 노드가 클릭(선택 진입) 가능한 노드인지 검사
    const node = mapNodes.find(n => n.id === nodeId);
    if (!node) return false;

    // level 0 노드 중 완료 안 된 것은 항상 가능
    if (node.level === 0 && !completedNodes.includes(nodeId)) {
      return completedNodes.length === 0; // 아직 하나도 클리어 안 한 경우 가능
    }

    // 이미 완료된 노드는 불가능
    if (completedNodes.includes(nodeId)) return false;

    // 이전 레벨의 노드가 최소 하나 완료되어 있으며, 그 완료된 노드와 연결되어 있는지 검사
    const prevLevelCompleted = completedNodes.filter(id => {
      const n = mapNodes.find(x => x.id === id);
      return n && n.floor === floor && n.level === node.level - 1;
    });

    if (prevLevelCompleted.length === 0) return false;

    // 엣지가 연결되어 있는지 확인
    const hasConnectingEdge = run.mapEdges.some(([from, to]) => {
      return prevLevelCompleted.includes(from) && to === nodeId;
    });

    return hasConnectingEdge;
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white relative">
      <div className="flex flex-col h-screen">
        
        {/* 상단 자원 대시보드 HUD */}
        <div className="px-6 py-4 z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl font-black tracking-tight">작전 작전회랑 시각화</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              분기형 통제 영역의 노드를 탐사하며 Floor 5의 패트리어트 격퇴를 목표로 전진하십시오.
            </p>
          </div>
          <ResourceHUD />
        </div>
        
        {/* 중앙 그래프 영역 */}
        <div className="flex-1 z-0">
          <LevelGraph 
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        </div>
      </div>

      {/* 사이드바 패널 (오버레이) */}
      <SidebarPanel 
        node={selectedNode} 
        isClickable={selectedNode && isNodeClickable(selectedNode.id)}
        onClose={() => setSelectedNode(null)} 
      />
    </div>
  );
};

// 난이도별 적 생성 헬퍼 함수
const getEnemiesForNode = (node, floor) => {
  if (node.type === 'BOSS') {
    if (floor >= 5) {
      return [ENEMIES.boss_patriot, ENEMIES.crusher, ENEMIES.caster, null];
    } else {
      return [ENEMIES.boss_crownslayer, ENEMIES.soldier, ENEMIES.caster, null];
    }
  }

  const list = [];
  const pool = [ENEMIES.soldier, ENEMIES.hound];
  if (floor >= 2) pool.push(ENEMIES.crusher);
  if (floor >= 3) pool.push(ENEMIES.caster);

  // 무작위 2~4마리 배치
  const count = Math.min(4, Math.floor(Math.random() * 3) + 2);
  for (let i = 0; i < count; i++) {
    const enemyTemplate = pool[Math.floor(Math.random() * pool.length)];
    list.push(enemyTemplate);
  }
  
  // 4개 슬롯 맞추기
  while (list.length < 4) {
    list.push(null);
  }
  
  return list;
};

export default Scenario;