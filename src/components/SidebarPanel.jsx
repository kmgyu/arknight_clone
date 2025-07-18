import React from 'react';

function SidebarPanel({ node, onClose }) {
  if (!node) return null;

  return (
    <div className={`sidebar-panel ${node ? 'open' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{node.label}</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">유형</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            node.type === 'COMBAT' ? 'bg-gray-600 text-white' :
            node.type === 'ENCOUNTER' ? 'bg-blue-600 text-white' :
            node.type === 'EMERGENCY' ? 'bg-red-600 text-white' :
            'bg-green-600 text-white'
          }`}>
            {node.type}
          </span>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">레벨</h3>
          <p className="text-lg font-mono">{node.level}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">설명</h3>
          <p className="text-gray-100 leading-relaxed">
            {node.type === 'COMBAT' && '전투 작전을 수행하는 단계입니다.'}
            {node.type === 'ENCOUNTER' && '예상치 못한 상황과 조우하는 단계입니다.'}
            {node.type === 'EMERGENCY' && '긴급 상황에 대응하는 단계입니다.'}
            {node.type === 'ROLL' && '막간의 여흥이나 휴식을 취하는 단계입니다.'}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">노드 ID</h3>
          <code className="text-sm bg-gray-700 px-2 py-1 rounded">{node.id}</code>
        </div>
      </div>
    </div>
  );
}

export default SidebarPanel;