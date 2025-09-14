import getNodeContentComponent from "@/utils/getNodeContentComponent";

const typePool = ['COMBAT', // 작전
                  'EMERGENCY', // 긴급 작전
                  'ROLL', // 막간의 여흥, 흥미진진
                  'ENCOUNTER', // 우연한 만남
                  'SAFE', // 안전한 곳
                ];

/**
 * 단일 Floor DAG 그래프 생성기
 * @param {number} floorNumber - 생성할 Floor 번호 (1-5)
 * @param {number} maxLevels - Floor 내 최대 레벨 수
 * @param {number} maxNodesPerLevel - 각 레벨당 최대 노드 수
 * @returns {{ nodes: Array, edges: Array }} - 그래프 노드와 엣지 배열
 */
export function generateDAGGraph(floorNumber = 1, maxLevels = 4, maxNodesPerLevel = 4) {
  const nodes = [];
  const edges = [];

  // 단일 Floor의 노드 생성
  for (let level = 0; level <= maxLevels; level++) {
    const isBossLevel = level === maxLevels;
    const nodeCount = isBossLevel ? 1 : Math.floor(Math.random() * maxNodesPerLevel) + 1;

    for (let i = 0; i < nodeCount; i++) {
      const id = `f${floorNumber}l${level}n${i + 1}`;
      let label, type;
      
      if (isBossLevel) {
        label = `Floor ${floorNumber} 보스`;
        type = 'BOSS';
      } else if (level === 0) {
        label = `Floor ${floorNumber} 시작점 ${i + 1}`;
        type = 'SAFE'; // 시작점은 안전한 곳으로 설정
      } else {
        label = `F${floorNumber}-${level}-${i + 1}`;
        type = typePool[Math.floor(Math.random() * typePool.length)];
      }
      
      const content = getNodeContentComponent(type);
      
      nodes.push({ 
        id, 
        label, 
        type, 
        level, 
        floor: floorNumber,
        content 
      });
    }
  }

  // 단일 Floor 내에서 레벨 간 연결
  for (let level = 0; level < maxLevels; level++) {
    const currentLevelNodes = nodes.filter(n => n.level === level);
    const nextLevelNodes = nodes.filter(n => n.level === level + 1);

    currentLevelNodes.forEach((source, sIdx) => {
      const maxConnections = Math.min(2, nextLevelNodes.length);
      const startIdx = Math.min(sIdx, nextLevelNodes.length - maxConnections);
      const targets = nextLevelNodes.slice(startIdx, startIdx + maxConnections); 
      
      targets.forEach(target => {
        edges.push([source.id, target.id]);
      });
    });

    // 연결 보정 : 입구 없음
    nextLevelNodes.forEach((target) => {
      const hasInput = edges.some(([_, to]) => to === target.id);
      if (!hasInput) {
        const fallbackSource = currentLevelNodes[Math.floor(Math.random() * currentLevelNodes.length)];
        edges.push([fallbackSource.id, target.id]);
      }
    });
  }

  // Floor 내 연결 보정 : 출구 없음
  nodes
    .filter(n => n.level < maxLevels) // 중간 노드 및 시작 노드
    .forEach((node) => {
      const hasOutput = edges.some(([from, _]) => from === node.id);
      if (!hasOutput) {
        const candidates = nodes.filter(n => n.level === node.level + 1);
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          edges.push([node.id, target.id]);
        }
      }
    });

  // 보스 노드 연결 보정 - 마지막 레벨의 모든 노드가 보스로 연결되도록
  const bossNode = nodes.find(n => n.type === 'BOSS');
  const lastRegularLevel = maxLevels - 1;
  const lastLevelNodes = nodes.filter(n => n.level === lastRegularLevel);
  
  if (bossNode) {
    lastLevelNodes.forEach(node => {
      const alreadyConnected = edges.some(([from, to]) => 
        from === node.id && to === bossNode.id
      );
      
      if (!alreadyConnected) {
        edges.push([node.id, bossNode.id]);
      }
    });
  }
  
  return { nodes, edges };
}

/**
 * 진행 상태 저장/로드 유틸리티 함수들
 */
export const saveProgress = (completedNodes, currentNode) => {
  const progressData = {
    completedNodes: Array.from(completedNodes),
    currentNode,
    timestamp: Date.now()
  };
  localStorage.setItem('level_progress', JSON.stringify(progressData));
};

export const loadProgress = () => {
  try {
    const saved = localStorage.getItem('level_progress');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        completedNodes: new Set(data.completedNodes || []),
        currentNode: data.currentNode || null
      };
    }
  } catch (error) {
    console.error('진행 상황 로드 실패:', error);
  }
  return {
    completedNodes: new Set(),
    currentNode: null
  };
};

/**
 * 노드 접근 가능성 검증 함수
 */
export const validateNodeAccess = (nodeId, completedNodes, availableNodes, nodes) => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return false;

  // 레벨 0 노드는 항상 접근 가능
  if (node.level === 0) return true;

  // 완료된 노드는 재접근 가능
  if (completedNodes.has(nodeId)) return true;

  // 사용 가능한 노드 목록에 있는 경우
  return availableNodes.has(nodeId);
};

/**
 * 다음 추천 노드 반환
 */
export const getRecommendedNodes = (availableNodes, nodes, completedNodes) => {
  const available = Array.from(availableNodes)
    .map(nodeId => nodes.find(n => n.id === nodeId))
    .filter(node => node && !completedNodes.has(node.id));

  // 우선순위: SAFE > ENCOUNTER > COMBAT > ROLL > EMERGENCY
  const priorityMap = {
    'SAFE': 5,
    'ENCOUNTER': 4,
    'COMBAT': 3,
    'ROLL': 2,
    'EMERGENCY': 1,
    'BOSS': 0
  };

  return available.sort((a, b) => {
    const priorityA = priorityMap[a.type] || 0;
    const priorityB = priorityMap[b.type] || 0;
    return priorityB - priorityA;
  });
};