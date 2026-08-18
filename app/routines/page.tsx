import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteAllRoutinesButton, DeleteRoutineButton } from "@/components/actions/DeleteButtons";

type RoutinesPageProps = {
  searchParams?: Promise<{ created?: string }> | { created?: string };
};

const weekdayLabels: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export default async function RoutinesPage({ searchParams }: RoutinesPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await Promise.resolve(searchParams ?? {});
  const created = params.created === "1";

  const routines = await prisma.routine.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: {
        include: { exercise: true, movement: true },
        orderBy: { order: "asc" },
      },
      days: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Planificación</p>
            <h1 className="mt-2 text-3xl font-black">Rutinas</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sessions/new"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              Nueva sesión
            </Link>
            <Link
              href="/routines/new"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Nueva rutina
            </Link>
            {routines.length > 0 && <DeleteAllRoutinesButton />}
          </div>
        </header>

        {created && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            ✅ Rutina creada correctamente. Ya puedes usarla desde la nueva sesión del día.
          </div>
        )}

        {routines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
            Todavía no tienes rutinas. Crea una para planificar tus días de entrenamiento.
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <article
                key={routine.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">{routine.name}</h2>
                    {routine.routineType && (
                      <p className="text-sm text-slate-400">Tipo: {routine.routineType}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {routine.days.length > 0 ? (
                      routine.days.map((day) => (
                        <span
                          key={day.id}
                          className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200"
                        >
                          {weekdayLabels[day.day]}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        Sin días asignados
                      </span>
                    )}
                    <DeleteRoutineButton routineId={routine.id} />
                  </div>
                </div>

                <div className="space-y-2">
                  {routine.exercises.length === 0 ? (
                    <p className="text-sm text-slate-400">No hay ejercicios añadidos a esta rutina.</p>
                  ) : (
                    routine.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                      >
                        <span className="font-semibold text-white">
                          {exercise.exercise?.name ?? exercise.movement?.name}
                        </span>
                        <span className="ml-2 text-slate-400">
                          {exercise.targetSets} series • {exercise.targetRepsMin}-{exercise.targetRepsMax} reps
                          {exercise.targetRir !== null && exercise.targetRir !== undefined ? ` • RIR objetivo ${exercise.targetRir}` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
