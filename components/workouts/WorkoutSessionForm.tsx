"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionType = "WEIGHTS" | "CARDIO" | "CALISTHENICS" | "SPORT";

type RoutineExercise = {
  id: string;
  order: number;
  exerciseId?: string | null;
  movementId?: string | null;
  exercise?: { id: string; name: string } | null;
  movement?: { id: string; name: string } | null;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir?: number | null;
  targetRirs?: number[] | null;
};

type RoutineOption = {
  id: string;
  name: string;
  routineType?: string | null;
  days: { id: string; day: string }[];
  exercises: RoutineExercise[];
};

type WeightSetRow = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rir: number;
  note: string;
};

type CalisthenicsSetRow = {
  movementId: string;
  movementName: string;
  setNumber: number;
  reps: number;
  progression: string;
  rir: number;
  note: string;
};

const WEEKDAY_OPTIONS = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
] as const;

export function WorkoutSessionForm() {
  const router = useRouter();

  const [type, setType] = useState<SessionType>("WEIGHTS");
  const [durationMin, setDurationMin] = useState(30);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(WEEKDAY_OPTIONS[(new Date().getDay() + 6) % 7].value);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");

  const [weightSets, setWeightSets] = useState<WeightSetRow[]>([]);
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSetRow[]>([]);

  const [distanceKm, setDistanceKm] = useState(0);
  const [avgPaceMinKm, setAvgPaceMinKm] = useState<number | undefined>(undefined);
  const [avgHeartRate, setAvgHeartRate] = useState<number | undefined>(undefined);
  const [sportType, setSportType] = useState("");
  const [perceivedIntensity, setPerceivedIntensity] = useState(5);

  useEffect(() => {
    async function loadRoutines() {
      const res = await fetch("/api/routines");
      if (!res.ok) return;
      const data = await res.json();
      setRoutines(Array.isArray(data) ? data : []);
    }

    loadRoutines();
  }, []);

  const routinesForSelectedDay = useMemo(
    () => routines.filter((routine) => routine.days.some((day) => day.day === selectedDay)),
    [routines, selectedDay]
  );

  useEffect(() => {
    if (!routinesForSelectedDay.length) {
      setSelectedRoutineId("");
      return;
    }

    if (!selectedRoutineId || !routinesForSelectedDay.some((routine) => routine.id === selectedRoutineId)) {
      setSelectedRoutineId(routinesForSelectedDay[0].id);
    }
  }, [routinesForSelectedDay, selectedRoutineId]);

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedRoutineId) ?? null,
    [routines, selectedRoutineId]
  );

  const requiresRoutineForSelectedType = type === "WEIGHTS" || type === "CALISTHENICS";
  const canSubmit = !requiresRoutineForSelectedType || Boolean(selectedRoutine);

  useEffect(() => {
    if (!selectedRoutine) return;

    if (type === "WEIGHTS") {
      const rows: WeightSetRow[] = selectedRoutine.exercises
        .filter((exercise) => exercise.exerciseId && exercise.exercise)
        .flatMap((exercise) =>
          Array.from({ length: exercise.targetSets }, (_, index) => ({
            exerciseId: exercise.exerciseId as string,
            exerciseName: exercise.exercise?.name ?? "",
            setNumber: index + 1,
            reps: exercise.targetRepsMin,
            weightKg: 0,
            rir: exercise.targetRirs?.[index] ?? exercise.targetRir ?? 2,
            note: "",
          }))
        );
      setWeightSets(rows);
    }

    if (type === "CALISTHENICS") {
      const rows: CalisthenicsSetRow[] = selectedRoutine.exercises
        .filter((exercise) => exercise.movementId && exercise.movement)
        .flatMap((exercise) =>
          Array.from({ length: exercise.targetSets }, (_, index) => ({
            movementId: exercise.movementId as string,
            movementName: exercise.movement?.name ?? "",
            setNumber: index + 1,
            reps: exercise.targetRepsMin,
            progression: "stricta",
            rir: exercise.targetRirs?.[index] ?? exercise.targetRir ?? 2,
            note: "",
          }))
        );
      setCalisthenicsSets(rows);
    }
  }, [selectedRoutine, type]);

  function setWeightRowValue(index: number, patch: Partial<WeightSetRow>) {
    setWeightSets((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  }

  function setCalisthenicsRowValue(index: number, patch: Partial<CalisthenicsSetRow>) {
    setCalisthenicsSets((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (requiresRoutineForSelectedType && !selectedRoutine) {
      setError("No tienes ninguna rutina asignada para este día. Crea una rutina y asígnala antes de guardar la sesión.");
      return;
    }

    setLoading(true);

    let payload: any = {
      type,
      durationMin,
      notes: notes || undefined,
      ...(selectedRoutine ? { routineId: selectedRoutine.id, routineType: selectedRoutine.routineType } : {}),
    };

    if (type === "WEIGHTS") {
      if (weightSets.length === 0) {
        setError("Selecciona una rutina con ejercicios para este día.");
        setLoading(false);
        return;
      }
      payload.weightSets = weightSets.map(({ exerciseId, setNumber, reps, weightKg, rir, note }) => ({
        exerciseId,
        setNumber,
        reps,
        weightKg,
        rir: rir || undefined,
        note: note || undefined,
      }));
    } else if (type === "CALISTHENICS") {
      if (calisthenicsSets.length === 0) {
        setError("Selecciona una rutina con ejercicios para este día.");
        setLoading(false);
        return;
      }
      payload.calisthenicsSets = calisthenicsSets.map(
        ({ movementId, setNumber, reps, progression, rir, note }) => ({
          movementId,
          setNumber,
          reps,
          progression,
          rir: rir || undefined,
          note: note || undefined,
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
      setError(data.error?.formErrors?.join(", ") || data.error || "No se pudo guardar la sesión");
      return;
    }

    router.push("/sessions?created=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Ficha del aventurero</p>
          <h2 className="mt-2 text-2xl font-black text-white">Nueva sesión</h2>
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {type}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Selecciona tu día</label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setSelectedDay(day.value)}
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                selectedDay === day.value
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Rutina del día</label>
        {routinesForSelectedDay.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            <p>
              No tienes rutinas asignadas para {WEEKDAY_OPTIONS.find((day) => day.value === selectedDay)?.label ?? "este día"}. Crea una rutina y asígnale este día antes de guardar la sesión.
            </p>
            <a
              href="/routines/new"
              className="mt-3 inline-flex rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 font-semibold text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/20"
            >
              Crear rutina para {WEEKDAY_OPTIONS.find((day) => day.value === selectedDay)?.label ?? "este día"}
            </a>
          </div>
        ) : (
          <select
            value={selectedRoutineId}
            onChange={(e) => setSelectedRoutineId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500"
          >
            {routinesForSelectedDay.map((routine) => (
              <option key={routine.id} value={routine.id}>
                {routine.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Tipo de entreno</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SessionType)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500"
        >
          <option value="WEIGHTS">Pesas</option>
          <option value="CALISTHENICS">Calistenia</option>
          <option value="CARDIO">Cardio</option>
          <option value="SPORT">Deporte</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Duración (minutos)</label>
        <input
          type="number"
          min={1}
          required
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500"
        />
      </div>

      {type === "WEIGHTS" && selectedRoutine && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Series de {selectedRoutine.name}</p>
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">RIR + nota</span>
          </div>

          {weightSets.map((set, index) => (
            <div key={`${set.exerciseId}-${set.setNumber}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="mb-2 text-sm font-semibold text-slate-200">
                {set.exerciseName} · Serie {set.setNumber}
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <input
                  type="number"
                  min={1}
                  value={set.reps}
                  onChange={(e) => setWeightRowValue(index, { reps: Number(e.target.value) })}
                  placeholder="Reps"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={set.weightKg}
                  onChange={(e) => setWeightRowValue(index, { weightKg: Number(e.target.value) })}
                  placeholder="Kg"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={set.rir}
                  onChange={(e) => setWeightRowValue(index, { rir: Number(e.target.value) })}
                  placeholder="RIR"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  value={set.note}
                  onChange={(e) => setWeightRowValue(index, { note: e.target.value })}
                  placeholder="Comentario"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white md:col-span-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "CALISTHENICS" && selectedRoutine && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Series de {selectedRoutine.name}</p>
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">RIR + nota</span>
          </div>

          {calisthenicsSets.map((set, index) => (
            <div key={`${set.movementId}-${set.setNumber}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="mb-2 text-sm font-semibold text-slate-200">
                {set.movementName} · Serie {set.setNumber}
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <input
                  type="number"
                  min={1}
                  value={set.reps}
                  onChange={(e) => setCalisthenicsRowValue(index, { reps: Number(e.target.value) })}
                  placeholder="Reps"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  value={set.progression}
                  onChange={(e) => setCalisthenicsRowValue(index, { progression: e.target.value })}
                  placeholder="Progresión"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={set.rir}
                  onChange={(e) => setCalisthenicsRowValue(index, { rir: Number(e.target.value) })}
                  placeholder="RIR"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  value={set.note}
                  onChange={(e) => setCalisthenicsRowValue(index, { note: e.target.value })}
                  placeholder="Comentario"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white md:col-span-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "CARDIO" && (
        <div className="space-y-3 rounded-md border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Distancia (km)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Ritmo medio (min/km, opcional)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={avgPaceMinKm ?? ""}
              onChange={(e) => setAvgPaceMinKm(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Pulsaciones medias (opcional)</label>
            <input
              type="number"
              min={0}
              value={avgHeartRate ?? ""}
              onChange={(e) => setAvgHeartRate(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      )}

      {type === "SPORT" && (
        <div className="space-y-3 rounded-md border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Deporte</label>
            <input
              type="text"
              required
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
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
        <label className="mb-1 block text-sm font-medium text-slate-200">Notas del entrenamiento (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (requiresRoutineForSelectedType && !selectedRoutine)}
        className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Guardando..." : requiresRoutineForSelectedType && !selectedRoutine ? "Falta rutina del día" : "Guardar sesión"}
      </button>
    </form>
  );
}