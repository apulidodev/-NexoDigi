export type RiftAction = "pulse" | "technique" | "guard";
export type RiftState = { seed: string; node: number; playerHp: number; playerEnergy: number; enemyHp: number; actionCount: number; status: "active" | "completed" | "failed"; score: number };

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) { result ^= value.charCodeAt(index); result = Math.imul(result, 16777619); }
  return result >>> 0;
}

export function enemyMaxHp(seed: string, node: number) { return 48 + node * 26 + (hash(`${seed}:enemy:${node}`) % 18); }

export function resolveRiftAction(state: RiftState, action: RiftAction) {
  const turn = state.actionCount + 1;
  const variance = hash(`${state.seed}:${state.node}:${turn}:${action}`);
  if (action === "technique" && state.playerEnergy < 30) return { error: "Energía insuficiente para técnica." } as const;
  let playerEnergy = state.playerEnergy;
  let enemyHp = state.enemyHp;
  let playerDamage = 0;
  if (action === "pulse") { enemyHp = Math.max(0, enemyHp - (16 + (variance % 7))); playerEnergy = Math.min(100, playerEnergy + 10); }
  if (action === "technique") { enemyHp = Math.max(0, enemyHp - (34 + (variance % 12))); playerEnergy -= 30; }
  if (action === "guard") playerEnergy = Math.min(100, playerEnergy + 18);
  if (enemyHp > 0) { const baseDamage = 9 + (hash(`${state.seed}:${state.node}:${turn}:counter`) % 10); playerDamage = action === "guard" ? Math.ceil(baseDamage / 2) : baseDamage; }
  const playerHp = Math.max(0, state.playerHp - playerDamage);
  const actionCount = turn;
  if (playerHp === 0) return { state: { ...state, playerHp, playerEnergy, enemyHp, actionCount, status: "failed" as const }, playerDamage, enemyDamage: state.enemyHp - enemyHp, enemyDefeated: false, completed: false };
  if (enemyHp > 0) return { state: { ...state, playerHp, playerEnergy, enemyHp, actionCount }, playerDamage, enemyDamage: state.enemyHp - enemyHp, enemyDefeated: false, completed: false };
  if (state.node === 5) { const score = 500 + playerHp * 5 + playerEnergy - actionCount * 3; return { state: { ...state, playerHp, playerEnergy, enemyHp: 0, actionCount, status: "completed" as const, score: Math.max(0, score) }, playerDamage, enemyDamage: state.enemyHp, enemyDefeated: true, completed: true }; }
  const nextNode = state.node + 1;
  return { state: { ...state, node: nextNode, playerHp: Math.min(100, playerHp + 12), playerEnergy, enemyHp: enemyMaxHp(state.seed, nextNode), actionCount }, playerDamage, enemyDamage: state.enemyHp, enemyDefeated: true, completed: false };
}