"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AttackSequence, EvolutionOverlay, ModuleOrbit, RiftParticles, TimingMeter, useRunSounds } from "@/components/digital-run/run-effects";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import type { Digimon, DigimonSummary } from "@/features/digimon/domain/digimon";
import { enemyLabel, resolveAttackProfile, type AttackProfile, type BattleAction, type BattleOutcome, type RewardKind, type RunFighter } from "@/features/digital-run/domain/digital-run";
import { useDigitalRun } from "@/features/digital-run/presentation/use-digital-run";
import { useTamerData } from "@/features/tamer/presentation/use-tamer-data";

type CombatEffects = { player: "idle" | "attack" | "hit" | "guard"; enemy: "idle" | "attack" | "hit"; playerDamage?: number; enemyDamage?: number };
type AttackScene = { attack: AttackProfile; direction: "player" | "enemy"; critical?: boolean; key: number };
const idleEffects: CombatEffects = { player: "idle", enemy: "idle" };
function wait(ms: number) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
async function getDigimon(id: number) { const response = await fetch(`/api/digimon/${id}`); if (!response.ok) throw new Error("Digimon unavailable"); return (await response.json()) as Digimon; }

export function DigitalRunGame() {
  const game = useDigitalRun();
  const tamer = useTamerData();
  const sounds = useRunSounds();
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [partnerOptions, setPartnerOptions] = useState<DigimonSummary[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingEnemy, setIsLoadingEnemy] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [error, setError] = useState("");
  const [combatEffects, setCombatEffects] = useState<CombatEffects>(idleEffects);
  const [attackScene, setAttackScene] = useState<AttackScene | null>(null);
  const [evolutionTarget, setEvolutionTarget] = useState<string | null>(null);
  const run = game.run;

  useEffect(() => {
    void fetch("/api/digimon?page=0&pageSize=8").then((response) => response.ok ? response.json() as Promise<{ content: DigimonSummary[] }> : Promise.reject(new Error("Partner list unavailable"))).then((result) => setPartnerOptions(result.content)).catch(() => setError("No pudimos cargar las señales disponibles.")).finally(() => setIsLoadingPartners(false));
  }, []);

  useEffect(() => {
    if (!run || run.status !== "battle" || run.node === 1 || run.enemy.hp > 0) return;
    const timer = window.setTimeout(() => { setIsLoadingEnemy(true); sounds.play("scan"); void getDigimon(game.getEnemyId()).then(game.setEnemy).catch(() => setError("No pudimos localizar la siguiente señal.")).finally(() => setIsLoadingEnemy(false)); }, 0);
    return () => window.clearTimeout(timer);
  }, [game, run, sounds]);

  async function start() {
    if (!selectedPartnerId) { setError("Elige un compañero antes de entrar al Rift."); return; }
    setError(""); setIsStarting(true);
    try { const [partner, enemy] = await Promise.all([getDigimon(selectedPartnerId), getDigimon(game.getEnemyId())]); game.start(partner, enemy); sounds.play("scan"); }
    catch { setError("No fue posible iniciar la transmisión. Elige otra señal e intenta de nuevo."); }
    finally { setIsStarting(false); }
  }

  function resolveAttack(action: BattleAction, multiplier = 1, timingLabel?: BattleOutcome["timingLabel"]) {
    if (isResolving) return;
    setIsTiming(false); setError(""); setIsResolving(true);
    const playerAttack = run && action === "technique" ? resolveAttackProfile(run.player) : run ? { name: action === "guard" ? "Firewall Guard" : "Pulso digital", style: "data" as const, description: "Protocolo del Digivice" } : null;
    if (!playerAttack) return;
    setCombatEffects({ player: action === "guard" ? "guard" : "attack", enemy: "idle" });
    if (action !== "guard") setAttackScene({ attack: playerAttack, direction: "player", critical: multiplier >= 1.45, key: Date.now() });
    sounds.play(action === "guard" ? "scan" : "attack");
    window.setTimeout(() => {
      const outcome = game.fight(action, multiplier, timingLabel);
      if (!outcome) { setIsResolving(false); return; }
      setCombatEffects({ player: outcome.enemyDamage ? "hit" : action === "guard" ? "guard" : "idle", enemy: "hit", playerDamage: outcome.enemyDamage, enemyDamage: outcome.playerDamage });
      sounds.play(outcome.enemyDefeated ? "win" : "hit");
      if (outcome.enemyAttack && !outcome.enemyDefeated) window.setTimeout(() => { setAttackScene({ attack: outcome.enemyAttack!, direction: "enemy", key: Date.now() + 1 }); setCombatEffects((current) => ({ ...current, enemy: "attack" })); sounds.play("attack"); }, 250);
      window.setTimeout(() => { setCombatEffects(idleEffects); setAttackScene(null); setIsResolving(false); }, outcome.enemyDefeated ? 620 : 1100);
    }, action === "guard" ? 220 : 480);
  }

  function openTechnique() {
    if (!run) return;
    if (run.player.energy < 30) { setError("Necesitas 30 de energía para activar una técnica."); return; }
    if (run.player.techniqueCooldown > 0) { setError(`La técnica se recalibra: ${run.player.techniqueCooldown} turno(s) restante(s).`); return; }
    setError(""); setIsTiming(true);
  }

  async function chooseReward(kind: RewardKind) {
    if (kind !== "evolution") { game.reward(kind); sounds.play(kind === "module" ? "scan" : "win"); return; }
    const evolution = run?.player.nextEvolutions[0];
    if (!evolution) { setError("Tu compañero no tiene una ruta EVO disponible en DAPI."); return; }
    setEvolutionTarget(evolution.name); sounds.play("evolution");
    try { await wait(900); game.reward(kind, await getDigimon(evolution.id)); }
    catch { setError("No pudimos cargar esa evolución."); }
    finally { setEvolutionTarget(null); }
  }

  return <section id="nexorift" className="rift-background relative overflow-hidden bg-[#172539] py-20 text-white"><RiftParticles /><div className="relative"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="min-w-0"><Badge className="!border-white !bg-[#f36d57] !text-white">MINIJUEGO LOCAL</Badge><div className="mt-5 flex min-w-0 items-start gap-2 sm:gap-3"><h2 className="min-w-0 break-words font-mono text-[2rem] font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">NexoRift: Digital Run.</h2><InfoHint className="mt-1" text="Combate por turnos con técnicas de DAPI, sincronización de ataque, energía y efectos locales. El récord se guarda en este navegador." /></div><p className="mt-4 max-w-2xl leading-7 text-white/70">Estabiliza cinco señales hostiles. Sincroniza técnicas, activa módulos y derrota al jefe del Rift.</p></div><div className="w-full rounded-2xl border-2 border-white/30 bg-white/10 px-4 py-3 font-mono text-xs sm:w-auto"><p className="text-white/60">RÉCORD LOCAL</p><p className="mt-1 font-black">Nodo {game.record.bestNode}/5 · {game.record.wins} rutas completadas</p></div><button type="button" onClick={sounds.toggle} className="w-full rounded-xl border-2 border-white/40 bg-white/10 px-3 py-2 font-mono text-[10px] font-black uppercase sm:w-auto">{sounds.isMuted ? "Sonido: off" : "Sonido: on"}</button></div><div className="mt-8 min-w-0 rounded-[2rem] border-2 border-white/80 bg-[#f7f1e7] p-4 text-[#172539] shadow-[6px_6px_0_#f36d57] sm:p-7 sm:shadow-[8px_8px_0_#f36d57]">{!run ? <StartPanel selectedPartnerId={selectedPartnerId} onSelect={setSelectedPartnerId} team={tamer.team} options={partnerOptions} isLoadingPartners={isLoadingPartners} isStarting={isStarting} error={error} onStart={() => void start()} /> : <RunPanel run={run} isLoadingEnemy={isLoadingEnemy} error={error} effects={combatEffects} attackScene={attackScene} evolutionTarget={evolutionTarget} isResolving={isResolving} isTiming={isTiming} onFight={resolveAttack} onOpenTechnique={openTechnique} onCancelTiming={() => setIsTiming(false)} onReward={chooseReward} onFinish={game.finish} onReset={game.reset} />}</div></div></div></section>;
}

function StartPanel({ selectedPartnerId, onSelect, team, options, isLoadingPartners, isStarting, error, onStart }: { selectedPartnerId: number | null; onSelect: (id: number) => void; team: Array<{ id: number; name: string; image?: string }>; options: DigimonSummary[]; isLoadingPartners: boolean; isStarting: boolean; error: string; onStart: () => void }) {
  const choices = Array.from(new Map([...team, ...options].map((digimon) => [digimon.id, digimon])).values());
  return <div className="grid min-w-0 gap-7 lg:grid-cols-[1fr_0.85fr]"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">PROTOCOLO DE ENTRADA</p><h3 className="mt-3 font-mono text-3xl font-black uppercase leading-none">Elige a tu compañero.</h3><p className="mt-4 max-w-lg leading-7 text-[#405065]">Selecciona una señal visual. Si ya formaste un equipo Tamer, sus compañeros aparecen primero.</p>{team.length > 0 && <p className="mt-6 font-mono text-[10px] font-black uppercase tracking-widest text-[#405065]">Tu equipo Tamer</p>}<div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">{choices.map((digimon) => <button key={digimon.id} type="button" onClick={() => onSelect(digimon.id)} className={`group rounded-2xl border-2 p-2 text-center transition-transform hover:-translate-y-1 ${selectedPartnerId === digimon.id ? "border-[#172539] bg-[#fdcc48] shadow-[3px_3px_0_#172539]" : "border-[#172539]/50 bg-white hover:border-[#172539]"}`}><div className="grid h-20 place-items-center rounded-xl bg-[#dcebdc]">{digimon.image ? <Image src={digimon.image} alt={digimon.name} width={66} height={66} unoptimized className="max-h-16 object-contain transition-transform group-hover:scale-110" /> : <span className="font-mono text-[9px]">SIN IMG</span>}</div><p className="mt-2 truncate font-mono text-[10px] font-black uppercase">{digimon.name}</p></button>)}</div>{isLoadingPartners && <p className="mt-3 font-mono text-xs">Buscando señales disponibles...</p>}{!isLoadingPartners && choices.length === 0 && <p className="mt-3 rounded-xl border-2 border-dashed border-[#172539] p-4 text-sm">No hay señales disponibles. Revisa tu conexión a DAPI.</p>}<div className="mt-6"><Button onClick={onStart} disabled={isStarting || selectedPartnerId === null}>{isStarting ? "Sincronizando..." : "Entrar al Rift"}</Button>{error && <p className="mt-3 font-mono text-xs font-black text-[#d85746]">{error}</p>}</div></div><div className="rounded-3xl border-2 border-[#172539] bg-[#dcebdc] p-5"><p className="font-mono text-xs font-black uppercase tracking-widest">Cómo funciona</p><ol className="mt-4 space-y-3 text-sm leading-6"><li><strong>01.</strong> Pulso recupera energía; técnica consume 30 y tiene recalibración.</li><li><strong>02.</strong> Activa una técnica y detén el cursor en el núcleo para lograr GOOD o PERFECT.</li><li><strong>03.</strong> Cada Digimon usa una técnica registrada o una afinidad visual de su atributo.</li><li><strong>04.</strong> El nodo cinco es un jefe reforzado y el récord se conserva localmente.</li></ol></div></div>;
}

function RunPanel({ run, isLoadingEnemy, error, effects, attackScene, evolutionTarget, isResolving, isTiming, onFight, onOpenTechnique, onCancelTiming, onReward, onFinish, onReset }: { run: NonNullable<ReturnType<typeof useDigitalRun>["run"]>; isLoadingEnemy: boolean; error: string; effects: CombatEffects; attackScene: AttackScene | null; evolutionTarget: string | null; isResolving: boolean; isTiming: boolean; onFight: (action: BattleAction, multiplier?: number, label?: BattleOutcome["timingLabel"]) => void; onOpenTechnique: () => void; onCancelTiming: () => void; onReward: (kind: RewardKind) => Promise<void>; onFinish: () => void; onReset: () => void }) {
  const enemyIsLoading = run.status === "battle" && run.node > 1 && run.enemy.hp === 0;
  const technique = resolveAttackProfile(run.player);
  const techniqueUnavailable = run.player.energy < 30 || run.player.techniqueCooldown > 0 || isResolving;
  return <div className="relative"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">{run.status === "battle" ? enemyLabel(run.node) : run.status === "reward" ? "RECOMPENSA DE RIFT" : run.status === "complete" ? "RUTA COMPLETADA" : "TRANSMISIÓN PERDIDA"}</p><h3 className="mt-1 font-mono text-2xl font-black uppercase">Nodo {Math.min(run.node, 5)} / 5</h3></div><div className="flex items-center gap-3"><ModuleOrbit modules={run.modules} /><Button variant="ghost" size="sm" onClick={onReset}>Abandonar</Button></div></div><div className={`relative mt-6 grid gap-5 md:grid-cols-2 ${enemyIsLoading || isLoadingEnemy ? "run-scan-glitch" : ""}`}><FighterCard label="Tu compañero" fighter={run.player} effect={effects.player} floatingDamage={effects.playerDamage} /><FighterCard label={enemyLabel(run.node)} fighter={run.enemy} enemy effect={effects.enemy} floatingDamage={effects.enemyDamage} />{attackScene && <AttackSequence key={attackScene.key} attack={attackScene.attack} direction={attackScene.direction} critical={attackScene.critical} />}</div><p className="mt-5 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-3 text-center font-mono text-xs font-black">{run.log}</p>{error && <p className="mt-3 font-mono text-xs font-black text-[#d85746]">{error}</p>}{run.status === "battle" && (enemyIsLoading || isLoadingEnemy ? <p className="mt-6 text-center font-mono text-sm font-black">Localizando la siguiente señal...</p> : isTiming ? <TimingMeter technique={technique} onResolve={(multiplier, label) => onFight("technique", multiplier, label)} onCancel={onCancelTiming} /> : <div className="mt-6"><div className="mb-3 flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] font-black uppercase"><span className="rounded-full border border-[#172539] bg-[#dcebdc] px-2 py-1">Técnica: {technique.name}</span>{run.player.techniqueCooldown > 0 && <span className="rounded-full border border-[#172539] bg-[#f6a595] px-2 py-1">Recalibrando {run.player.techniqueCooldown}</span>}</div><div className="flex flex-wrap justify-center gap-3"><Button disabled={isResolving} onClick={() => onFight("pulse")}>Pulso +12 energía</Button><Button variant="outline" disabled={techniqueUnavailable} onClick={onOpenTechnique}>Técnica · 30 energía</Button><Button variant="ghost" disabled={isResolving} onClick={() => onFight("guard")}>Cubrirse +18 energía</Button></div></div>)}{run.status === "reward" && <div className="mt-6"><p className="text-center font-mono text-xs font-black uppercase tracking-widest">Elige una recompensa</p><div className="mt-3 flex flex-wrap justify-center gap-3"><Button onClick={() => void onReward("heal")}>Reparar +35%</Button><Button variant="outline" onClick={() => void onReward("module")}>Módulo +3 poder</Button>{run.player.nextEvolutions.length > 0 && <Button variant="ghost" onClick={() => void onReward("evolution")}>EVO: {run.player.nextEvolutions[0].name}</Button>}</div></div>}{run.status === "complete" && <div className="mt-6 text-center"><Button onClick={onFinish}>Registrar victoria</Button></div>}{run.status === "game-over" && <div className="mt-6 text-center"><Button onClick={onReset}>Intentar otra ruta</Button></div>}{evolutionTarget && <EvolutionOverlay image={run.player.image} targetName={evolutionTarget} />}</div>;
}

function FighterCard({ label, fighter, enemy = false, effect, floatingDamage }: { label: string; fighter: RunFighter; enemy?: boolean; effect: string; floatingDamage?: number }) {
  const percent = Math.round((fighter.hp / fighter.maxHp) * 100);
  const energy = Math.round((fighter.energy / fighter.maxEnergy) * 100);
  return <article className={`relative rounded-3xl border-2 border-[#172539] p-4 ${enemy ? "bg-[#f6a595]" : "bg-white"} ${effect !== "idle" ? `run-fighter-${effect}` : ""}`}><div className="flex items-center gap-4">{fighter.image && <Image src={fighter.image} alt={fighter.name} width={76} height={76} unoptimized className="size-16 object-contain" />}<div className="min-w-0"><p className="font-mono text-[10px] font-black uppercase tracking-wider">{label}</p><h4 className="truncate font-mono text-xl font-black uppercase">{fighter.name}</h4><p className="font-mono text-xs">{fighter.level} · {fighter.attribute}</p></div></div>{floatingDamage !== undefined && floatingDamage > 0 && <span className="run-damage-float absolute right-5 top-4 font-mono text-xl font-black text-[#d85746]">-{floatingDamage}</span>}<StatusBar label="HP" value={`${fighter.hp}/${fighter.maxHp}`} percent={percent} color={enemy ? "bg-[#d85746]" : "bg-[#79c8ea]"} /><StatusBar label="ENERGÍA" value={`${fighter.energy}/${fighter.maxEnergy}`} percent={energy} color="bg-[#fdcc48]" /><div className="mt-2 flex justify-between font-mono text-[10px] font-black"><span>PWR {fighter.power} · DEF {fighter.defense}</span><span>{fighter.techniqueCooldown > 0 ? `CD ${fighter.techniqueCooldown}` : "TÉCNICA LISTA"}</span></div>{fighter.shield > 0 && <p className="mt-1 font-mono text-[10px] font-black text-[#2b6d4f]">ESCUDO +{fighter.shield}</p>}</article>;
}

function StatusBar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) { return <div className="mt-3"><div className="mb-1 flex justify-between font-mono text-[9px] font-black"><span>{label}</span><span>{value}</span></div><div className="h-3 overflow-hidden rounded-full border-2 border-[#172539] bg-white"><div className={`h-full transition-[width] duration-500 ${color}`} style={{ width: `${percent}%` }} /></div></div>; }