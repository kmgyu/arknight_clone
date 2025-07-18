import React, { useState, useEffect, useRef } from 'react';
import LevelNode from './LevelNode';

// 레벨 정보가 추가된 노드 목록
const nodes = [
  { id: 'start', label: '막간의 여흥', type: 'ROLL', level: 0 },
  { id: 'combat1', label: '작전', type: 'COMBAT', level: 1 },
  { id: 'combat2', label: '작전', type: 'COMBAT', level: 2 },
  { id: 'meet', label: '우연한 만남', type: 'ENCOUNTER', level: 3 },
  { id: 'emergency', label: '긴급 작전', type: 'EMERGENCY', level: 3 },
];

const edges = [
  ['start', 'combat1'],
  ['combat1', 'combat2'],
  ['combat2', 'meet'],
  ['combat2', 'emergency'],
];

function LevelGraph({ selectedNode, onNodeSelect }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // 브라우저 크기 변화 감지
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // level별로 그룹핑
  const levelGroups = nodes.reduce((acc, node) => {
    acc[node.level] = acc[node.level] || [];
    acc[node.level].push(node);
    return acc;
  }, {});

  const levels = Object.keys(levelGroups).sort((a, b) => a - b);
  const totalLevels = levels.length;

  // 반응형 크기 계산 (텍스트보다 더 큰 크기로)
  const calculateNodeSize = () => {
    const baseSize = Math.min(dimensions.width / (totalLevels * 2), dimensions.height / 8);
    return {
      width: Math.max(150, Math.min(300, baseSize * 2.5)),
      height: Math.max(60, Math.min(120, baseSize * 1.2))
    };
  };

  const nodeSize = calculateNodeSize();

  // 연결선 그리기 (렌더링 후 실행)
  const drawLines = () => {
    const lines = [];
    edges.forEach(([fromId, toId], idx) => {
      const fromElem = document.getElementById(`node-${fromId}`);
      const toElem = document.getElementById(`node-${toId}`);
      if (!fromElem || !toElem) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromElem.getBoundingClientRect();
      const toRect = toElem.getBoundingClientRect();
      
      lines.push(
        <line
          key={idx}
          x1={fromRect.left - containerRect.left + fromRect.width / 2}
          y1={fromRect.top - containerRect.top + fromRect.height / 2}
          x2={toRect.left - containerRect.left + toRect.width / 2}
          y2={toRect.top - containerRect.top + toRect.height / 2}
          stroke="#9CA3AF"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
      );
    });
    return lines;
  };

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden flex flex-row z-0" ref={containerRef}>
      {/* SVG 라인 */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" 
        width={dimensions.width} 
        height={dimensions.height}
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
            <path d="M0,0 L10,5 L0,10 Z" fill="#9CA3AF" />
          </marker>
        </defs>
        {dimensions.width > 0 && drawLines()}
      </svg>

      {/* 노드들 */}
      <div className="flex flex-row w-full h-full z-20">
        {levels.map(level => {
          const nodesInLevel = levelGroups[level];
          const nodesCount = nodesInLevel.length;
          
          return (
            <div 
              key={level} 
              className="flex flex-col justify-start items-center border-r border-gray-600 relative"
              style={{
                width: `${100 / totalLevels}%`,
                height: '100%'
              }}
            >
              {/* 레벨 구분선 */}
              <div className="absolute top-0 left-1/2 w-0.5 h-5 bg-gray-500 transform -translate-x-1/2"></div>
              
              {nodesInLevel.map((node, index) => (
                <div 
                  key={node.id} 
                  className="flex justify-center items-center w-full"
                  style={{
                    height: `${100 / nodesCount}%`
                  }}
                >
                  <div className="flex justify-center items-center w-full h-full">
                    <LevelNode
                      node={node}
                      id={`node-${node.id}`}
                      onClick={() => onNodeSelect(node)}
                      style={{
                        width: `${nodeSize.width}px`,
                        height: `${nodeSize.height}px`,
                        fontSize: `${Math.max(12, nodeSize.height * 0.3)}px`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LevelGraph;