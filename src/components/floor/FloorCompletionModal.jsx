import React from 'react';
import { Crown, CheckCircle, ArrowRight } from 'lucide-react';

function FloorCompletionModal({ 
  isOpen, 
  onClose, 
  completedFloor, 
  nextFloor, 
  isLastFloor = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-yellow-400 rounded-lg p-8 max-w-md mx-4 text-center animate-pulse">
        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Crown className="w-16 h-16 text-yellow-400" />
            <CheckCircle className="w-8 h-8 text-green-400 absolute -bottom-2 -right-2" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">
          🎉 Floor {completedFloor} 완료!
        </h2>

        {/* 메시지 */}
        <div className="text-gray-300 mb-6">
          {isLastFloor ? (
            <div>
              <p className="text-lg font-semibold text-green-400 mb-2">
                🏆 모든 Floor를 클리어했습니다!
              </p>
              <p className="text-sm">
                게임을 완전히 완료했습니다. 축하합니다!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-blue-400 mb-2">
                Floor {nextFloor}로 진행합니다!
              </p>
              <p className="text-sm">
                새로운 도전이 기다리고 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 진행 표시 */}
        {!isLastFloor && (
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{nextFloor}</span>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          {isLastFloor ? '게임 완료' : '계속하기'}
        </button>
      </div>
    </div>
  );
}

export default FloorCompletionModal;
