import React, { useState } from 'react';
import LevelGraph from '@/components/LevelGraph';
import SidebarPanel from '@/components/SidebarPanel';
import ResourceHUD from '@/components/resources/ResourceHUD';

function Scenario() {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white relative">
      {/* 메인 콘텐츠 영역 - 전체 화면 사용 */}
      <div className="flex flex-col h-screen">
        <div className="px-4 py-6 z-10">
          <h1 className="text-2xl font-bold mb-4">작전 경로 시각화</h1>
          <p className="text-sm text-gray-300 mb-6">
            아래 그래프는 작전 시나리오의 진행 흐름을 보여줍니다. 각 노드를 클릭하면 상세 정보를 확인할 수 있습니다.
          </p>
          <ResourceHUD />
        </div>
        
        <div className="flex-1 z-0">
          <LevelGraph 
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        </div>
      </div>

      {/* 사이드바 패널 - 오버레이로 표시 */}
      <SidebarPanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </div>
  );
}

export default Scenario;