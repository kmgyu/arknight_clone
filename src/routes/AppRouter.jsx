// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Scenario from '../pages/Scenario';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/scenario" element={<Scenario />} />
      {/* 여기에 다른 페이지 라우트 추가 가능 */}
    </Routes>
  );
}

export default AppRouter;
