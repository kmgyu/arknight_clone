import { useMemo } from 'react';
import Roll1 from './Roll1';
// import Mission2 from './Mission2';

const rolls = [Roll1];

function Roll() {
  const Selected = useMemo(() => {
    const idx = Math.floor(Math.random() * rolls.length);
    return rolls[idx];
  }, []);

  return <Selected />;
}

export default Roll;
