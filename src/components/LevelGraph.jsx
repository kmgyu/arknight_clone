import React, { useState, useEffect, useRef } from 'react';
import LevelNode from './LevelNode';
import '../styles/graph.css';

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
          stroke="#aaa"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
      );
    });
    return lines;
  };

  return (
    <div className="graph-container" ref={containerRef}>
      {/* SVG 라인 */}
      <svg className="graph-lines" width={dimensions.width} height={dimensions.height}>
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
            <path d="M0,0 L10,5 L0,10 Z" fill="#aaa" />
          </marker>
        </defs>
        {dimensions.width > 0 && drawLines()}
      </svg>

      {/* 노드들 */}
      <div className="graph-levels">
        {levels.map(level => {
          const nodesInLevel = levelGroups[level];
          const nodesCount = nodesInLevel.length;
          
          return (
            <div 
              key={level} 
              className="graph-level"
              style={{
                width: `${100 / totalLevels}%`,
                height: '100%'
              }}
            >
              {nodesInLevel.map((node, index) => (
                <div 
                  key={node.id} 
                  className="node-wrapper"
                  style={{
                    height: `${100 / nodesCount}%`,
                    width: '100%'
                  }}
                >
                  <div className="node-container">
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