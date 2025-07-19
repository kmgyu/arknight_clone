import React from 'react';

function LevelNode({ node, id, onClick, style }) {
  // 노드 타입별 색상 클래스
  const getNodeClasses = (type) => {
    const baseClasses = "flex items-center justify-center text-white border-2 border-gray-400 rounded-md cursor-pointer z-10 font-medium transition-all duration-300 px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis";
    
    switch (type) {
      case 'COMBAT':
        return `${baseClasses} bg-gray-700 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-400/30`;
      case 'ENCOUNTER':
        return `${baseClasses} bg-sky-400 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-400/30`;
      case 'EMERGENCY':
        return `${baseClasses} bg-red-800 hover:border-red-400 hover:shadow-lg hover:shadow-red-400/30`;
      case 'ROLL':
        return `${baseClasses} bg-green-700 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/30`;
      case 'SAFE':
        return `${baseClasses} bg-blue-600 hover:border-blue-400 hover:shadow-lg hover:shadow-green-400/30`;
      default:
        return `${baseClasses} bg-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/30`;
    }
  };

  return (
    <div
      id={id}
      className={getNodeClasses(node.type)}
      onClick={onClick}
      style={style}
    >
      {node.label}
    </div>
  );
}

export default LevelNode;