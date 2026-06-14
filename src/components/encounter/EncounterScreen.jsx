// src/components/encounter/EncounterScreen.jsx
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  gainHorn, spendHorn, gainHope, spendHope, changeLifePoints, 
  addRelic, recruitOperator, healAllOperators, completeActiveNode 
} from '@/stores/slices/runSlice';
import { RELICS, OPERATORS } from '@/config/gameData';

const ENCOUNTERS = [
  {
    id: 'canned_food',
    title: '상한 전투 식량통',
    description: '대원들이 길가에서 버려진 군용 식량 보관함을 발견했습니다. 통조림 몇 개가 찌그러져 있지만 아직 밀봉되어 있습니다. 유통기한은 한참 지난 것처럼 보입니다...',
    choices: [
      {
        text: '식량을 대원들과 나눠 먹는다 (위험한 도박)',
        action: (dispatch, state, addLog) => {
          const isSuccess = Math.random() < 0.4;
          if (isSuccess) {
            dispatch(healAllOperators({ hpPct: 0.5, sanityAmount: 10 }));
            addLog('식량은 의외로 멀쩡했습니다! 모든 대원의 체력이 50% 회복되고 정신력이 10 회복되었습니다.');
          } else {
            dispatch(healAllOperators({ hpPct: 0, sanityAmount: -20 }));
            addLog('배탈이 났습니다! 모든 대원의 정신력이 20 깎였습니다.');
          }
        }
      },
      {
        text: '식량통을 고철로 분해해 판다',
        action: (dispatch) => {
          dispatch(gainHorn(5));
          return '식량통을 깡통으로 분해해 암시장에 팔아 각뿔 5개를 획득했습니다.';
        }
      }
    ]
  },
  {
    id: 'sarkaz_merc',
    title: '살카즈 방랑 용병',
    description: '방독면을 쓴 살카즈 용병 한 명이 무기를 닦으며 조용히 앉아 있습니다. 그는 당신 일행을 쳐다보더니 무심하게 말합니다. "희망을 보여주거나, 아니면 꺼져라. 돈만 주면 칼질은 제대로 해줄 수 있지."',
    choices: [
      {
        text: '희망을 보여주고 대원으로 고용한다 (희망 3 소모)',
        requirement: (state) => state.run.hope >= 3,
        action: (dispatch, state, addLog) => {
          dispatch(spendHope(3));
          
          // 모집 안 된 임의의 오퍼레이터 선별
          const recruitedIds = state.run.recruitedOperators.map(o => o.id);
          const availablePool = Object.values(OPERATORS).filter(o => !recruitedIds.includes(o.id));
          
          if (availablePool.length > 0) {
            const template = availablePool[Math.floor(Math.random() * availablePool.length)];
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
            addLog(`살카즈 용병의 안내를 받아 [${newOp.name}]이(가) 임시 대원으로 파티에 합류했습니다!`);
          } else {
            addLog('용병이 고개를 저었습니다. "이미 쟁쟁한 오퍼레이터가 많군. 필요 없다." 대신 각뿔 10개를 쥐어줍니다.');
            dispatch(gainHorn(10));
          }
        }
      },
      {
        text: '각뿔 8개로 임시 고용을 시도한다',
        requirement: (state) => state.run.horn >= 8,
        action: (dispatch, state, addLog) => {
          dispatch(spendHorn(8));
          // 50% 확률 성공
          if (Math.random() < 0.6) {
            const recruitedIds = state.run.recruitedOperators.map(o => o.id);
            const availablePool = Object.values(OPERATORS).filter(o => !recruitedIds.includes(o.id));
            if (availablePool.length > 0) {
              const template = availablePool[Math.floor(Math.random() * availablePool.length)];
              const newOp = {
                ...template,
                hp: template.baseStats.hp,
                maxHp: template.baseStats.maxHp,
                sanity: 80,
                sp: 0,
                level: 1,
                stats: { ...template.baseStats }
              };
              dispatch(recruitOperator({ operator: newOp, hopeCost: 0, hornCost: 0 }));
              addLog(`협상 성공! 각뿔을 챙긴 [${newOp.name}]이(가) 전투 대열에 합류했습니다.`);
            } else {
              dispatch(gainHope(2));
              addLog('마땅히 고용할 용병이 없어, 그가 대신 유용한 전술 정보(희망 2)를 전해주었습니다.');
            }
          } else {
            addLog('용병은 각뿔을 집어던졌습니다. "나를 거지로 아는군!" 돈만 뺏기고 쫓겨났습니다.');
          }
        }
      },
      {
        text: '그냥 지나친다',
        action: () => '엮이지 않는 것이 최선입니다. 조용히 용병의 곁을 지나쳐 갈 길을 갑니다.'
      }
    ]
  },
  {
    id: 'fate_prank',
    title: '운명의 기로',
    description: '어두운 동굴 벽면에 기이하게 빛나는 오리지늄 결정들이 회오리처럼 얽혀 있습니다. 그 중심에 무언가 신비로운 홀로그램 유물 상자가 떠 있습니다. 손을 뻗으면 엄청난 에너지가 흘러나오지만, 결정의 방사능 오염 위험이 도사리고 있습니다.',
    choices: [
      {
        text: '피해를 감수하고 유물을 손에 넣는다 (목숨 2 차감)',
        requirement: (state) => state.run.lifePoints > 2,
        action: (dispatch, state, addLog) => {
          dispatch(changeLifePoints(-2));
          const relic = RELICS[Math.floor(Math.random() * RELICS.length)];
          dispatch(addRelic(relic));
          addLog(`방사선을 뒤집어쓰고 홀로그램 상자를 부쉈습니다! 목숨이 2 줄었지만, 소장품 [${relic.name}]을(를) 획득했습니다.`);
        }
      },
      {
        text: '각뿔 15개로 오염 차단 필터를 구매해 유물을 캔다',
        requirement: (state) => state.run.horn >= 15,
        action: (dispatch, state, addLog) => {
          dispatch(spendHorn(15));
          const relic = RELICS[Math.floor(Math.random() * RELICS.length)];
          dispatch(addRelic(relic));
          addLog(`안전하게 차단 장비를 사용해 소장품 [${relic.name}]을(를) 채굴하는 데 성공했습니다.`);
        }
      },
      {
        text: '위험을 피한다',
        action: () => '오리지늄 감염은 치명적입니다. 아쉬움을 뒤로 한 채 탐사를 진행합니다.'
      }
    ]
  }
];

const EncounterScreen = () => {
  const dispatch = useDispatch();
  const state = useSelector(state => state);
  const [outcomeText, setOutcomeText] = useState(null);

  // 현재 노드 정보 기반으로 이벤트 랜덤 결정
  const encounter = useMemo(() => {
    const idx = Math.floor(Math.random() * ENCOUNTERS.length);
    return ENCOUNTERS[idx];
  }, []);

  const handleChoiceClick = (choice) => {
    const logContainer = [];
    const addLog = (msg) => logContainer.push(msg);

    const result = choice.action(dispatch, state, addLog);
    
    if (logContainer.length > 0) {
      setOutcomeText(logContainer.join('\n'));
    } else if (typeof result === 'string') {
      setOutcomeText(result);
    } else {
      setOutcomeText('이벤트가 완료되었습니다.');
    }
  };

  const handleComplete = () => {
    dispatch(completeActiveNode());
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        {/* 장식용 사이버 이펙트 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-800" />
        
        {!outcomeText ? (
          <>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-900 rounded">
                  우연한 만남 (Encounter)
                </span>
                <h2 className="text-2xl font-black">{encounter.title}</h2>
              </div>
              
              <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-950/40 p-4 border border-slate-950 rounded-lg">
                {encounter.description}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {encounter.choices.map((choice, idx) => {
                const isAvailable = choice.requirement ? choice.requirement(state) : true;
                return (
                  <button
                    key={idx}
                    disabled={!isAvailable}
                    onClick={() => handleChoiceClick(choice)}
                    className={`w-full text-left p-4 rounded-lg border text-sm font-semibold transition-all duration-200 flex justify-between items-center ${
                      isAvailable
                        ? 'bg-slate-950 border-slate-800 hover:border-emerald-500 hover:bg-slate-900 text-slate-200 hover:text-white cursor-pointer'
                        : 'bg-slate-950/30 border-slate-950 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span>{choice.text}</span>
                    {!isAvailable && (
                      <span className="text-xs text-red-500 font-mono">조건 미달</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-8 flex flex-col justify-between h-full">
            <div className="space-y-6">
              <h2 className="text-xl font-black text-emerald-400 border-b border-slate-800 pb-2">
                이벤트 결과
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-950/60 p-6 border border-slate-950 rounded-lg">
                {outcomeText}
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-sm font-black rounded-lg transition duration-200 cursor-pointer text-center"
            >
              탐사 작전지로 복귀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterScreen;
