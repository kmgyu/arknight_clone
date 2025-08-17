import React, { useState, useEffect, useRef } from 'react';
import LevelNode from '@/components/floor/LevelNode';
import { generateDAGGraph } from '@/utils/graphGenerator.js';
import { useProgressionSystem } from '@/hooks/useProgressionSystem';
import CompletionModal from '@/components/floor/CompletionModal';

const { nodes, edges } = generateDAGGraph(5, 4);

// 노드를 레벨별로 그룹화하는 유틸 함수
const groupNodesByLevel = (nodes) => {
  return nodes.reduce((acc, node) => {
    acc[node.level] = acc[node.level] || [];
    acc[node.level].push(node);
    return acc;
  }, {});
};

// 차원 계산 및 관리 훅
const useDimensions = (nodes) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contentDimensions, setContentDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const { offsetWidth: containerWidth, offsetHeight: containerHeight } = containerRef.current;
      const levelGroups = groupNodesByLevel(nodes);
      const totalLevels = Object.keys(levelGroups).length;
      
      // 각 레벨당 최소 너비 설정
      const minLevelWidth = 250;
      const calculatedWidth = totalLevels * minLevelWidth;
      const contentWidth = Math.max(containerWidth, calculatedWidth);
      
      setDimensions({ width: containerWidth, height: containerHeight });
      setContentDimensions({ width: contentWidth, height: containerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [nodes]);

  return { dimensions, contentDimensions, containerRef };
};

// SVG 라인 생성 함수 (현재 레벨과의 연결만 활성화)
const createConnectionLines = (edges, contentRef, currentLevel, nodes) => {
  if (!contentRef.current) return [];
  
  return edges.map(([fromId, toId], idx) => {
    const fromElem = document.getElementById(`node-${fromId}`);
    const toElem = document.getElementById(`node-${toId}`);
    if (!fromElem || !toElem) return null;
    
    const contentRect = contentRef.current.getBoundingClientRect();
    const fromRect = fromElem.getBoundingClientRect();
    const toRect = toElem.getBoundingClientRect();
    
    // 연결선 활성화 조건: 현재 레벨과 관련된 연결
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
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
const useConnectionLines = (edges, contentRef, contentDimensions, currentLevel, nodes) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (contentDimensions.width === 0) return;

    // DOM 요소들이 렌더링될 때까지 잠깐 기다림
    const timer = setTimeout(() => {
      setLines(createConnectionLines(edges, contentRef, currentLevel, nodes));
    }, 10);

    return () => clearTimeout(timer);
  }, [edges, contentDimensions, currentLevel, nodes]);

  return lines;
};

function LevelGraph({ selectedNode, onNodeSelect }) {
  const { dimensions, contentDimensions, containerRef } = useDimensions(nodes);
  const contentRef = useRef(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [gameStartTime] = useState(Date.now());
  
  const {
    completedNodes,
    currentNode,
    availableNodes,
    currentLevel,
    completeNode,
    selectNode,
    isNodeActive,
    isNodeClickable,
    isNodeCompleted,
    isNodeCurrent,
    getProgressStats,
    resetProgress
  } = useProgressionSystem(nodes, edges, {
    autoSave: true,
    autoLoad: true,
    onNodeComplete: (nodeId, completedSet, isBossNode) => {
      console.log(`노드 ${nodeId} 완료!`);
      
      // 보스 노드 완료 시 모달 표시
      if (isBossNode) {
        setTimeout(() => {
          setShowCompletionModal(true);
        }, 1000); // 1초 후 모달 표시
      }
    },
    onNodeSelect: (node) => {
      console.log(`노드 ${node.id} 선택됨`);
    }
  });

  const lines = useConnectionLines(edges, contentRef, contentDimensions, currentLevel, nodes);
  
  const levelGroups = groupNodesByLevel(nodes);
  const levels = Object.keys(levelGroups).sort((a, b) => a - b);
  const levelWidth = contentDimensions.width / levels.length;
  
  const nodeSize = { width: 200, height: 80 };

  // 노드 클릭 핸들러
  const handleNodeClick = (node) => {
    if (selectNode(node.id)) {
      onNodeSelect?.(node);
      
      // 실제 게임에서는 여기서 레벨 진입 로직 실행
      // 임시로 노드를 바로 완료 처리 (실제로는 게임 완료 시 호출)
      if (isNodeClickable(node.id)) {
        setTimeout(() => {
          completeNode(node.id);
        }, 1000);
      }
    }
  };

  // 게임 재시작 핸들러
  const handleRestart = () => {
    resetProgress();
    setShowCompletionModal(false);
    // 새로운 그래프 생성 (실제로는 새로운 층 데이터 로드)
    window.location.reload(); // 임시 방법, 실제로는 상태 초기화
  };

  // 완료 시간 계산
  const getCompletionTime = () => {
    const elapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  const progressStats = getProgressStats();

  return (
    <div className="relative w-full h-full bg-gray-900">
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
                className="flex flex-col justify-start items-center border-r border-gray-600 relative z-20"
                style={{ width: `${levelWidth}px`, height: '100%' }}
              >
                <div className="absolute top-0 left-1/2 w-0.5 h-5 bg-gray-500 transform -translate-x-1/2" />
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-mono">
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
          <div className="absolute bottom-2 right-2 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded z-30">
            좌우로 스크롤하세요 →
          </div>
        )}
      </div>

      {/* 진행 상황 UI */}
      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 text-white z-40">
        <h3 className="text-lg font-bold mb-2">진행 상황</h3>
        <div className="space-y-1 text-sm">
          <div>현재 레벨: <span className="text-yellow-400 font-bold">{currentLevel}</span></div>
          <div>완료된 노드: {progressStats.completed}/{progressStats.totalNodes}</div>
          <div>현재 플레이 가능: {progressStats.available}개</div>
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div>진행률: {Math.round(progressStats.completionRate * 100)}%</div>
            {progressStats.isGameComplete && (
              <div className="text-yellow-400 font-bold">🎉 보스 클리어!</div>
            )}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-40">
        <h4 className="font-bold mb-2">범례</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded opacity-60"></div>
            <span>완료/현재 레벨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>플레이 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded opacity-30"></div>
            <span>미래 레벨</span>
          </div>
        </div>
      </div>

      {/* 완료 모달 */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onRestart={handleRestart}
        completedNodes={progressStats.completed}
        totalNodes={progressStats.totalNodes}
        completionTime={getCompletionTime()}
      />
    </div>
  );
}

export default LevelGraph;