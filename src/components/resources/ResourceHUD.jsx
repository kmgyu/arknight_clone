import React from 'react';
import { useSelector } from 'react-redux';
import { selectGameResources, selectUserResources } from '@/hooks/resourceSelectors';

const ResourceHUD = () => {
  const game = useSelector(selectGameResources);
  const user = useSelector(selectUserResources);

  return (
    <div className="p-4 bg-gray-900 text-white rounded shadow-md grid grid-cols-2 gap-4 text-sm">
      <div>
        <h3 className="font-bold">게임 자원</h3>
        <p>각뿔: {game.horn}</p>
        <p>희망: {game.hope}</p>
        <p>편성 인원: {game.deployable}</p>
        <p>부하 수용치: {game.toilLimit}</p>
        <p>부하: {game.toil}</p>
      </div>
      <div>
        <h3 className="font-bold">유저 자원</h3>
        <p>역사의 재구성: {user.historyRemake}</p>
        <p>방황신화: {user.mythFragments}</p>
      </div>
    </div>
  );
};

export default ResourceHUD;
