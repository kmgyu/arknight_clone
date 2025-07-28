import { useMemo } from 'react';
import Encounter1 from './Encounter1';
// import Mission2 from './Mission2';

const encounters = [Encounter1];

function Encounter() {
  const Selected = useMemo(() => {
    const idx = Math.floor(Math.random() * encounters.length);
    return encounters[idx];
  }, []);

  return <Selected />;
}

export default Encounter;
