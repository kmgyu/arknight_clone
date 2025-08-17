import { useState, useEffect, useCallback } from 'react';
import { saveProgress, loadProgress, validateNodeAccess, getRecommendedNodes } from '@/utils/graphGenerator';

/**
 * 레벨 진행 시스템 관리 훅
 * @param {Array} nodes - 그래프 노드 배열
 * @param {Array} edges - 그래프 엣지 배열
 * @param {Object} options - 옵션 설정
 * @returns {Object} 진행 시스템 상태와 메서드들
 */
export const useProgressionSystem = (nodes, edges, options = {}) => {
  const {
    autoSave = true,
    autoLoad = true,
    onNodeComplete = null,
    onNodeSelect = null,
    onProgressChange = null
  } = options;

  // 상태 관리
  const [completedNodes, setCompletedNodes] = useState(new Set());
  const [currentNode, setCurrentNode] = useState(null);
  const [availableNodes, setAvailableNodes] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // 초기 로드
  useEffect(() => {
    if (autoLoad) {
      const { completedNodes: saved, currentNode: savedCurrent } = loadProgress();
      if (saved.size > 0) {
        setCompletedNodes(saved);
        setCurrentNode(savedCurrent);
      }
    }
  }, [autoLoad]);

  // 현재 진행 중인 레벨 계산
  const getCurrentLevel = useCallback(() => {
    if (completedNodes.size === 0) return 0;
    
    const completedLevels = Array.from(completedNodes)
      .map(nodeId => nodes.find(n => n.id === nodeId)?.level)
      .filter(level => level !== undefined);
    
    return completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 0;
  }, [completedNodes, nodes]);

  // 사용 가능한 노드 계산 (현재 레벨의 노드들만)
  const updateAvailableNodes = useCallback(() => {
    const available = new Set();
    const currentLevelNum = getCurrentLevel();
    
    // 현재 레벨의 모든 노드가 사용 가능
    nodes
      .filter(node => node.level === currentLevelNum)
      .forEach(node => available.add(node.id));

    setAvailableNodes(available);
  }, [nodes, getCurrentLevel]);

  // 사용 가능한 노드 업데이트
  useEffect(() => {
    updateAvailableNodes();
  }, [updateAvailableNodes]);

  // 진행 상황 변경 시 콜백 호출
  useEffect(() => {
    onProgressChange?.({
      completedNodes,
      availableNodes,
      currentNode,
      totalNodes: nodes.length,
      completionRate: completedNodes.size / nodes.length
    });
  }, [completedNodes, availableNodes, currentNode, nodes.length, onProgressChange]);

  // 자동 저장
  useEffect(() => {
    if (autoSave && completedNodes.size > 0) {
      saveProgress(completedNodes, currentNode);
    }
  }, [completedNodes, currentNode, autoSave]);

  // 노드 완료 처리
  const completeNode = useCallback((nodeId) => {
    if (!nodes.find(n => n.id === nodeId)) {
      console.error(`노드 ID ${nodeId}를 찾을 수 없습니다.`);
      return false;
    }

    if (completedNodes.has(nodeId)) {
      console.warn(`노드 ${nodeId}는 이미 완료되었습니다.`);
      return false;
    }

    const node = nodes.find(n => n.id === nodeId);
    const isBossNode = node?.type === 'BOSS';

    setCompletedNodes(prev => {
      const newCompleted = new Set([...prev, nodeId]);
      onNodeComplete?.(nodeId, newCompleted, isBossNode);
      return newCompleted;
    });

    return true;
  }, [nodes, completedNodes, onNodeComplete]);

  // 노드 선택 처리
  const selectNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error(`노드 ID ${nodeId}를 찾을 수 없습니다.`);
      return false;
    }

    if (!validateNodeAccess(nodeId, completedNodes, availableNodes, nodes)) {
      console.warn(`노드 ${nodeId}에 접근할 수 없습니다.`);
      return false;
    }

    setCurrentNode(nodeId);
    onNodeSelect?.(node);
    return true;
  }, [nodes, completedNodes, availableNodes, onNodeSelect]);

  // 노드 상태 확인 함수들
  const isNodeActive = useCallback((nodeId) => {
    // 현재 레벨(플레이 가능한 레벨)의 노드들만 색상 활성화
    return availableNodes.has(nodeId);
  }, [availableNodes]);

  const isNodeClickable = useCallback((nodeId) => {
    // 현재 레벨의 노드들만 클릭 가능
    return availableNodes.has(nodeId);
  }, [availableNodes]);

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
    
    return {
      totalNodes,
      completed,
      available,
      locked,
      completionRate: completed / totalNodes,
      bossNodes: bossNodes.length,
      bossCompleted,
      isGameComplete: bossCompleted === bossNodes.length
    };
  }, [nodes, completedNodes, availableNodes]);

  // 추천 노드 가져오기
  const getRecommendations = useCallback(() => {
    return getRecommendedNodes(availableNodes, nodes, completedNodes);
  }, [availableNodes, nodes, completedNodes]);

  // 경로 찾기
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
    
    return []; // 경로 없음
  }, [currentNode, availableNodes, edges]);

  // 진행 상황 초기화
  const resetProgress = useCallback(() => {
    setCompletedNodes(new Set());
    setCurrentNode(null);
    setAvailableNodes(new Set());
    
    if (autoSave) {
      localStorage.removeItem('level_progress');
    }
  }, [autoSave]);

  // 특정 레벨까지의 진행 상황 설정 (디버그/치트 용도)
  const setProgressToLevel = useCallback((level) => {
    const nodesToComplete = nodes
      .filter(n => n.level < level)
      .map(n => n.id);
    
    setCompletedNodes(new Set(nodesToComplete));
  }, [nodes]);

  return {
    // 상태
    completedNodes,
    currentNode,
    availableNodes,
    isLoading,
    currentLevel: getCurrentLevel(),
    
    // 액션
    completeNode,
    selectNode,
    setCurrentNode,
    resetProgress,
    setProgressToLevel,
    
    // 상태 확인
    isNodeActive,
    isNodeClickable,
    isNodeCompleted,
    isNodeCurrent,
    
    // 유틸리티
    getProgressStats,
    getRecommendations,
    findPathToNode,
    updateAvailableNodes
  };
};

export default useProgressionSystem;