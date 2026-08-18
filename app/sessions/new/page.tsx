import Link from "next/link";
import { WorkoutSessionForm } from "@/components/workouts/WorkoutSessionForm";

export default function NewWorkoutSessionPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Aventura</p>
            <h1 className="mt-2 text-3xl font-black text-white">Registrar entrenamiento</h1>
          </div>
          <Link
            href="/sessions"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Volver al historial
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <WorkoutSessionForm />

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-violet-400">Consejo de la misión</p>
            <h2 className="mt-3 text-xl font-bold text-white">Recompensas del entrenamiento</h2>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-semibold text-cyan-300">+ XP</p>
                <p>Cuanto más entrenes, más XP gana tu personaje.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-semibold text-emerald-300">+ Atributos</p>
                <p>Las sesiones de fuerza, cardio y calistenia fortalecen tus stats.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-semibold text-amber-300">+ Clase</p>
                <p>Tu especialidad se adapta al tipo de entrenamiento más frecuente.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
