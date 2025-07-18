// src/components/UserInfo.jsx
import { useSelector } from 'react-redux';

function UserInfo() {
  const user = useSelector((state) => state.auth.user);

  return user ? <div>환영합니다, {user.username}님!</div> : <div>로그인해주세요</div>;
}

export default UserInfo;