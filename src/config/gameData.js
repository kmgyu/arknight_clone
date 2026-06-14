// src/config/gameData.js

export const CLASSES = {
  VANGUARD: '뱅가드',
  GUARD: '가드',
  DEFENDER: '디펜더',
  SNIPER: '스나이퍼',
  CASTER: '캐스터',
  MEDIC: '메딕'
};

export const OPERATORS = {
  texas: {
    id: 'texas',
    name: '텍사스',
    class: CLASSES.VANGUARD,
    baseStats: {
      hp: 1000,
      maxHp: 1000,
      atk: 320,
      def: 100,
      spd: 7,
      eva: 10
    },
    skills: [
      {
        name: '돌격γ',
        spReq: 10,
        launchRanks: [1, 2, 3, 4],
        targetRanks: [1, 2],
        type: 'attack',
        damageMult: 1.3,
        hits: 1,
        effect: { type: 'gain_hope', value: 2 },
        description: '적에게 1.3배의 물리 피해를 입히고 희망을 2 얻습니다.'
      },
      {
        name: '검우',
        spReq: 24,
        launchRanks: [1, 2, 3],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        type: 'attack',
        damageMult: 1.8,
        hits: 1,
        isArts: true,
        effect: { type: 'stun', duration: 1 },
        description: '모든 적에게 1.8배의 마법 피해를 입히고 1턴간 기절시킵니다.'
      }
    ],
    avatarColor: 'from-amber-600 to-red-800'
  },
  myrtle: {
    id: 'myrtle',
    name: '머틀',
    class: CLASSES.VANGUARD,
    baseStats: {
      hp: 850,
      maxHp: 850,
      atk: 240,
      def: 80,
      spd: 6,
      eva: 5
    },
    skills: [
      {
        name: '신속한 배치',
        spReq: 8,
        launchRanks: [2, 3, 4],
        targetRanks: [1, 2, 3, 4], // 자기 자신 또는 임의
        type: 'sp_gen',
        effect: { type: 'gain_hope', value: 3 },
        description: '아군에게 희망을 3 공급합니다.'
      },
      {
        name: '치유의 날개',
        spReq: 15,
        launchRanks: [2, 3, 4],
        targetRanks: [1, 2, 3, 4],
        type: 'heal',
        healMult: 1.5,
        isAoe: true,
        effect: { type: 'gain_hope', value: 1 },
        description: '모든 아군을 1.5배만큼 치유하고 희망을 1 얻습니다.'
      }
    ],
    avatarColor: 'from-amber-400 to-yellow-600'
  },
  silverash: {
    id: 'silverash',
    name: '실버애쉬',
    class: CLASSES.GUARD,
    baseStats: {
      hp: 1400,
      maxHp: 1400,
      atk: 420,
      def: 140,
      spd: 5,
      eva: 5
    },
    skills: [
      {
        name: '강력한 공격',
        spReq: 5,
        launchRanks: [1, 2],
        targetRanks: [1, 2],
        type: 'attack',
        damageMult: 1.6,
        hits: 1,
        description: '전방 적에게 1.6배의 강한 물리 공격을 합니다.'
      },
      {
        name: '진은참',
        spReq: 32,
        launchRanks: [1, 2, 3],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        type: 'attack',
        damageMult: 2.2,
        hits: 1,
        effect: { type: 'self_debuff', stat: 'def', value: -40, duration: 2 },
        description: '자신의 방어력이 40% 감소하지만 모든 적에게 2.2배의 참격을 날립니다.'
      }
    ],
    avatarColor: 'from-slate-500 to-zinc-700'
  },
  specter: {
    id: 'specter',
    name: '스펙터',
    class: CLASSES.GUARD,
    baseStats: {
      hp: 1600,
      maxHp: 1600,
      atk: 380,
      def: 110,
      spd: 4,
      eva: 5
    },
    skills: [
      {
        name: '육체 재구성',
        spReq: 10,
        launchRanks: [1, 2],
        targetRanks: [1, 2, 3, 4],
        type: 'heal', // 자가 치유
        healMult: 1.2,
        effect: { type: 'self_buff', stat: 'def', value: 30, duration: 2 },
        description: '자신의 체력을 1.2배 회복하고 2턴간 방어력을 30% 증가시킵니다.'
      },
      {
        name: '육체 분쇄',
        spReq: 25,
        launchRanks: [1, 2],
        targetRanks: [1, 2, 3],
        isAoe: true,
        type: 'attack',
        damageMult: 2.0,
        hits: 1,
        effect: { type: 'immortality', duration: 2 },
        description: '전방 3명의 적에게 2.0배의 공격을 가하며, 2턴간 체력이 1 이하로 내려가지 않는 불사 상태가 됩니다.'
      }
    ],
    avatarColor: 'from-zinc-800 to-neutral-950'
  },
  saria: {
    id: 'saria',
    name: '사리아',
    class: CLASSES.DEFENDER,
    baseStats: {
      hp: 2000,
      maxHp: 2000,
      atk: 280,
      def: 220,
      spd: 3,
      eva: 0
    },
    skills: [
      {
        name: '구급',
        spReq: 7,
        launchRanks: [1, 2],
        targetRanks: [1, 2, 3, 4],
        type: 'heal',
        healMult: 1.6,
        description: '가장 체력이 낮은 아군 한 명을 1.6배만큼 치유합니다.'
      },
      {
        name: '칼슘화',
        spReq: 24,
        launchRanks: [1, 2, 3],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        type: 'heal',
        healMult: 0.8,
        effect: { type: 'arts_vulnerability', value: 30, duration: 3 },
        description: '모든 아군을 0.8배 치유하고 3턴간 모든 적이 입는 마법 피해를 30% 증가시킵니다.'
      }
    ],
    avatarColor: 'from-slate-300 to-zinc-500'
  },
  exusiai: {
    id: 'exusiai',
    name: '엑시아',
    class: CLASSES.SNIPER,
    baseStats: {
      hp: 950,
      maxHp: 950,
      atk: 340,
      def: 90,
      spd: 9,
      eva: 15
    },
    skills: [
      {
        name: '부하 사격',
        spReq: 6,
        launchRanks: [3, 4],
        targetRanks: [1, 2, 3, 4],
        type: 'attack',
        damageMult: 0.7,
        hits: 3,
        description: '지정된 적에게 0.7배의 위력으로 3번 연속 공격합니다.'
      },
      {
        name: '과부하 모드',
        spReq: 18,
        launchRanks: [3, 4],
        targetRanks: [1, 2, 3, 4],
        type: 'attack',
        damageMult: 0.75,
        hits: 5,
        description: '지정된 적에게 0.75배의 위력으로 무려 5번 연속 난사합니다.'
      }
    ],
    avatarColor: 'from-red-600 to-red-900'
  },
  eyjafjalla: {
    id: 'eyjafjalla',
    name: '에이야퍄들라',
    class: CLASSES.CASTER,
    baseStats: {
      hp: 1100,
      maxHp: 1100,
      atk: 400,
      def: 95,
      spd: 4,
      eva: 5
    },
    skills: [
      {
        name: '점화',
        spReq: 6,
        launchRanks: [3, 4],
        targetRanks: [1, 2, 3, 4],
        type: 'attack',
        damageMult: 1.5,
        hits: 1,
        isArts: true,
        effect: { type: 'splash_magic_def_shred', value: 20 },
        description: '마법 공격으로 1.5배의 피해를 입히고 주변 적에게 0.7배 폭발 피해 및 마법 저항을 깎습니다.'
      },
      {
        name: '화산',
        spReq: 28,
        launchRanks: [2, 3, 4],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        type: 'attack',
        damageMult: 2.3,
        hits: 1,
        isArts: true,
        description: '화산을 분출해 모든 적에게 2.3배의 광역 마법 피해를 입힙니다.'
      }
    ],
    avatarColor: 'from-rose-400 to-orange-700'
  },
  shining: {
    id: 'shining',
    name: '샤이닝',
    class: CLASSES.MEDIC,
    baseStats: {
      hp: 1050,
      maxHp: 1050,
      atk: 310,
      def: 120,
      spd: 5,
      eva: 5
    },
    skills: [
      {
        name: '신조',
        spReq: 8,
        launchRanks: [3, 4],
        targetRanks: [1, 2, 3, 4],
        type: 'heal',
        healMult: 1.5,
        effect: { type: 'buff_def', value: 40, duration: 2 },
        description: '아군을 1.5배 치유하고 2턴간 대상의 방어력을 40% 증가시킵니다.'
      },
      {
        name: '신조의 결계',
        spReq: 22,
        launchRanks: [3, 4],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        type: 'heal',
        healMult: 1.0,
        effect: { type: 'global_def_sanity', value: 30, sanity: 15, duration: 3 },
        description: '모든 아군을 1.0배 치유하며 방어력을 30% 높이고 정신력을 15 즉시 회복시킵니다.'
      }
    ],
    avatarColor: 'from-slate-100 to-stone-400'
  }
};

export const ENEMIES = {
  soldier: {
    name: '통합운동 일반 보병',
    maxHp: 700,
    atk: 100,
    def: 50,
    spd: 4,
    skills: [
      {
        name: '물리 베기',
        launchRanks: [1, 2],
        targetRanks: [1, 2],
        damageMult: 1.0,
        description: '전방 대원에게 일격을 가합니다.'
      }
    ]
  },
  hound: {
    name: '군용 사냥개',
    maxHp: 450,
    atk: 80,
    def: 20,
    spd: 8,
    skills: [
      {
        name: '물어뜯기',
        launchRanks: [1, 2, 3],
        targetRanks: [1, 2],
        damageMult: 0.9,
        description: '전방 대원을 빠르게 물어뜯습니다.'
      }
    ]
  },
  crusher: {
    name: '살카즈 돌격병',
    maxHp: 1600,
    atk: 160,
    def: 250,
    spd: 2,
    skills: [
      {
        name: '방패 밀치기',
        launchRanks: [1],
        targetRanks: [1],
        damageMult: 1.2,
        effect: { type: 'stun_chance', chance: 30, duration: 1 },
        description: '무거운 방패로 전방 1열의 대원을 밀쳐 30% 확률로 기절시킵니다.'
      }
    ]
  },
  caster: {
    name: '살카즈 주술사',
    maxHp: 900,
    atk: 140,
    def: 60,
    spd: 5,
    skills: [
      {
        name: '오리지늄 번개',
        launchRanks: [2, 3, 4],
        targetRanks: [3, 4], // 후방 저격
        damageMult: 1.1,
        isArts: true,
        effect: { type: 'sanity_drain', value: 10 },
        description: '후방 아군을 마법으로 타격하고 정신력(Sanity)을 10 갉아먹습니다.'
      }
    ]
  },
  // 보스 몬스터들
  boss_crownslayer: {
    name: '크라운슬레이어 (1층 보스)',
    maxHp: 4000,
    atk: 220,
    def: 120,
    spd: 10,
    isBoss: true,
    skills: [
      {
        name: '그림자 돌진',
        launchRanks: [1, 2, 3, 4],
        targetRanks: [3, 4], // 전선 우회!
        damageMult: 1.4,
        description: '전선을 뛰어넘어 후방 아군에게 치명적인 물리 공격을 가합니다.'
      },
      {
        name: '연막 살포',
        launchRanks: [1, 2],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        damageMult: 0.8,
        effect: { type: 'blind', duration: 2 },
        description: '가스를 살포해 모든 대원에게 0.8배 피해를 입히고 2턴간 명중률을 떨어뜨립니다.'
      }
    ]
  },
  boss_patriot: {
    name: '패트리어트 (최종 보스)',
    maxHp: 12000,
    atk: 400,
    def: 450,
    spd: 3,
    isBoss: true,
    skills: [
      {
        name: '부국장 창격',
        launchRanks: [1, 2],
        targetRanks: [1, 2],
        damageMult: 2.0,
        description: '전방 대원에게 파괴적인 창끝을 날려 엄청난 물리 피해를 입힙니다.'
      },
      {
        name: '전쟁의 부름',
        launchRanks: [1, 2, 3, 4],
        targetRanks: [1, 2, 3, 4],
        isAoe: true,
        damageMult: 1.2,
        effect: { type: 'sanity_strike', value: 25 },
        description: '모든 오퍼레이터에게 충격을 주어 1.2배 피해를 입히고 정신력을 25씩 깎습니다.'
      }
    ]
  }
};

export const RELICS = [
  {
    id: 'civilight',
    name: '마왕의 왕관 (Civilight Aeterna)',
    description: '마법 오퍼레이터의 마법 공격 공격력이 25% 상승하고, 시작 희망을 2 얻습니다.',
    effect: { type: 'class_buff', class: CLASSES.CASTER, stat: 'atk_mult', value: 0.25, hope: 2 }
  },
  {
    id: 'gold_coin',
    name: '죽은 자의 금화',
    description: '전투 승리 시 각뿔 획득량이 4 증가합니다.',
    effect: { type: 'gold_bonus', value: 4 }
  },
  {
    id: 'spaghetti',
    name: '미트소스 스파게티',
    description: '메딕의 치유 스킬 사용 시 대상의 정신력을 5 회복합니다.',
    effect: { type: 'heal_sanity_bonus', value: 5 }
  },
  {
    id: 'battery',
    name: '오리지늄 배터리',
    description: '모든 오퍼레이터가 전투 시작 시 SP를 6 가진 상태로 시작합니다.',
    effect: { type: 'starting_sp', value: 6 }
  },
  {
    id: 'rhine_card',
    name: '라인 랩 보안 카드',
    description: '디펜더 오퍼레이터의 최대 체력이 30% 증가합니다.',
    effect: { type: 'class_buff', class: CLASSES.DEFENDER, stat: 'hp_mult', value: 0.3 }
  },
  {
    id: 'sniper_glove',
    name: '전술 저격 장갑',
    description: '스나이퍼 오퍼레이터의 속도가 3 증가하고 물리 공격력이 15% 상승합니다.',
    effect: { type: 'class_buff', class: CLASSES.SNIPER, stat: 'spd_atk', spd: 3, atk_mult: 0.15 }
  },
  {
    id: 'medic_cross',
    name: '구급 의료 상자',
    description: '메딕 오퍼레이터의 치유 효과가 20% 증가합니다.',
    effect: { type: 'class_buff', class: CLASSES.MEDIC, stat: 'heal_mult', value: 0.2 }
  },
  {
    id: 'vanguard_flag',
    name: '돌격대의 깃발',
    description: '뱅가드 오퍼레이터가 적 격퇴 시 체력을 10% 회복합니다.',
    effect: { type: 'class_kill_heal', class: CLASSES.VANGUARD, value: 0.1 }
  },
  {
    id: 'guard_sharpener',
    name: '가드용 연마석',
    description: '가드 오퍼레이터의 방어 관통률이 20% 적용됩니다. (적의 방어력 20% 무시)',
    effect: { type: 'class_buff', class: CLASSES.GUARD, stat: 'def_pierce', value: 0.2 }
  },
  {
    id: 'shattering_crystal',
    name: '균열의 오리지늄 결정',
    description: '전투 중 적에게 입히는 기절 지속시간이 1턴 증가합니다.',
    effect: { type: 'stun_extension', value: 1 }
  }
];

export const UPGRADES = [
  {
    id: 'hp_boost',
    name: '생명력 강화',
    cost: 5,
    description: '모든 탐사에서 시작 목숨(Life Points) 수치를 2 증가시킵니다.',
    effect: { maxLife: 2 }
  },
  {
    id: 'horn_boost',
    name: '자금 확보',
    cost: 4,
    description: '모든 탐사 시작 시 보유 각뿔을 15 추가 지급받습니다.',
    effect: { startingHorn: 15 }
  },
  {
    id: 'hope_boost',
    name: '원정 희망',
    cost: 6,
    description: '모든 탐사 시작 시 보유 희망을 3 추가 지급받습니다.',
    effect: { startingHope: 3 }
  },
  {
    id: 'sanity_shield',
    name: '정신력 장벽',
    cost: 8,
    description: '전투 중 대원들이 받는 정신력 피해가 15% 감소합니다.',
    effect: { sanity_resist: 0.15 }
  },
  {
    id: 'dmg_boost',
    name: '전술 교육',
    cost: 7,
    description: '모든 아군 오퍼레이터의 피해량이 10% 증가합니다.',
    effect: { global_damage: 0.1 }
  },
  {
    id: 'defense_boost',
    name: '장갑 보강',
    cost: 7,
    description: '모든 아군 오퍼레이터의 방어력이 15% 증가합니다.',
    effect: { global_defense: 0.15 }
  }
];
