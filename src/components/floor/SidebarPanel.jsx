// src/components/floor/SidebarPanel.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { selectNode } from '@/stores/slices/runSlice';

function SidebarPanel({ node, onClose, isClickable }) {
  const dispatch = useDispatch();
  if (!node) return null;

  const handleEnterNode = () => {
    dispatch(selectNode(node.id));
    onClose();
  };

  // 노드 타입별 한국어 정보 매핑
  const typeDetails = {
    COMBAT: { name: '전투 작전 (Combat)', desc: '적 보병 및 기동 유닛과의 일반 전투 조우 구역입니다. 클리어 시 각뿔과 희망을 얻습니다.', color: 'bg-slate-700 border-slate-650' },
    EMERGENCY: { name: '긴급 작전 (Emergency)', desc: '정예 적 부대가 도사리고 있는 위험 구역입니다. 매우 강력한 적이 나타나지만, 클리어 시 확정적으로 소장품(Relics) 유물을 획득할 기회가 주어집니다.', color: 'bg-red-950/80 border-red-900 text-red-300' },
    ENCOUNTER: { name: '우연한 만남 (Encounter)', desc: '미지의 방랑자, 은신처 또는 다양한 텍스트 분기 조우를 마주합니다. 선택지에 따라 소장품을 얻거나 자원이 변동됩니다.', color: 'bg-emerald-950/80 border-emerald-900 text-emerald-300' },
    SAFE: { name: '안전한 곳 (Safe House)', desc: '적의 위협이 미치지 않는 안전 가옥입니다. 대원 전원을 치료하거나 무료로 2정예화 진급을 시키거나, 임시 예비 대원을 영입할 수 있습니다.', color: 'bg-blue-950/80 border-blue-900 text-blue-300' },
    ROLL: { name: '유랑 거래소 (Trader)', desc: '각뿔(자금)을 사용하여 소장품 유물을 구매하거나, 새로운 임시 대원 영입 라이선스, 치유 시약을 구매할 수 있습니다.', color: 'bg-amber-950/80 border-amber-900 text-amber-300' },
    BOSS: { name: '보스 작전 (Boss Stage)', desc: '해당 Floor의 대장 유닛이 지휘하는 결전 구역입니다. 격퇴 시 다음 Floor로 진행합니다. 패배 시 목숨이 크게 차감됩니다.', color: 'bg-purple-950/80 border-purple-900 text-purple-300' }
  };

  const currentDetails = typeDetails[node.type] || { name: node.type, desc: '작전 지점입니다.', color: 'bg-slate-800' };

  return (
    <div className={`fixed top-0 right-0 w-80 h-screen bg-slate-900 border-l border-slate-800 text-white p-6 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
      node ? 'translate-x-0' : 'translate-x-full'
    }`}>
      
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Node Inspector</span>
          <h2 className="text-lg font-black tracking-tight">{node.label}</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* 상세 스펙 */}
      <div className="space-y-6 flex flex-col justify-between h-[calc(100%-100px)]">
        <div className="space-y-6">
          
          {/* 작전 유형 */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">구역 정보</h3>
            <div className={`p-3 rounded-lg border text-xs leading-normal font-semibold ${currentDetails.color}`}>
              <div className="font-extrabold mb-1.5">{currentDetails.name}</div>
              <p className="opacity-90 leading-relaxed font-normal text-[11px]">{currentDetails.desc}</p>
            </div>
          </div>
          
          {/* 레벨 */}
          <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">탐사 레벨</span>
            <span className="text-sm font-bold font-mono text-blue-400">Level {node.level}</span>
          </div>

          {/* 고정 식별 노드 코드 */}
          <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">구역 식별 코드</span>
            <code className="text-xs font-mono text-emerald-400">{node.id}</code>
          </div>
          
        </div>

        {/* 하단 진입 버튼 */}
        <div className="pt-6 border-t border-slate-800">
          {isClickable ? (
            <button
              onClick={handleEnterNode}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-sm font-black rounded-lg transition duration-200 cursor-pointer text-center"
            >
              작전 구역 진입
            </button>
          ) : (
            <div className="w-full py-3 bg-slate-950 border border-slate-900 text-slate-600 text-xs font-bold rounded-lg text-center cursor-not-allowed">
              현재 접근 불가능한 지역
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default SidebarPanel;