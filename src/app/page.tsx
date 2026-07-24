import { ArchiveExplorer } from "@/components/archive/archive-explorer";
import { DigiDex } from "@/components/digidex/digidex";
import { Digivice } from "@/components/digivice/digivice";
import { TamerConsole } from "@/components/tamer/tamer-console";
import { DigitalRunGame } from "@/components/digital-run/digital-run-game";
import { LandingActions, RadarButton, CollectionShortcut } from "@/components/landing/landing-actions";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/info-hint";
import { MotionReveal } from "@/components/ui/motion-reveal";
import { TamerAccess } from "@/components/auth/tamer-access";
import { getDigimon } from "@/features/digimon/application/get-digimon";
import { fetchArchiveCatalogs } from "@/features/digimon/infrastructure/digi-archive-client";
import { searchDigimon } from "@/features/digimon/infrastructure/digi-api-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [companion, digidex, archiveCatalogs] = await Promise.all([
    getDigimon(1),
    searchDigimon({ pageSize: 12 }),
    fetchArchiveCatalogs(),
  ]);

  return <main className="min-h-screen overflow-hidden bg-[#f7f1e7] text-[#172539]">
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <a className="flex items-center gap-3" href="#inicio" aria-label="NexoDigi, inicio"><span className="grid size-10 place-items-center rounded-xl border-2 border-[#172539] bg-[#fdcc48] font-mono text-lg font-black shadow-[4px_4px_0_#172539]">N</span><span className="font-mono text-sm font-black uppercase tracking-[0.18em]">NexoDigi</span></a>
      <div className="hidden items-center gap-7 font-mono text-xs font-bold uppercase tracking-widest md:flex"><a href="#archivo">Archivo</a><a href="#tamer">Tamer</a><a href="#nexorift">Run</a><a href="#mision">Misión</a><a href="#comunidad">Comunidad</a></div>
      <div className="flex items-center gap-2"><CollectionShortcut /><TamerAccess /></div>
    </nav>

    <section id="inicio" className="mx-auto grid w-full max-w-7xl gap-9 px-5 pb-20 pt-8 lg:grid-cols-[0.85fr_1.3fr_0.85fr] lg:items-center lg:px-8 lg:pb-28">
      <div className="order-2 space-y-6 lg:order-1"><Badge>SEÑAL DIGITAL · 01</Badge><div className="flex items-start gap-3"><h1 className="max-w-sm font-mono text-4xl font-black uppercase leading-[0.92] tracking-[-0.08em] sm:text-6xl">Tu vínculo con el mundo digital.</h1><InfoHint className="mt-1" text="Usa el Digivice para escanear, abrir el perfil del compañero o consultar evoluciones. El botón Cómo funciona explica los controles." /></div><p className="max-w-sm text-base leading-7 text-[#405065]">Escanea, descubre y traza tu propia ruta de evolución. Un Digivice para explorar el archivo vivo de Digimon.</p><LandingActions /></div>
      <div id="digivice" className="order-1 flex justify-center lg:order-2"><Digivice initialDigimon={companion} /></div>
      <aside className="order-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-1"><SignalCard label="Archivo activo" value="1,400+" detail="especies indexadas" accent="yellow" /><SignalCard label="Modo de hoy" value="Escaneo" detail="encuentra un compañero" accent="blue" /><SignalCard label="Tu misión" value="01 / 03" detail="activa un vínculo" accent="coral" /></aside>
    </section>

    <section id="archivo" className="border-y-2 border-[#172539] bg-[#dcebdc]"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><Badge className="bg-[#fdcc48]">ARCHIVO INTERACTIVO</Badge><div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="flex max-w-2xl items-start gap-3"><h2 className="font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">DigiDex: cada señal del Mundo Digital.</h2><InfoHint className="mt-1" text="Busca por nombre, nivel, atributo o X-Antibody. Abre una tarjeta para guardar, añadir al equipo y tomar notas EVO." /></div><p className="max-w-sm text-sm leading-6 text-[#405065]">Filtra el archivo oficial de DAPI por nombre, nivel, atributo y X-Antibody. Selecciona una señal para abrir su ficha.</p></div><DigiDex initialResults={digidex} /></div></section>

    <MotionReveal delay={0.04}><ArchiveExplorer catalogs={archiveCatalogs} /></MotionReveal>
    <MotionReveal><TamerConsole /></MotionReveal>
    <MotionReveal><DigitalRunGame /></MotionReveal>

    <MotionReveal><section id="mision" className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8"><div className="rounded-[2rem] border-2 border-[#172539] bg-[#f36d57] p-7 shadow-[8px_8px_0_#172539] sm:p-10"><p className="font-mono text-xs font-black uppercase tracking-[0.16em]">Misión de bienvenida</p><div className="mt-6 flex items-start gap-3"><h2 className="max-w-lg font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">Encuentra el Digimon que defina tu expedición.</h2><InfoHint className="mt-1" text="Abrir el radar te lleva al DigiDex y activa el campo de búsqueda." /></div><div className="mt-8"><RadarButton /></div></div><div id="comunidad" className="flex flex-col justify-between rounded-[2rem] border-2 border-[#172539] bg-white p-7 sm:p-10"><div><Badge>COMUNIDAD</Badge><div className="mt-5 flex items-start gap-3"><h2 className="font-mono text-2xl font-black uppercase leading-none tracking-[-0.06em] sm:text-4xl">El archivo crece con cada Tamer.</h2><InfoHint className="mt-1" text="Esta sección anticipa las funciones comunitarias que se activarán al integrar backend y moderación." /></div></div><p className="mt-8 max-w-md text-base leading-7 text-[#405065]">Próximamente: rutas curadas, traducciones comunitarias y desafíos para explorar juntos el Mundo Digital.</p></div></section></MotionReveal>
    <footer className="border-t-2 border-[#172539] px-5 py-7 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#405065]">NexoDigi · Archivo no oficial de fans · Datos proporcionados por DAPI</footer>
  </main>;
}

function SignalCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: "yellow" | "blue" | "coral" }) {
  const colors = { yellow: "bg-[#fdcc48]", blue: "bg-[#79c8ea]", coral: "bg-[#f6a595]" };
  return <article className={`rounded-2xl border-2 border-[#172539] p-4 shadow-[4px_4px_0_#172539] ${colors[accent]}`}><p className="font-mono text-[10px] font-black uppercase tracking-widest">{label}</p><p className="mt-2 font-mono text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs font-medium text-[#405065]">{detail}</p></article>;
}