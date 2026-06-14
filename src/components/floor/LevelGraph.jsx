// src/components/floor/LevelGraph.jsx
import React, { useState, useEffect, useRef } from 'react';
import LevelNode from '@/components/floor/LevelNode';
import { useProgressionSystem } from '@/hooks/useProgressionSystem';
import CompletionModal from '@/components/floor/CompletionModal';
import FloorCompletionModal from '@/components/floor/FloorCompletionModal';
import SidebarPanel from '@/components/floor/SidebarPanel';

// 노드를 레벨별로 그룹화하는 유틸 함수
const groupNodesByLevel = (nodesList) => {
  if (!nodesList) return {};
  return nodesList.reduce((acc, node) => {
    acc[node.level] = acc[node.level] || [];
    acc[node.level].push(node);
    return acc;
  }, {});
};

// 차원 계산 및 관리 훅
const useDimensions = (nodesList) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contentDimensions, setContentDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !nodesList) return;
      
      const { offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;
      const levelGroups = groupNodesByLevel(nodesList);
      const totalLevels = Object.keys(levelGroups).length;
      
      const minLevelWidth = 250;
      const calculatedWidth = totalLevels * minLevelWidth;
      const contentWidth = Math.max(containerWidth, calculatedWidth);
      
      setDimensions({ width: containerWidth, height: containerHeight });
      setContentDimensions({ width: contentWidth, height: containerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [nodesList]);

  return { dimensions, contentDimensions, containerRef };
};

// SVG 연결선 생성 함수 (현재 레벨과의 연결만 활성화)
const createConnectionLines = (edgesList, contentRef, currentLevel, nodesList) => {
  if (!contentRef.current || !edgesList || !nodesList) return [];
  
  return edgesList.map(([fromId, toId], idx) => {
    const fromElem = document.getElementById(`node-${fromId}`);
    const toElem = document.getElementById(`node-${toId}`);
    if (!fromElem || !toElem) return null;
    
    const contentRect = contentRef.current.getBoundingClientRect();
    const fromRect = fromElem.getBoundingClientRect();
    const toRect = toElem.getBoundingClientRect();
    
    const fromNode = nodesList.find(n => n.id === fromId);
    const toNode = nodesList.find(n => n.id === toId);
    const isCurrentLevelConnection = 
      (fromNode?.level === currentLevel - 1 && toNode?.level === currentLevel) ||
      (fromNode?.level === currentLevel && toNode?.level === currentLevel + 1);
    
    return (
      <line
        key={idx}
        x1={fromRect.left - contentRect.left + fromRect.width / 2}
        y1={fromRect.top - contentRect.top + fromRect.height / 2}
        x2={toRect.left - contentRect.left + toRect.width / 2}
        y2={toRect.top - contentRect.top + toRect.height / 2}
        stroke={isCurrentLevelConnection ? "#60A5FA" : "#4B5563"}
        strokeWidth={isCurrentLevelConnection ? "3" : "2"}
        strokeOpacity={isCurrentLevelConnection ? "1" : "0.3"}
        strokeDasharray={isCurrentLevelConnection ? "none" : "8,4"}
        markerEnd="url(#arrow)"
      />
    );
  }).filter(Boolean);
};

// 연결선 렌더링 관리 훅
const useConnectionLines = (edgesList, contentRef, contentDimensions, currentLevel, nodesList) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (contentDimensions.width === 0 || !edgesList) return;

    const timer = setTimeout(() => {
      setLines(createConnectionLines(edgesList, contentRef, currentLevel, nodesList));
    }, 50);

    return () => clearTimeout(timer);
  }, [edgesList, contentDimensions, currentLevel, nodesList]);

  return lines;
};

function LevelGraph({ selectedNode, onNodeSelect }) {
  const contentRef = useRef(null);
  const [showFloorCompletionModal, setShowFloorCompletionModal] = useState(false);
  const [completedFloor, setCompletedFloor] = useState(null);
  
  const {
    completedNodes,
    availableNodes,
    currentLevel,
    currentFloor,
    nodes,
    edges,
    isNodeActive,
    isNodeClickable,
    isNodeCompleted,
    isNodeCurrent,
    getProgressStats,
    resetProgress
  } = useProgressionSystem();

  const { dimensions, contentDimensions, containerRef } = useDimensions(nodes);
  const lines = useConnectionLines(edges, contentRef, contentDimensions, currentLevel, nodes);
  
  const levelGroups = groupNodesByLevel(nodes);
  const levels = Object.keys(levelGroups).sort((a, b) => a - b);
  const levelWidth = levels.length > 0 ? contentDimensions.width / levels.length : 0;
  
  const nodeSize = { width: 200, height: 80 };

  // 노드 클릭 핸들러 (사이드바 오픈)
  const handleNodeClick = (node) => {
    onNodeSelect?.(node);
  };

  const progressStats = getProgressStats();

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* 메인 그래프 영역 */}
      <div 
        className="relative w-full h-full overflow-x-auto overflow-y-hidden" 
        ref={containerRef}
      >
        <div 
          className="relative h-full flex flex-row"
          ref={contentRef}
          style={{ 
            width: `${contentDimensions.width}px`,
            minWidth: '100%'
          }}
        >
          {/* SVG 연결선 */}
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" 
            width={contentDimensions.width} 
            height={contentDimensions.height}
          >
            <defs>
              <marker 
                id="arrow" 
                markerWidth="10" 
                markerHeight="10" 
                refX="10" 
                refY="5"
                orient="auto" 
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L10,5 L0,10 Z" fill="#60A5FA" />
              </marker>
            </defs>
            {contentDimensions.width > 0 && lines}
          </svg>

          {/* 레벨별 노드 렌더링 */}
          {levels.map(level => {
            const nodesInLevel = levelGroups[level];
            const nodesCount = nodesInLevel.length;
            
            return (
              <div 
                key={level} 
                className="flex flex-col justify-start items-center border-r border-slate-900 relative z-20"
                style={{ width: `${levelWidth}px`, height: '100%' }}
              >
                <div className="absolute top-0 left-1/2 w-0.5 h-5 bg-slate-800 transform -translate-x-1/2" />
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 font-mono">
                  Level {level}
                </div>
                
                {nodesInLevel.map((node, index) => (
                  <div 
                    key={node.id} 
                    className="flex justify-center items-center w-full"
                    style={{
                      height: `${100 / nodesCount}%`,
                      paddingTop: index === 0 ? '30px' : '0'
                    }}
                  >
                    <div className="flex justify-center items-center w-full h-full px-2">
                      <LevelNode
                        node={node}
                        id={`node-${node.id}`}
                        onClick={() => handleNodeClick(node)}
                        isActive={isNodeActive(node.id)}
                        isCompleted={isNodeCompleted(node.id)}
                        isClickable={isNodeClickable(node.id)}
                        isCurrent={isNodeCurrent(node.id)}
                        style={{
                          width: `${Math.min(nodeSize.width, levelWidth - 20)}px`,
                          height: `${nodeSize.height}px`,
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* 스크롤 인디케이터 */}
        {contentDimensions.width > dimensions.width && (
          <div className="absolute bottom-2 right-2 bg-slate-900 text-slate-400 text-[10px] px-2 py-1 border border-slate-800 rounded z-30 font-bold uppercase tracking-wider">
            좌우 드래그 스크롤 →
          </div>
        )}
      </div>

      {/* 진행 상황 UI */}
      <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-800 rounded-lg p-4 text-white z-40 shadow-2xl backdrop-blur-sm">
        <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">진행 상황</h3>
        <div className="space-y-1 text-xs">
          <div>현재 Floor: <span className="text-yellow-400 font-bold">{currentFloor}/5</span></div>
          <div>현재 레벨: <span className="text-blue-400 font-bold">{currentLevel}</span></div>
          <div>진행도: {progressStats.completed}/{progressStats.totalNodes} 노드 완료</div>
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div>Floor 진행률: {Math.round(progressStats.floorProgress * 100)}%</div>
            <div>전체 진행률: {Math.round(progressStats.completionRate * 100)}%</div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 rounded-lg p-3 text-white text-[10px] z-40 shadow-2xl backdrop-blur-sm">
        <h4 className="font-extrabold text-amber-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">범례</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 rounded opacity-60"></div>
            <span>완료 또는 미도달 지역</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span>진입 가능 작전지</span>
          </div>
        </div>
      </div>

      {/* Floor 완료 모달 */}
      <FloorCompletionModal
        isOpen={showFloorCompletionModal}
        onClose={() => setShowFloorCompletionModal(false)}
        completedFloor={completedFloor}
        nextFloor={currentFloor}
        isLastFloor={currentFloor > 5}
      />
    </div>
  );
}

export default LevelGraph;