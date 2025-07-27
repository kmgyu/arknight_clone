import React, { useState, useEffect, useRef } from 'react';
import LevelNode from '@/components/floor/LevelNode';
import { generateDAGGraph } from '@/utils/graphGenerator.js';

const { nodes, edges } = generateDAGGraph(5, 4);
// 레벨 정보가 추가된 노드 목록
// const nodes = [
//   { id: '0n1', label: '막간의 여흥', type: 'ROLL', level: 0 },
//   { id: '1n1', label: '작전', type: 'COMBAT', level: 1 },
//   { id: '2n1', label: '작전', type: 'COMBAT', level: 2 },
//   { id: '2n2', label: '작전', type: 'COMBAT', level: 2 },
//   { id: '3n1', label: '우연한 만남', type: 'ENCOUNTER', level: 3 },
//   { id: '3n2', label: '긴급 작전', type: 'EMERGENCY', level: 3 },
//   { id: '3n3', label: '긴급 작전', type: 'EMERGENCY', level: 3 },
//   { id: '4n1', label: '작전', type: 'COMBAT', level: 4 },
//   { id: '5n1', label: '긴급 작전', type: 'EMERGENCY', level: 5 },
// ];

// const edges = [
//   ['0n1', '1n1'],
//   ['1n1', '2n1'],
//   ['1n1', '2n2'],
//   ['2n1', '3n1'],
//   ['2n1', '3n2'],
//   ['2n2', '3n2'],
//   ['2n2', '3n3'],
//   ['3n1', '4n1'],
//   ['3n2', '4n1'],
//   ['3n3', '4n1'],
//   ['4n1', '5n1'],
// ];

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

// SVG 라인 생성 함수
const createConnectionLines = (edges, contentRef) => {
  if (!contentRef.current) return [];
  
  return edges.map(([fromId, toId], idx) => {
    const fromElem = document.getElementById(`node-${fromId}`);
    const toElem = document.getElementById(`node-${toId}`);
    if (!fromElem || !toElem) return null;
    
    const contentRect = contentRef.current.getBoundingClientRect();
    const fromRect = fromElem.getBoundingClientRect();
    const toRect = toElem.getBoundingClientRect();
    
    return (
      <line
        key={idx}
        x1={fromRect.left - contentRect.left + fromRect.width / 2}
        y1={fromRect.top - contentRect.top + fromRect.height / 2}
        x2={toRect.left - contentRect.left + toRect.width / 2}
        y2={toRect.top - contentRect.top + toRect.height / 2}
        stroke="#9CA3AF"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />
    );
  }).filter(Boolean);
};

// 연결선 렌더링 관리 훅
const useConnectionLines = (edges, contentRef, contentDimensions) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (contentDimensions.width === 0) return;

    // DOM 요소들이 렌더링될 때까지 잠깐 기다림
    const timer = setTimeout(() => {
      setLines(createConnectionLines(edges, contentRef));
    }, 10);

    return () => clearTimeout(timer);
  }, [edges, contentDimensions]);

  return lines;
};

function LevelGraph({ selectedNode, onNodeSelect }) {
  const { dimensions, contentDimensions, containerRef } = useDimensions(nodes);
  const contentRef = useRef(null);
  const lines = useConnectionLines(edges, contentRef, contentDimensions);
  
  const levelGroups = groupNodesByLevel(nodes);
  const levels = Object.keys(levelGroups).sort((a, b) => a - b);
  const levelWidth = contentDimensions.width / levels.length;
  
  const nodeSize = { width: 200, height: 80 };

  return (
    <div 
      className="relative w-full h-full bg-gray-900 overflow-x-auto overflow-y-hidden" 
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
              <path d="M0,0 L10,5 L0,10 Z" fill="#9CA3AF" />
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
                      onClick={() => onNodeSelect(node)}
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
  );
}

export default LevelGraph;