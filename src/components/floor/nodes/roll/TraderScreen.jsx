// src/components/floor/nodes/roll/TraderScreen.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  spendHorn, recruitOperator, addRelic, healOperator, completeActiveNode 
} from '@/stores/slices/runSlice';
import { RELICS, OPERATORS, CLASSES } from '@/config/gameData';

const TraderScreen = () => {
  const dispatch = useDispatch();
  const run = useSelector(state => state.run);
  const [shopItems, setShopItems] = useState({ relics: [], recruits: [], heals: [] });
  const [purchasedIds, setPurchasedIds] = useState(new Set());
  const [healingTargetOp, setHealingTargetOp] = useState(null);

  const { horn, recruitedOperators } = run;

  // 상점 품목 초기화 (한 번만 실행되도록)
  useEffect(() => {
    // 1. 소장품 3개 랜덤 추출 (가격 설정: 12~20 각뿔)
    const shuffledRelics = [...RELICS].sort(() => 0.5 - Math.random());
    const selectedRelics = shuffledRelics.slice(0, 3).map((relic, idx) => ({
      ...relic,
      shopId: `relic_${relic.id}_${idx}`,
      price: Math.floor(Math.random() * 6) + 13 // 13~18 각뿔
    }));

    // 2. 모집 가능한 대원들을 직업권 티켓으로 추출 (가격: 8 각뿔)
    const recruitedIds = recruitedOperators.map(o => o.id);
    const availablePool = Object.values(OPERATORS).filter(o => !recruitedIds.includes(o.id));
    const selectedRecruits = [];
    
    if (availablePool.length > 0) {
      // 무작위 2명 추출하여 고용권으로 판매
      const shuffledOps = [...availablePool].sort(() => 0.5 - Math.random());
      shuffledOps.slice(0, 2).forEach((op, idx) => {
        selectedRecruits.push({
          shopId: `recruit_${op.id}_${idx}`,
          name: `모집권: [${op.name}]`,
          description: `${op.class} 포지션의 대원을 즉시 영입합니다.`,
          price: 8,
          operator: op
        });
      });
    }

    // 3. 포션 판매 (대원 1명 체력 100% / 정신력 50 회복, 가격: 5 각뿔)
    const selectedHeals = [
      {
        shopId: 'heal_potion',
        name: '비상용 생명 포션',
        description: '오퍼레이터 한 명의 체력을 100% 회복하고 정신력을 50 치유합니다.',
        price: 5
      }
    ];

    setShopItems({ relics: selectedRelics, recruits: selectedRecruits, heals: selectedHeals });
  }, [recruitedOperators]);

  // 소장품 구매
  const buyRelic = (item) => {
    if (horn < item.price) return;
    dispatch(spendHorn(item.price));
    dispatch(addRelic(item));
    setPurchasedIds(prev => new Set([...prev, item.shopId]));
  };

  // 대원 영입 구매
  const buyRecruit = (item) => {
    if (horn < item.price) return;
    dispatch(spendHorn(item.price));
    
    const template = item.operator;
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
    setPurchasedIds(prev => new Set([...prev, item.shopId]));
  };

  // 대원 치료 구매 (모달)
  const executeHeal = (opId, price) => {
    if (horn < price) return;
    dispatch(spendHorn(price));
    dispatch(healOperator({ opId, hpAmount: 9999, sanityAmount: 50 }));
    setHealingTargetOp(null);
    alert('대원이 성공적으로 치료되었습니다!');
  };

  const handleLeave = () => {
    dispatch(completeActiveNode());
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col justify-between p-6 font-sans">
      
      {/* 상단 상점 정보 */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-500 bg-amber-950 px-2 py-0.5 border border-amber-900 rounded">
            Rogue's Trader
          </span>
          <h2 className="text-xl font-black">칸타빌레의 유랑 거래소</h2>
        </div>
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-bold">보유 자금:</span>
          <span className="text-amber-400 font-black font-mono text-lg">{horn} 각뿔</span>
        </div>
      </div>

      {/* 쇼핑 상품 그리드 */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-1 py-2">
        
        {/* 1. 소장품 코너 */}
        <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-amber-500 border-b border-slate-800 pb-2">📦 소장품 유물</h3>
          <div className="flex-1 flex flex-col gap-3">
            {shopItems.relics.map(item => {
              const purchased = purchasedIds.has(item.shopId);
              const canAfford = horn >= item.price;
              return (
                <div key={item.shopId} className={`p-3 rounded-lg border bg-slate-950 flex flex-col justify-between h-[120px] transition duration-200 ${purchased ? 'border-slate-800 opacity-50' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div>
                    <div className="text-xs font-extrabold text-slate-200">{item.name}</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-amber-400 font-bold font-mono">{item.price} 각뿔</span>
                    {purchased ? (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black">SOLD OUT</span>
                    ) : (
                      <button 
                        disabled={!canAfford}
                        onClick={() => buyRelic(item)}
                        className={`text-[10px] px-2.5 py-1 rounded font-black transition ${
                          canAfford 
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        구매
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 대원 영입 코너 */}
        <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-amber-500 border-b border-slate-800 pb-2">🤝 전술 임시 모집</h3>
          <div className="flex-1 flex flex-col gap-3">
            {shopItems.recruits.length === 0 ? (
              <div className="text-xs text-slate-500 text-center my-auto">더 이상 모집할 대원이 없습니다.</div>
            ) : (
              shopItems.recruits.map(item => {
                const purchased = purchasedIds.has(item.shopId);
                const canAfford = horn >= item.price;
                return (
                  <div key={item.shopId} className={`p-3 rounded-lg border bg-slate-950 flex flex-col justify-between h-[120px] transition duration-200 ${purchased ? 'border-slate-800 opacity-50' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div>
                      <div className="text-xs font-extrabold text-slate-200">{item.name}</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-amber-400 font-bold font-mono">{item.price} 각뿔</span>
                      {purchased ? (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black">모집완료</span>
                      ) : (
                        <button 
                          disabled={!canAfford}
                          onClick={() => buyRecruit(item)}
                          className={`text-[10px] px-2.5 py-1 rounded font-black transition ${
                            canAfford 
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                              : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          구매
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. 소모품/포션 코너 */}
        <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-amber-500 border-b border-slate-800 pb-2">🧪 소모성 의료 물자</h3>
          <div className="flex-1 flex flex-col gap-3">
            {shopItems.heals.map(item => {
              const canAfford = horn >= item.price;
              return (
                <div key={item.shopId} className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex flex-col justify-between h-[120px] hover:border-slate-700 transition">
                  <div>
                    <div className="text-xs font-extrabold text-slate-200">{item.name}</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-amber-400 font-bold font-mono">{item.price} 각뿔</span>
                    <button 
                      disabled={!canAfford}
                      onClick={() => setHealingTargetOp(item)}
                      className={`text-[10px] px-2.5 py-1 rounded font-black transition ${
                        canAfford 
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                          : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      치료하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 하단 나기기 영역 */}
      <button 
        onClick={handleLeave}
        className="w-full py-3 mt-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-sm transition duration-200 cursor-pointer text-center"
      >
        상점을 나간다
      </button>

      {/* 치료 대원 선택 모달 */}
      {healingTargetOp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
            <h3 className="text-sm font-extrabold text-amber-400 mb-4 border-b border-slate-800 pb-2">치료할 오퍼레이터를 선택하십시오</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-1">
              {recruitedOperators.map(op => (
                <button
                  key={op.id}
                  onClick={() => executeHeal(op.id, healingTargetOp.price)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-amber-500 p-3 rounded-lg flex items-center justify-between text-left hover:bg-slate-900 transition cursor-pointer text-xs"
                >
                  <div>
                    <div className="font-bold">{op.name}</div>
                    <div className="text-[10px] text-slate-400">HP: {op.hp}/{op.maxHp} | SAN: {op.sanity}/100</div>
                  </div>
                  <span className="text-amber-500 font-bold">치료하기 →</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setHealingTargetOp(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TraderScreen;
