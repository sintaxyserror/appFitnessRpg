import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteAllSessionsButton, DeleteSessionButton } from "@/components/actions/DeleteButtons";

type SessionsPageProps = {
  searchParams?: Promise<{ created?: string }> | { created?: string };
};

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await Promise.resolve(searchParams ?? {});
  const created = params.created === "1";

  const workouts = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: {
      weightSets: { include: { exercise: true } },
      calisthenicsSets: { include: { movement: true } },
      cardioDetail: true,
      sportDetail: true,
    },
  });

  const cardioSessions = await prisma.cardioDetail.findMany({
    where: {
      session: {
        userId: session.user.id,
      },
    },
    include: {
      intervals: true,
    },
  });

  const cardioIntervalsBySessionId = Object.fromEntries(
    cardioSessions.map((detail) => [detail.sessionId, detail.intervals])
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Historial</p>
            <h1 className="mt-2 text-3xl font-black">Sesiones</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/routines"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              Rutinas
            </Link>
            <Link
              href="/sessions/new"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Nueva sesión
            </Link>
            {workouts.length > 0 && <DeleteAllSessionsButton />}
          </div>
        </header>

        {created && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            ✅ Sesión guardada correctamente. Tu progreso ya está actualizado.
          </div>
        )}

        {workouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
            Todavía no tienes sesiones. Registra tu primera para empezar la aventura.
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <article
                key={workout.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-100">{workout.type}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(workout.date).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-300">
                      <span className="font-semibold">{workout.durationMin} min</span>
                      <span className="mx-2 text-slate-600">•</span>
                      <span>{workout.xpGained ?? 0} XP</span>
                    </div>
                    <DeleteSessionButton sessionId={workout.id} />
                  </div>
                </div>

                {workout.notes && <p className="mb-4 text-sm text-slate-300">{workout.notes}</p>}

                {workout.type === "WEIGHTS" && workout.weightSets.length > 0 && (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {workout.weightSets.map((set) => (
                      <li key={set.id}>
                        {set.exercise.name}: {set.reps} reps × {set.weightKg} kg
                        {set.rir !== null && set.rir !== undefined ? ` • RIR ${set.rir}` : ""}
                      </li>
                    ))}
                  </ul>
                )}

                {workout.type === "CALISTHENICS" && workout.calisthenicsSets.length > 0 && (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {workout.calisthenicsSets.map((set) => (
                      <li key={set.id}>
                        {set.movement.name}: {set.reps} reps • {set.progression}
                        {set.rir !== null && set.rir !== undefined ? ` • RIR ${set.rir}` : ""}
                      </li>
                    ))}
                  </ul>
                )}

                {workout.type === "CARDIO" && workout.cardioDetail && (
                  <div className="text-sm text-slate-300">
                    {workout.cardioDetail.distanceKm !== null && workout.cardioDetail.distanceKm !== undefined && (
                      <p>Distancia: {workout.cardioDetail.distanceKm} km</p>
                    )}
                    {workout.cardioDetail.avgPaceMinKm !== null && workout.cardioDetail.avgPaceMinKm !== undefined && (
                      <p>Pace medio: {workout.cardioDetail.avgPaceMinKm} min/km</p>
                    )}
                    {(cardioIntervalsBySessionId[workout.id] ?? []).length > 0 && (
                      <p>Intervalos: {(cardioIntervalsBySessionId[workout.id] ?? []).length}</p>
                    )}
                  </div>
                )}

                {workout.type === "SPORT" && workout.sportDetail && (
                  <p className="text-sm text-slate-300">
                    {workout.sportDetail.sportType} • Intensidad {workout.sportDetail.perceivedIntensity}/10
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
