
const typePool = ['COMBAT', // 작전
                  'EMERGENCY', // 긴급 작전
                  'ROLL', // 막간의 여흥, 흥미진진
                  'ENCOUNTER', // 우연한 만남
                ];

/**
 * DAG 그래프 자동 생성기
 * @param {number} maxLevel - 생성할 최대 레벨 수 (0부터 시작)
 * @param {number} maxNodesPerLevel - 각 레벨당 최대 노드 수
 * @returns {{ nodes: Array, edges: Array }} - 그래프 노드와 엣지 배열
 */
export function generateDAGGraph(maxLevel = 5, maxNodesPerLevel = 4) {
  const nodes = [];
  const edges = [];

  // 노드 생성
  for (let level = 0; level <= maxLevel; level++) {
    const isBossLevel = level === maxLevel;
    const nodeCount = isBossLevel ? 1 : Math.floor(Math.random() * maxNodesPerLevel) + 1;

    for (let i = 0; i < nodeCount; i++) {
      const id = `${level}n${i + 1}`;
      const label = isBossLevel ? '보스' : `레벨 ${level}`;
      const type = typePool[Math.floor(Math.random() * typePool.length)];

      nodes.push({ id, label, type, level });
    }
  }

  // 엣지 생성
  for (let level = 0; level < maxLevel; level++) {
    const currentLevelNodes = nodes.filter(n => n.level === level);
    const nextLevelNodes = nodes.filter(n => n.level === level + 1);

    currentLevelNodes.forEach((source, sIdx) => {
        // 최대 2개로 연결.
        // ToDo : 원래는 4개까지도 가능해야 할 건데, 교차 방지라 로직 더 복잡해질거같으니까 일단 나중에...
        // 보정하는 과정에서 노드 연결되면서 교차되는 불상사가 생긴다.
        const targets = nextLevelNodes.slice(sIdx, sIdx + 2); 
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

  // 연결 보정 : 출구 없음
  nodes
    .filter(n => n.level < maxLevel) // 중간 노드 및 시작 노드
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

  
  return { nodes, edges };
}
