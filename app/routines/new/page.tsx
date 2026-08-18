import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RoutineForm } from "@/components/workouts/RoutineForm";

export default async function NewRoutinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Planificación</p>
            <h1 className="mt-2 text-3xl font-black">Nueva rutina</h1>
          </div>

          <Link
            href="/routines"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Volver a rutinas
          </Link>
        </header>

        <RoutineForm />
      </div>
    </div>
  );
}
