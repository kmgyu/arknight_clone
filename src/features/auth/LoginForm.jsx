import React from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../stores/slices/authSlice';

function LoginForm() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(login({ username: 'tester' }));
  };

  return (
    <button onClick={handleLogin}>로그인</button>
  );
}

export default LoginForm;
