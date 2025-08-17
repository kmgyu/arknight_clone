import React from 'react';
import { Crown, Trophy, RotateCcw } from 'lucide-react';

const CompletionModal = ({ 
  isOpen, 
  onClose, 
  onRestart, 
  completedNodes, 
  totalNodes,
  completionTime 
}) => {
  if (!isOpen) return null;

  const completionRate = Math.round((completedNodes / totalNodes) * 100);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-purple-500/30 shadow-2xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4">
            <Crown size={40} className="text-yellow-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">축하합니다!</h2>
          <p className="text-purple-200">보스를 처치하고 층을 완주했습니다!</p>
        </div>

        {/* 통계 */}
        <div className="bg-black/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-3">
            <Trophy size={20} className="text-yellow-400 mr-2" />
            <span className="text-lg font-semibold text-white">완주 통계</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-200">
              <span>완료한 노드:</span>
              <span className="text-green-400 font-bold">{completedNodes}/{totalNodes}</span>
            </div>
            <div className="flex justify-between text-gray-200">
              <span>완료율:</span>
              <span className="text-blue-400 font-bold">{completionRate}%</span>
            </div>
            {completionTime && (
              <div className="flex justify-between text-gray-200">
                <span>소요 시간:</span>
                <span className="text-purple-400 font-bold">{completionTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw size={18} />
            새 층 시작하기
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            계속 보기
          </button>
        </div>

        {/* 장식 요소 */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute top-6 right-6 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
};

export default CompletionModal;