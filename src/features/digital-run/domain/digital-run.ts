import type { Digimon } from "@/features/digimon/domain/digimon";

export type RunStatus = "battle" | "reward" | "complete" | "game-over";
export type BattleAction = "pulse" | "technique" | "guard";
export type RewardKind = "heal" | "module" | "evolution";
export type AttackStyle = "flame" | "frost" | "electric" | "nature" | "data" | "virus" | "sonic";
export type AttackProfile = { name: string; style: AttackStyle; description: string };
export type BattleOutcome = {
  playerDamage: number;
  enemyDamage: number;
  enemyDefeated: boolean;
  playerDefeated: boolean;
  guarded: boolean;
  critical: boolean;
  timingLabel?: "PERFECT" | "GOOD" | "NORMAL";
  playerAttack: AttackProfile;
  enemyAttack?: AttackProfile;
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
  energy: number;
  maxEnergy: number;
  techniqueCooldown: number;
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
  "Baby I": 7, "Baby II": 9, Child: 12, Adult: 16, Perfect: 21, Ultimate: 27, Armor: 18, Hybrid: 20,
};
const advantage: Record<string, string> = { Vaccine: "Virus", Virus: "Data", Data: "Vaccine" };
const signatureProfiles: Record<string, AttackProfile> = {
  agumon: { name: "Baby Flame", style: "flame", description: "Llama compacta de corto alcance" },
  gabumon: { name: "Blue Blaster", style: "frost", description: "Ráfaga helada de datos" },
  patamon: { name: "Boom Bubble", style: "sonic", description: "Burbuja de choque" },
  gatomon: { name: "Lightning Paw", style: "electric", description: "Garra electrificada" },
  tentomon: { name: "Super Shocker", style: "electric", description: "Descarga de alto voltaje" },
  palmon: { name: "Poison Ivy", style: "nature", description: "Enredadera corrosiva" },
  gomamon: { name: "Marching Fishes", style: "frost", description: "Oleada de peces de hielo" },
  veemon: { name: "Vee Headbutt", style: "sonic", description: "Impacto de avanzada" },
  guilmon: { name: "Pyro Sphere", style: "flame", description: "Esfera ígnea comprimida" },
  terriermon: { name: "Bunny Blast", style: "data", description: "Pulso de energía digital" },
  renamon: { name: "Diamond Storm", style: "nature", description: "Tormenta de hojas cortantes" },
};
const attributeStyles: Record<string, AttackStyle> = { Vaccine: "data", Virus: "virus", Data: "electric", Free: "sonic", Variable: "nature" };

export function resolveAttackProfile(fighter: Pick<RunFighter, "name" | "skills" | "attribute" | "type">): AttackProfile {
  const signature = signatureProfiles[fighter.name.toLowerCase()];
  if (signature) return signature;
  const skill = fighter.skills[0]?.trim();
  const style = fighter.type.toLowerCase().includes("plant") ? "nature" : attributeStyles[fighter.attribute] ?? "data";
  return { name: skill || `${fighter.attribute} Pulse`, style, description: skill ? "Técnica registrada por DAPI" : "Pulso adaptado al atributo" };
}

export function pulseProfile(fighter: Pick<RunFighter, "attribute" | "type" | "skills" | "name">): AttackProfile {
  return { name: "Pulso digital", style: attributeStyles[fighter.attribute] ?? "data", description: "Descarga estable del Digivice" };
}

export function createFighter(digimon: Digimon, bonusPower = 0, bonusHp = 0): RunFighter {
  const base = levelPower[digimon.level] ?? 12;
  return { id: digimon.id, name: digimon.name, image: digimon.image, level: digimon.level, attribute: digimon.attribute, type: digimon.type, skills: digimon.skills, nextEvolutions: digimon.nextEvolutions, hp: 52 + base * 4 + bonusHp, maxHp: 52 + base * 4 + bonusHp, power: base + bonusPower, defense: Math.max(3, Math.round(base * 0.48)), shield: 0, energy: 55, maxEnergy: 100, techniqueCooldown: 0 };
}

export function damage(attacker: RunFighter, defender: RunFighter, action: BattleAction, timingMultiplier = 1) {
  const actionMultiplier = action === "technique" ? 1.35 : action === "guard" ? 0.4 : 1;
  const affinity = advantage[attacker.attribute] === defender.attribute ? 1.25 : 1;
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(2, Math.round((attacker.power * actionMultiplier * affinity * timingMultiplier * variance) - defender.defense * 0.4));
}

export function applyDamage(fighter: RunFighter, amount: number) {
  const absorbed = Math.min(fighter.shield, amount);
  return { ...fighter, shield: fighter.shield - absorbed, hp: Math.max(0, fighter.hp - (amount - absorbed)) };
}

export function enemyLabel(node: number) { return node === 5 ? "RIFT BOSS" : `SEÑAL HOSTIL · ${String(node).padStart(2, "0")}`; }