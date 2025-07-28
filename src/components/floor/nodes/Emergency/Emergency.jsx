import { useMemo } from 'react';
import Emergency1 from './Emergency1';
// import Mission2 from './Mission2';

const emergencys = [Emergency1];

function Emergency() {
  const Selected = useMemo(() => {
    const idx = Math.floor(Math.random() * emergencys.length);
    return emergencys[idx];
  }, []);

  return <Selected />;
}

export default Emergency;
