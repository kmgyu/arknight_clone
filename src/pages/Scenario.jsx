import React from 'react';
import LevelGraph from '../components/LevelGraph';

function Scenario() {
  return (
    <div className="w-full min-h-screen bg-gray-900 text-white px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">작전 경로 시각화</h1>
      <p className="text-sm text-gray-300 mb-6">
        아래 그래프는 작전 시나리오의 진행 흐름을 보여줍니다. 각 노드를 클릭하면 상세 정보를 확인할 수 있습니다.
      </p>
      <LevelGraph />
    </div>
  );
}

export default Scenario;
