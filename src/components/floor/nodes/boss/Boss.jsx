import { useMemo } from 'react';
import Boss1 from './Boss1';
// import Mission2 from './Mission2';

const bosses = [Boss1];

function Boss() {
  const Selected = useMemo(() => {
    const idx = Math.floor(Math.random() * bosses.length);
    return bosses[idx];
  }, []);

  return <Selected />;
}

export default Boss;
