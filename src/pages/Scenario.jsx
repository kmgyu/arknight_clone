import React, { useState } from 'react';
import LevelGraph from '../components/LevelGraph';
import SidebarPanel from '../components/SidebarPanel';

function Scenario() {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* 메인 콘텐츠 영역 */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            selectedNode ? 'mr-80' : 'mr-0'
          }`}
        >
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">작전 경로 시각화</h1>
            <p className="text-sm text-gray-300 mb-6">
              아래 그래프는 작전 시나리오의 진행 흐름을 보여줍니다. 각 노드를 클릭하면 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
          
          <div className="h-full">
            <LevelGraph 
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
            />
          </div>
        </div>

        {/* 사이드바 패널 */}
        <SidebarPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      </div>
    </div>
  );
}

export default Scenario;