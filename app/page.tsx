import { prisma } from "@/lib/prisma";
import { getOrCreateCharacter } from "@/app/actions/character";
import WorkoutTracker from "@/components/WorkoutTracker";

export default async function Home() {
  // Simulación de usuario logueado
  const TEST_USER_ID = "test-user-123";
  
  // Aseguramos que el usuario de prueba existe
  let user = await prisma.user.findUnique({
    where: { id: TEST_USER_ID }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: "test@example.com",
        name: "Héroe de Prueba",
        passwordHash: "no-password", // Solo para demo
      }
    });
  }

  const character = await getOrCreateCharacter(TEST_USER_ID, user.name);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-8">
      <header className="max-w-4xl mx-auto w-full mb-12">
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          FITNESS RPG
        </h1>
        <p className="mt-4 text-zinc-400 text-lg">
          Tu personaje es el reflejo de tu esfuerzo real. Entrena para definir tu destino.
        </p>
      </header>

      <main className="max-w-4xl mx-auto w-full grid gap-8 md:grid-cols-2 items-start">
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-4 text-zinc-300">Ficha de Personaje</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Nombre</span>
                <span className="font-medium">{character.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Nivel</span>
                <span className="font-medium">{character.level}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Clase Actual</span>
                <span className="font-bold text-blue-400">{character.characterClass}</span>
              </div>
              {character.pendingClass && character.pendingClass !== character.characterClass && (
                <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-900/50">
                  <p className="text-xs text-amber-500 uppercase font-bold mb-1">Transición de Clase detectada</p>
                  <p className="text-sm text-zinc-300">
                    Tu entrenamiento reciente sugiere que estás convirtiéndote en un <span className="font-bold text-amber-400">{character.pendingClass}</span>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-4 text-zinc-300">Atributos</h3>
            <div className="grid grid-cols-2 gap-4">
              {character.attributes.map((attr: any) => (
                <div key={attr.id} className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase">{attr.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(attr.xp % 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">Lvl {attr.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <WorkoutTracker userId={TEST_USER_ID} character={character} />
      </main>

      <footer className="mt-20 py-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <p>Fitness RPG - Basado en tu historial de entrenamiento real.</p>
      </footer>
    </div>
  );
}
