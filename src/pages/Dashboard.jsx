// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">대시보드</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="mb-4 text-gray-700">
          명일방주 통합전략의 클론코딩 프로젝트입니다.
        </p>

        <button
          onClick={() => navigate('/scenario')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          스테이지 보기
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
