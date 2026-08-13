"use client";

import { useState } from "react";
import { SessionType, CharacterClass } from "@prisma/client";
import { addWorkoutSession } from "@/app/actions/workout";

export default function WorkoutTracker({ userId, character }: { userId: string, character: any }) {
  const [loading, setLoading] = useState(false);

  const handleAddSession = async (type: SessionType) => {
    setLoading(true);
    try {
      await addWorkoutSession({
        userId,
        type,
        durationMin: 60, // Por defecto 60 min para la prueba
        notes: "Sesión de prueba para definir clase",
      });
      alert(`Sesión de ${type} añadida. ¡Tu clase se está actualizando!`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 text-white rounded-xl shadow-xl border border-zinc-800">
      <h2 className="text-2xl font-bold mb-4">Registro de Entrenamiento</h2>
      
      <div className="mb-6">
        <p className="text-zinc-400 mb-2">Estado Actual:</p>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-blue-600 rounded-lg font-bold">
            Clase: {character?.characterClass || "UNDEFINED"}
          </div>
          {character?.pendingClass && character.pendingClass !== character.characterClass && (
            <div className="px-4 py-2 bg-amber-500 rounded-lg font-bold animate-pulse">
              Pendiente: {character.pendingClass}
            </div>
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        Haz clic para simular una sesión de 60 minutos. Tu clase se define por lo que más entrenas en los últimos 30 días.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAddSession("WEIGHTS")}
          disabled={loading}
          className="p-4 bg-red-900/50 hover:bg-red-800 border border-red-700 rounded-lg transition-all"
        >
          🏋️ Pesas (Guerrero)
        </button>
        <button
          onClick={() => handleAddSession("CARDIO")}
          disabled={loading}
          className="p-4 bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700 rounded-lg transition-all"
        >
          🏃 Cardio (Explorador)
        </button>
        <button
          onClick={() => handleAddSession("CALISTHENICS")}
          disabled={loading}
          className="p-4 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 rounded-lg transition-all"
        >
          🤸 Calistenia (Monje)
        </button>
        <button
          onClick={() => handleAddSession("SPORT")}
          disabled={loading}
          className="p-4 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 rounded-lg transition-all"
        >
          ⚽ Deporte (Explorador/Mix)
        </button>
      </div>

      <div className="mt-8 p-4 bg-black/40 rounded-lg border border-zinc-800 text-xs text-zinc-400">
        <h4 className="font-bold mb-2 uppercase tracking-wider text-zinc-500">Cómo funciona la clase:</h4>
        <ul className="space-y-1">
          <li>• <strong>Guerrero:</strong> {">"} 50% del tiempo en pesas.</li>
          <li>• <strong>Explorador:</strong> {">"} 50% del tiempo en cardio/deportes.</li>
          <li>• <strong>Monje:</strong> {">"} 50% del tiempo en calistenia.</li>
          <li>• <strong>Paladín:</strong> Entrenamiento equilibrado en varias disciplinas.</li>
        </ul>
      </div>
    </div>
  );
}
