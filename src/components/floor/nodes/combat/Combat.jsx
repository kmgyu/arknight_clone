import { useMemo } from 'react';
import Combat1 from './Combat1';
// import Mission2 from './Mission2';

const combats = [Combat1];

function Combat() {
  const Selected = useMemo(() => {
    const idx = Math.floor(Math.random() * combats.length);
    return combats[idx];
  }, []);

  return <Selected />;
}

export default Combat;
