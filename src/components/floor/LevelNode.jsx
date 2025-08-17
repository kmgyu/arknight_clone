import React from 'react';
import { Check, Lock, Crown, Sword, Users, AlertTriangle, Dice6, Shield } from 'lucide-react';

function LevelNode({ 
  node, 
  id, 
  onClick, 
  style, 
  isActive = true, 
  isCompleted = false, 
  isClickable = true, 
  isCurrent = false 
}) {
  
  // 노드 타입별 아이콘 반환
  const getNodeIcon = (type) => {
    const iconProps = { size: 16, className: "mr-2" };
    
    switch (type) {
      case 'COMBAT':
        return <Sword {...iconProps} />;
      case 'ENCOUNTER':
        return <Users {...iconProps} />;
      case 'EMERGENCY':
        return <AlertTriangle {...iconProps} />;
      case 'ROLL':
        return <Dice6 {...iconProps} />;
      case 'SAFE':
        return <Shield {...iconProps} />;
      case 'BOSS':
        return <Crown {...iconProps} />;
      default:
        return <Sword {...iconProps} />;
    }
  };

  // 노드 상태별 스타일 클래스 반환
  const getNodeClasses = (type, isActive, isCompleted, isClickable, isCurrent) => {
    const baseClasses = "flex items-center justify-center text-white border-2 rounded-md font-medium transition-all duration-300 px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis relative";
    
    // 완료된 노드 스타일
    if (isCompleted) {
      return `${baseClasses} bg-green-600 border-green-400 shadow-lg shadow-green-400/30 cursor-pointer`;
    }
    
    // 현재 선택된 노드 스타일
    if (isCurrent) {
      return `${baseClasses} bg-yellow-500 border-yellow-300 shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-300 cursor-pointer animate-pulse`;
    }
    
    // 클릭 가능한 노드 스타일
    if (isClickable && isActive) {
      switch (type) {
        case 'COMBAT':
          return `${baseClasses} bg-gray-700 border-gray-400 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-400/30 cursor-pointer hover:scale-105`;
        case 'ENCOUNTER':
          return `${baseClasses} bg-sky-600 border-sky-400 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-400/30 cursor-pointer hover:scale-105`;
        case 'EMERGENCY':
          return `${baseClasses} bg-red-700 border-red-500 hover:border-red-400 hover:shadow-lg hover:shadow-red-400/30 cursor-pointer hover:scale-105`;
        case 'ROLL':
          return `${baseClasses} bg-green-700 border-green-500 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/30 cursor-pointer hover:scale-105`;
        case 'SAFE':
          return `${baseClasses} bg-blue-600 border-blue-400 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-400/30 cursor-pointer hover:scale-105`;
        case 'BOSS':
          return `${baseClasses} bg-purple-700 border-purple-500 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-400/30 cursor-pointer hover:scale-105`;
        default:
          return `${baseClasses} bg-gray-700 border-gray-400 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/30 cursor-pointer hover:scale-105`;
      }
    }
    
    // 비활성화된 노드 스타일 (보스 노드는 예외)
    if (!isActive || !isClickable) {
      // 보스 노드는 비활성화 상태에서도 색상 유지
      if (type === 'BOSS') {
        return `${baseClasses} bg-purple-700 border-purple-500 opacity-60 cursor-not-allowed`;
      }
      
      // 다른 노드들은 회색 처리
      return `${baseClasses} bg-gray-600 border-gray-500 opacity-60 cursor-not-allowed`;
    }
    
    // 기본 스타일
    return `${baseClasses} bg-gray-700 border-gray-400`;
  };

  // 노드 상태 오버레이 (완료, 잠김 표시)
  const getStatusOverlay = () => {
    if (isCompleted) {
      return (
        <div className="absolute top-1 right-1">
          <Check size={14} className="text-green-200" />
        </div>
      );
    }
    
    if (!isClickable && !isActive && node.type !== 'BOSS') {
      return (
        <div className="absolute top-1 right-1">
          <Lock size={14} className="text-gray-400" />
        </div>
      );
    }
    
    return null;
  };

  // 클릭 핸들러
  const handleClick = () => {
    if (isClickable || isCompleted) {
      onClick?.();
    }
  };

  return (
    <div
      id={id}
      className={getNodeClasses(node.type, isActive, isCompleted, isClickable, isCurrent)}
      onClick={handleClick}
      style={style}
      title={`${node.label} - ${node.type} ${isCompleted ? '(완료)' : isClickable ? '(플레이 가능)' : '(잠김)'}`}
    >
      {/* 노드 아이콘과 라벨 */}
      {getNodeIcon(node.type)}
      <span className="flex-1 text-center">{node.label}</span>
      
      {/* 상태 오버레이 */}
      {getStatusOverlay()}
      
      {/* 현재 노드 표시기 */}
      {isCurrent && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-200 animate-ping"></div>
      )}
    </div>
  );
}

export default LevelNode;