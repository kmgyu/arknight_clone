// src/hooks/useProgressionSystem.js
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNode, completeActiveNode, quitRun } from '@/stores/slices/runSlice';
import { validateNodeAccess, getRecommendedNodes } from '@/utils/graphGenerator';

export const useProgressionSystem = (initialNodes, initialEdges, options = {}) => {
  const dispatch = useDispatch();
  const run = useSelector(state => state.run);
  
  const {
    floor: currentFloor,
    level: currentLevel,
    currentNodeId: currentNode,
    completedNodes: completedNodesArray,
    mapNodes: nodes,
    mapEdges: edges
  } = run;

  // 호환성을 위해 Array를 Set으로 래핑
  const completedNodes = useMemo(() => new Set(completedNodesArray), [completedNodesArray]);

  // 현재 Floor의 레벨 계산
  const getCurrentLevel = useCallback(() => {
    const floorNodes = nodes.filter(n => n.floor === currentFloor);
    
    if (floorNodes.length === 0) return 0;
    
    const completedLevels = Array.from(completedNodes)
      .map(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.floor === currentFloor ? node.level : null;
      })
      .filter(level => level !== null);
    
    return completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 0;
  }, [completedNodes, nodes, currentFloor]);

  // 사용 가능한 노드 계산 (현재 Floor의 현재 레벨 노드들만)
  const availableNodes = useMemo(() => {
    const available = new Set();
    const currentLevelNum = getCurrentLevel();
    
    if (currentLevelNum === 0) {
      nodes
        .filter(node => node.floor === currentFloor && node.level === 0)
        .forEach(node => available.add(node.id));
    } else {
      // 이전 완료 노드들의 이웃(edges)만 접근 가능하도록 정밀 검증
      // 다키스트/원작 스타일: 이전 완료한 노드에서 이어지는 엣지의 대상 노드들 중 현재 레벨인 노드
      const lastCompletedInFloor = Array.from(completedNodes).filter(nodeId => {
        const n = nodes.find(x => x.id === nodeId);
        return n && n.floor === currentFloor && n.level === currentLevelNum - 1;
      });

      if (lastCompletedInFloor.length > 0) {
        edges.forEach(([from, to]) => {
          if (lastCompletedInFloor.includes(from)) {
            const toNode = nodes.find(x => x.id === to);
            if (toNode && toNode.level === currentLevelNum) {
              available.add(to);
            }
          }
        });
      } else {
        // 백업: 그냥 현재 레벨의 모든 노드 활성화
        nodes
          .filter(node => node.floor === currentFloor && node.level === currentLevelNum)
          .forEach(node => available.add(node.id));
      }
    }
    return available;
  }, [nodes, currentFloor, getCurrentLevel, completedNodes, edges]);

  // 노드 완료 처리
  const completeNode = useCallback((nodeId) => {
    dispatch(completeActiveNode());
    return true;
  }, [dispatch]);

  // 노드 선택 처리
  const selectNodeAction = useCallback((nodeId) => {
    if (!validateNodeAccess(nodeId, completedNodes, availableNodes, nodes)) {
      console.warn(`노드 ${nodeId}에 접근할 수 없습니다.`);
      return false;
    }
    dispatch(selectNode(nodeId));
    return true;
  }, [dispatch, completedNodes, availableNodes, nodes]);

  // 노드 상태 확인 함수들
  const isNodeActive = useCallback((nodeId) => {
    return availableNodes.has(nodeId);
  }, [availableNodes]);

  const isNodeClickable = useCallback((nodeId) => {
    return availableNodes.has(nodeId) && !completedNodes.has(nodeId);
  }, [availableNodes, completedNodes]);

  const isNodeCompleted = useCallback((nodeId) => {
    return completedNodes.has(nodeId);
  }, [completedNodes]);

  const isNodeCurrent = useCallback((nodeId) => {
    return currentNode === nodeId;
  }, [currentNode]);

  // 진행 통계
  const getProgressStats = useCallback(() => {
    const totalNodes = nodes.length;
    const completed = completedNodes.size;
    const available = availableNodes.size;
    const locked = totalNodes - completed - available;
    
    const bossNodes = nodes.filter(n => n.type === 'BOSS');
    const bossCompleted = bossNodes.filter(boss => completedNodes.has(boss.id)).length;
    
    const totalFloors = 5;
    const floorProgress = currentFloor / totalFloors;
    
    return {
      totalNodes,
      completed,
      available,
      locked,
      completionRate: totalNodes > 0 ? completed / totalNodes : 0,
      bossNodes: bossNodes.length,
      bossCompleted,
      isGameComplete: currentFloor > 5 || (currentFloor === 5 && bossCompleted > 0),
      currentFloor,
      totalFloors,
      floorProgress
    };
  }, [nodes, completedNodes, availableNodes, currentFloor]);

  const getRecommendations = useCallback(() => {
    return getRecommendedNodes(availableNodes, nodes, completedNodes);
  }, [availableNodes, nodes, completedNodes]);

  // 경로 탐색
  const findPathToNode = useCallback((targetNodeId) => {
    if (!targetNodeId) return [];
    
    const queue = [[currentNode || Array.from(availableNodes)[0]]];
    const visited = new Set();
    
    while (queue.length > 0) {
      const path = queue.shift();
      const lastNode = path[path.length - 1];
      
      if (lastNode === targetNodeId) {
        return path;
      }
      
      if (visited.has(lastNode)) continue;
      visited.add(lastNode);
      
      edges.forEach(([fromId, toId]) => {
        if (fromId === lastNode && !visited.has(toId)) {
          queue.push([...path, toId]);
        }
      });
    }
    
    return [];
  }, [currentNode, availableNodes, edges]);

  // 진행 상황 초기화
  const resetProgress = useCallback(() => {
    dispatch(quitRun());
  }, [dispatch]);

  return {
    // 상태
    completedNodes,
    currentNode,
    availableNodes,
    currentLevel: getCurrentLevel(),
    currentFloor,
    nodes,
    edges,
    
    // 액션
    completeNode,
    selectNode: selectNodeAction,
    resetProgress,
    
    // 상태 확인
    isNodeActive,
    isNodeClickable,
    isNodeCompleted,
    isNodeCurrent,
    
    // 유틸리티
    getProgressStats,
    getRecommendations,
    findPathToNode
  };
};

export default useProgressionSystem;