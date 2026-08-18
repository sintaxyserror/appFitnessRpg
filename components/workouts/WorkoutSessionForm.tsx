"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CatalogAutocomplete } from "./CatalogAutocomplete";

type SessionType = "WEIGHTS" | "CARDIO" | "CALISTHENICS" | "SPORT";

type WeightSetRow = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
};

type CalisthenicsSetRow = {
  movementId: string;
  movementName: string;
  setNumber: number;
  reps: number;
  progression: string;
};

export function WorkoutSessionForm() {
  const router = useRouter();

  const [type, setType] = useState<SessionType>("WEIGHTS");
  const [durationMin, setDurationMin] = useState(30);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pesas
  const [weightSets, setWeightSets] = useState<WeightSetRow[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);

  // Calistenia
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSetRow[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<{ id: string; name: string } | null>(null);

  // Cardio
  const [distanceKm, setDistanceKm] = useState(0);
  const [avgPaceMinKm, setAvgPaceMinKm] = useState<number | undefined>(undefined);
  const [avgHeartRate, setAvgHeartRate] = useState<number | undefined>(undefined);

  // Deporte
  const [sportType, setSportType] = useState("");
  const [perceivedIntensity, setPerceivedIntensity] = useState(5);

  function addWeightSet(reps: number, weightKg: number) {
    if (!selectedExercise) return;
    setWeightSets((prev) => [
      ...prev,
      {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        setNumber: prev.length + 1,
        reps,
        weightKg,
      },
    ]);
  }

  function addCalisthenicsSet(reps: number, progression: string) {
    if (!selectedMovement) return;
    setCalisthenicsSets((prev) => [
      ...prev,
      {
        movementId: selectedMovement.id,
        movementName: selectedMovement.name,
        setNumber: prev.length + 1,
        reps,
        progression,
      },
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let payload: any = { type, durationMin, notes: notes || undefined };

    if (type === "WEIGHTS") {
      if (weightSets.length === 0) {
        setError("Añade al menos una serie");
        setLoading(false);
        return;
      }
      payload.weightSets = weightSets.map(({ exerciseId, setNumber, reps, weightKg }) => ({
        exerciseId,
        setNumber,
        reps,
        weightKg,
      }));
    } else if (type === "CALISTHENICS") {
      if (calisthenicsSets.length === 0) {
        setError("Añade al menos una serie");
        setLoading(false);
        return;
      }
      payload.calisthenicsSets = calisthenicsSets.map(
        ({ movementId, setNumber, reps, progression }) => ({
          movementId,
          setNumber,
          reps,
          progression,
        })
      );
    } else if (type === "CARDIO") {
      payload.cardioDetail = { distanceKm, avgPaceMinKm, avgHeartRate };
    } else if (type === "SPORT") {
      if (!sportType) {
        setError("Indica el tipo de deporte");
        setLoading(false);
        return;
      }
      payload.sportDetail = { sportType, perceivedIntensity };
    }

    const res = await fetch("/api/workout-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") || "No se pudo guardar la sesión");
      return;
    }

    router.push("/sessions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de entreno</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SessionType)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="WEIGHTS">Pesas</option>
          <option value="CALISTHENICS">Calistenia</option>
          <option value="CARDIO">Cardio</option>
          <option value="SPORT">Deporte</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Duración (minutos)</label>
        <input
          type="number"
          min={1}
          required
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {type === "WEIGHTS" && (
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700">Series de pesas</p>
          <CatalogAutocomplete
            endpoint="/api/exercises"
            placeholder="Buscar ejercicio..."
            onSelect={(item) => setSelectedExercise(item)}
          />
          <WeightSetInput onAdd={addWeightSet} disabled={!selectedExercise} />
          <ul className="space-y-1 text-sm text-gray-700">
            {weightSets.map((s, i) => (
              <li key={i}>
                {s.exerciseName}: serie {s.setNumber} — {s.reps} reps x {s.weightKg}kg
              </li>
            ))}
          </ul>
        </div>
      )}

      {type === "CALISTHENICS" && (
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700">Series de calistenia</p>
          <CatalogAutocomplete
            endpoint="/api/calisthenics-movements"
            placeholder="Buscar movimiento..."
            onSelect={(item) => setSelectedMovement(item)}
          />
          <CalisthenicsSetInput onAdd={addCalisthenicsSet} disabled={!selectedMovement} />
          <ul className="space-y-1 text-sm text-gray-700">
            {calisthenicsSets.map((s, i) => (
              <li key={i}>
                {s.movementName}: serie {s.setNumber} — {s.reps} reps ({s.progression})
              </li>
            ))}
          </ul>
        </div>
      )}

      {type === "CARDIO" && (
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Distancia (km)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ritmo medio (min/km, opcional)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={avgPaceMinKm ?? ""}
              onChange={(e) => setAvgPaceMinKm(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Pulsaciones medias (opcional)</label>
            <input
              type="number"
              min={0}
              value={avgHeartRate ?? ""}
              onChange={(e) => setAvgHeartRate(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {type === "SPORT" && (
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deporte</label>
            <input
              type="text"
              required
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Intensidad percibida (1-10): {perceivedIntensity}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={perceivedIntensity}
              onChange={(e) => setPerceivedIntensity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar sesión"}
      </button>
    </form>
  );
}

function WeightSetInput({
  onAdd,
  disabled,
}: {
  onAdd: (reps: number, weightKg: number) => void;
  disabled: boolean;
}) {
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState(20);

  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-gray-600">Reps</label>
        <input
          type="number"
          min={1}
          value={reps}
          onChange={(e) => setReps(Number(e.target.value))}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-600">Peso (kg)</label>
        <input
          type="number"
          step="0.5"
          min={0}
          value={weightKg}
          onChange={(e) => setWeightKg(Number(e.target.value))}
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAdd(reps, weightKg)}
        className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
      >
        Añadir serie
      </button>
    </div>
  );
}

function CalisthenicsSetInput({
  onAdd,
  disabled,
}: {
  onAdd: (reps: number, progression: string) => void;
  disabled: boolean;
}) {
  const [reps, setReps] = useState(10);
  const [progression, setProgression] = useState("estricta");

  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-gray-600">Reps</label>
        <input
          type="number"
          min={1}
          value={reps}
          onChange={(e) => setReps(Number(e.target.value))}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-600">Progresión</label>
        <input
          type="text"
          value={progression}
          onChange={(e) => setProgression(e.target.value)}
          className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAdd(reps, progression)}
        className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
      >
        Añadir serie
      </button>
    </div>
  );
}