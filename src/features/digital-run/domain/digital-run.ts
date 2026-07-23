import type { Digimon } from "@/features/digimon/domain/digimon";

export type RunStatus = "battle" | "reward" | "complete" | "game-over";
export type BattleAction = "pulse" | "technique" | "guard";
export type RewardKind = "heal" | "module" | "evolution";
export type BattleOutcome = {
  playerDamage: number;
  enemyDamage: number;
  enemyDefeated: boolean;
  playerDefeated: boolean;
  guarded: boolean;
};

export type RunFighter = {
  id: number;
  name: string;
  image?: string;
  level: string;
  attribute: string;
  type: string;
  skills: string[];
  nextEvolutions: Digimon["nextEvolutions"];
  hp: number;
  maxHp: number;
  power: number;
  defense: number;
  shield: number;
};

export type DigitalRun = {
  node: number;
  status: RunStatus;
  player: RunFighter;
  enemy: RunFighter;
  log: string;
  modules: number;
  startedAt: string;
};

const levelPower: Record<string, number> = {
  "Baby I": 7,
  "Baby II": 9,
  Child: 12,
  Adult: 16,
  Perfect: 21,
  Ultimate: 27,
  Armor: 18,
  Hybrid: 20,
};

const advantage: Record<string, string> = { Vaccine: "Virus", Virus: "Data", Data: "Vaccine" };

export function createFighter(digimon: Digimon, bonusPower = 0, bonusHp = 0): RunFighter {
  const base = levelPower[digimon.level] ?? 12;
  return {
    id: digimon.id,
    name: digimon.name,
    image: digimon.image,
    level: digimon.level,
    attribute: digimon.attribute,
    type: digimon.type,
    skills: digimon.skills,
    nextEvolutions: digimon.nextEvolutions,
    hp: 52 + base * 4 + bonusHp,
    maxHp: 52 + base * 4 + bonusHp,
    power: base + bonusPower,
    defense: Math.max(3, Math.round(base * 0.48)),
    shield: 0,
  };
}

export function damage(attacker: RunFighter, defender: RunFighter, action: BattleAction) {
  const actionMultiplier = action === "technique" ? 1.35 : action === "guard" ? 0.4 : 1;
  const affinity = advantage[attacker.attribute] === defender.attribute ? 1.25 : 1;
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(2, Math.round((attacker.power * actionMultiplier * affinity * variance) - defender.defense * 0.4));
}

export function applyDamage(fighter: RunFighter, amount: number) {
  const absorbed = Math.min(fighter.shield, amount);
  return { ...fighter, shield: fighter.shield - absorbed, hp: Math.max(0, fighter.hp - (amount - absorbed)) };
}

export function enemyLabel(node: number) { return node === 5 ? "RIFT BOSS" : `SEÑAL HOSTIL · ${String(node).padStart(2, "0")}`; }