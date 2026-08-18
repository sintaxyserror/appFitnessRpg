import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getOrCreateCharacter } from "@/app/actions/character";
import { prisma } from "@/lib/prisma";
import { calculateStreakDays } from "@/lib/xp";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const character = await getOrCreateCharacter(session.user.id, session.user.name ?? "Héroe");

  const recentSessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 5,
    include: {
      weightSets: true,
      calisthenicsSets: true,
      cardioDetail: true,
      sportDetail: true,
    },
  });

  const missions = await prisma.mission.findMany({
    where: { characterId: character.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const achievements = await prisma.achievement.findMany({
    where: { characterId: character.id },
    orderBy: { unlockedAt: "desc" },
    take: 4,
  });

  const totalMinutes = recentSessions.reduce((sum, sessionItem) => sum + sessionItem.durationMin, 0);
  const streakDays = calculateStreakDays(
    recentSessions.map((item) => item.date),
    new Date()
  );

  const strongestAttribute = [...character.attributes].sort((a, b) => b.level - a.level)[0];

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Perfil del aventurero</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">{character.name}</h1>
            <p className="mt-2 text-slate-300">{session.user.email}</p>
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
            <SignOutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Nivel" value={`Lv. ${character.level}`} accent="text-cyan-300" />
          <StatCard label="Clase" value={character.characterClass} accent="text-violet-300" />
          <StatCard label="Racha" value={`${streakDays} días`} accent="text-emerald-300" />
          <StatCard label="Puntos" value={`${character.skillPoints}`} accent="text-amber-300" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Atributos</h2>
              <span className="text-sm text-slate-400">Mayor: {strongestAttribute?.type}</span>
            </div>

            <div className="space-y-4">
              {character.attributes.map((attribute) => (
                <div key={attribute.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{attribute.type}</span>
                    <span className="text-slate-400">Lvl {attribute.level}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      style={{ width: `${Math.min((attribute.xp / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div>
              <h2 className="text-xl font-bold">Resumen</h2>
            </div>

            <SummaryRow label="Sesiones recientes" value={`${recentSessions.length}`} />
            <SummaryRow label="Minutos totales" value={`${totalMinutes} min`} />
            <SummaryRow label="Estado" value={character.pendingClass ? `Pendiente: ${character.pendingClass}` : "Estable"} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Misiones activas</h2>
              <span className="text-sm text-cyan-400">{missions.length}</span>
            </div>

            {missions.length === 0 ? (
              <p className="text-slate-400">No hay misiones activas en este momento.</p>
            ) : (
              <div className="space-y-3">
                {missions.map((mission) => (
                  <div key={mission.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-100">{mission.title}</p>
                      <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                        {mission.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{mission.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{mission.targetType}</span>
                      <span>{mission.progress}/{mission.targetValue}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        style={{ width: `${Math.min((mission.progress / Math.max(mission.targetValue, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-amber-300">Recompensa: {mission.rewardXp} XP</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Logros</h2>
              <span className="text-sm text-cyan-400">{achievements.length}</span>
            </div>

            {achievements.length === 0 ? (
              <p className="text-slate-400">Todavía no has desbloqueado ningún logro.</p>
            ) : (
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <p className="font-semibold text-amber-200">{achievement.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{achievement.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Últimas sesiones</h2>
            <Link href="/sessions" className="text-sm text-cyan-400 hover:text-cyan-300">
              Ver historial
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-slate-400">Todavía no tienes sesiones registradas.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{item.type}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(item.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{item.durationMin} min</p>
                    <p>{item.xpGained ?? 0} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
