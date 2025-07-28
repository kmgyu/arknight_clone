import Combat from '@/components/floor/nodes/combat/Combat';
import Encounter from '@/components/floor/nodes/encounter/Encounter';
import Boss from '@/components/floor/nodes/boss/Boss';
import Emergency from '@/components/floor/nodes/Emergency/Emergency';
import Roll from '@/components/floor/nodes/roll/Roll';
import Safe from '@/components/floor/nodes/safe/Combat';

export default function getNodeContentComponent(type) {
  const map = {
    'COMBAT': Combat,
    'ENCOUNTER': Encounter,
    'EMERGENCY': Emergency,
    'ROLL': Roll,
    'SAFE': Safe,
    'BOSS': Boss,
  };

  return map[type] || null;
}
