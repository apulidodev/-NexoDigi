"use client";

import { useCallback, useEffect, useState } from "react";
import type { Digimon } from "@/features/digimon/domain/digimon";
import { applyDamage, createFighter, damage, type BattleAction, type BattleOutcome, type DigitalRun, type RewardKind, type RunFighter } from "@/features/digital-run/domain/digital-run";

const runKey = "nexodigi-digital-run";
const recordKey = "nexodigi-digital-run-record";
const enemyIds = [1, 3, 34, 83, 183, 202, 336];

type RunRecord = { bestNode: number; wins: number };

function readRecord(): RunRecord {
  try { return JSON.parse(window.localStorage.getItem(recordKey) ?? "{\"bestNode\":0,\"wins\":0}") as RunRecord; } catch { return { bestNode: 0, wins: 0 }; }
}

export function useDigitalRun() {
  const [run, setRun] = useState<DigitalRun | null>(null);
  const [record, setRecord] = useState<RunRecord>({ bestNode: 0, wins: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setRun(JSON.parse(window.localStorage.getItem(runKey) ?? "null") as DigitalRun | null); } catch { setRun(null); }
      setRecord(readRecord());
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const commit = useCallback((next: DigitalRun | null) => {
    setRun(next);
    if (next) window.localStorage.setItem(runKey, JSON.stringify(next));
    else window.localStorage.removeItem(runKey);
  }, []);

  const start = useCallback((partner: Digimon, enemy: Digimon) => {
    commit({ node: 1, status: "battle", player: createFighter(partner), enemy: createFighter(enemy), log: "Una señal hostil bloquea la ruta.", modules: 0, startedAt: new Date().toISOString() });
  }, [commit]);

  const fight = useCallback((action: BattleAction): BattleOutcome | null => {
    if (!run || run.status !== "battle") return null;
    const playerShield = action === "guard" ? 8 + run.modules * 2 : 0;
    const preparedPlayer = { ...run.player, shield: run.player.shield + playerShield };
    const playerDamage = damage(preparedPlayer, run.enemy, action);
    const damagedEnemy = applyDamage(run.enemy, playerDamage);
    if (damagedEnemy.hp === 0) {
      commit({ ...run, player: preparedPlayer, enemy: damagedEnemy, status: run.node === 5 ? "complete" : "reward", log: run.node === 5 ? "El Rift se estabilizó. La ruta ha sido conquistada." : "Señal neutralizada. Elige una mejora." });
      return { playerDamage, enemyDamage: 0, enemyDefeated: true, playerDefeated: false, guarded: action === "guard" };
    }
    const enemyDamage = damage(damagedEnemy, preparedPlayer, "pulse");
    const damagedPlayer = applyDamage(preparedPlayer, enemyDamage);
    if (damagedPlayer.hp === 0) {
      const nextRecord = { bestNode: Math.max(record.bestNode, run.node), wins: record.wins };
      window.localStorage.setItem(recordKey, JSON.stringify(nextRecord));
      setRecord(nextRecord);
      commit({ ...run, player: damagedPlayer, enemy: damagedEnemy, status: "game-over", log: "La señal dispersó la energía del Digivice." });
      return { playerDamage, enemyDamage, enemyDefeated: false, playerDefeated: true, guarded: action === "guard" };
    }
    commit({ ...run, player: damagedPlayer, enemy: damagedEnemy, log: action === "guard" ? "El escudo absorbió parte de la descarga." : `Intercambio de energía: ${playerDamage} / ${enemyDamage}.` });
    return { playerDamage, enemyDamage, enemyDefeated: false, playerDefeated: false, guarded: action === "guard" };
  }, [commit, record.bestNode, record.wins, run]);

  const reward = useCallback((kind: RewardKind, evolved?: Digimon) => {
    if (!run || run.status !== "reward") return;
    let player: RunFighter = run.player;
    let modules = run.modules;
    if (kind === "heal") player = { ...player, hp: Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.35)) };
    if (kind === "module") { modules += 1; player = { ...player, power: player.power + 3, shield: player.shield + 3 }; }
    if (kind === "evolution" && evolved) {
      const healthRatio = player.hp / player.maxHp;
      const evolvedFighter = createFighter(evolved, modules * 3, modules * 4);
      player = { ...evolvedFighter, hp: Math.max(1, Math.round(evolvedFighter.maxHp * healthRatio)) };
    }
    commit({ ...run, player, modules, status: "battle", node: run.node + 1, log: "Nueva señal localizada. Prepárate para el siguiente encuentro." });
  }, [commit, run]);

  const setEnemy = useCallback((enemy: Digimon) => {
    if (!run || run.status !== "battle" || run.node === 1) return;
    const strength = run.node === 5 ? 9 : Math.max(0, run.node - 1) * 2;
    const fighter = createFighter(enemy, strength, strength * 2);
    commit({ ...run, enemy: fighter });
  }, [commit, run]);

  const finish = useCallback(() => {
    if (!run || run.status !== "complete") return;
    const nextRecord = { bestNode: Math.max(record.bestNode, 5), wins: record.wins + 1 };
    window.localStorage.setItem(recordKey, JSON.stringify(nextRecord));
    setRecord(nextRecord);
    commit(null);
  }, [commit, record.bestNode, record.wins, run]);

  const reset = useCallback(() => commit(null), [commit]);
  const getEnemyId = useCallback(() => enemyIds[Math.floor(Math.random() * enemyIds.length)], []);

  return { run, record, isReady, start, fight, reward, setEnemy, finish, reset, getEnemyId };
}