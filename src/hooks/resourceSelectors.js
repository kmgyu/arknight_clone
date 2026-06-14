export const selectUserResources = (state) => ({
  historyRemake: state.meta?.historyRemake || 0,
  mythFragments: state.meta?.mythFragments || 0,
});

export const selectGameResources = (state) => ({
  horn: state.run?.horn || 0,
  hope: state.run?.hope || 0,
  deployable: state.run?.lifePoints || 0, // 목숨을 배치 가능 인원 자리에 매핑
  toilLimit: 4,
  toil: state.run?.recruitedOperators?.length || 0,
});
