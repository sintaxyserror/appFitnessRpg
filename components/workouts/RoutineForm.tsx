"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const WEEKDAYS = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
] as const;

type Option = { id: string; name: string };

type RoutineExerciseDraft = {
  order: number;
  exerciseId?: string;
  movementId?: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number;
  targetRirs: number[];
};

export function RoutineForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [routineType, setRoutineType] = useState("FULL_BODY");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Option[]>([]);
  const [movements, setMovements] = useState<Option[]>([]);
  const [drafts, setDrafts] = useState<RoutineExerciseDraft[]>([
    { order: 1, exerciseId: "", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRir: 2, targetRirs: [2, 2, 2, 2] },
  ]);
  const [exerciseSearches, setExerciseSearches] = useState<Record<number, string>>({ 0: "" });
  const [movementSearches, setMovementSearches] = useState<Record<number, string>>({ 0: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      const [exRes, moveRes] = await Promise.all([
        fetch("/api/exercises?search="),
        fetch("/api/calisthenics-movements?search="),
      ]);

      if (exRes.ok) setExercises(await exRes.json());
      if (moveRes.ok) setMovements(await moveRes.json());
    }

    loadCatalog();
  }, []);

  const totalDrafts = useMemo(() => drafts.filter(Boolean).length, [drafts]);

  const exerciseNameById = useMemo(
    () => Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.name])),
    [exercises]
  );

  const movementNameById = useMemo(
    () => Object.fromEntries(movements.map((movement) => [movement.id, movement.name])),
    [movements]
  );

  const filteredExerciseOptions = (index: number) => {
    const query = (exerciseSearches[index] ?? "").trim().toLowerCase();
    const source = query ? exercises : exercises.slice(0, 12);

    return source.filter((exercise) =>
      exercise.name.toLowerCase().includes(query || "")
    );
  };

  const filteredMovementOptions = (index: number) => {
    const query = (movementSearches[index] ?? "").trim().toLowerCase();
    const source = query ? movements : movements.slice(0, 12);

    return source.filter((movement) =>
      movement.name.toLowerCase().includes(query || "")
    );
  };

  function highlightMatch(text: string, query: string) {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    const parts = text.split(regex);

    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={`${part}-${idx}`} className="rounded bg-cyan-500/20 px-0.5 text-cyan-200">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${idx}`}>{part}</span>
      )
    );
  }

  function handleExercisePick(index: number, exerciseId: string) {
    const name = exerciseNameById[exerciseId] ?? "";
    setExerciseSearches((prev) => ({ ...prev, [index]: name }));
    updateDraft(index, {
      exerciseId,
      movementId: "",
    });
  }

  function handleMovementPick(index: number, movementId: string) {
    const name = movementNameById[movementId] ?? "";
    setMovementSearches((prev) => ({ ...prev, [index]: name }));
    updateDraft(index, {
      movementId,
      exerciseId: "",
    });
  }

  function handleExerciseKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const matches = filteredExerciseOptions(index);
    if (matches[0]) {
      handleExercisePick(index, matches[0].id);
    }
  }

  function handleMovementKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const matches = filteredMovementOptions(index);
    if (matches[0]) {
      handleMovementPick(index, matches[0].id);
    }
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  }

  function updateDraft(index: number, patch: Partial<RoutineExerciseDraft>) {
    setDrafts((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }

  function updateSetRir(index: number, setIndex: number, rir: number) {
    setDrafts((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;

        const nextRirs = [...(item.targetRirs ?? [])];
        while (nextRirs.length < item.targetSets) nextRirs.push(2);
        while (nextRirs.length > item.targetSets) nextRirs.pop();
        nextRirs[setIndex] = rir;

        const nextTargetRir = nextRirs[0] ?? item.targetRir ?? 2;
        return { ...item, targetRirs: nextRirs, targetRir: nextTargetRir };
      })
    );
  }

  function addDraft() {
    setDrafts((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        exerciseId: "",
        movementId: "",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        targetRir: 2,
        targetRirs: [2, 2, 2],
      },
    ]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx + 1 })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Pon un nombre a la rutina.");
      return;
    }

    if (selectedDays.length === 0) {
      setError("Asigna al menos un día de la semana a la rutina antes de guardarla.");
      return;
    }

    const filteredExercises = drafts
      .filter((row) => row.exerciseId || row.movementId)
      .map((row) => {
        const targetRirs = Array.from({ length: Number(row.targetSets) }, (_, index) =>
          Number(row.targetRirs?.[index] ?? row.targetRir ?? 2)
        );

        return {
          order: row.order,
          exerciseId: row.exerciseId || undefined,
          movementId: row.movementId || undefined,
          targetSets: Number(row.targetSets),
          targetRepsMin: Number(row.targetRepsMin),
          targetRepsMax: Number(row.targetRepsMax),
          targetRir: Number(targetRirs[0] ?? row.targetRir ?? 2),
          targetRirs,
        };
      });

    if (filteredExercises.length === 0) {
      setError("Añade al menos un ejercicio o movimiento.");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      routineType,
      days: selectedDays,
      exercises: filteredExercises,
    };

    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.join(", ") || data.error?.message || "No se pudo guardar la rutina.");
      return;
    }

    setSuccess("Rutina creada correctamente.");
    setName("");
    setRoutineType("FULL_BODY");
    setSelectedDays([]);
    setDrafts([{ order: 1, exerciseId: "", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRir: 2, targetRirs: [2, 2, 2, 2] }]);
    router.push("/routines?created=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Plan semanal</p>
        <h2 className="mt-2 text-2xl font-black text-white">Crear rutina</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-200">Nombre de la rutina</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            placeholder="Ej: Fuerza base, Volumen superior..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Tipo de rutina</label>
          <select
            value={routineType}
            onChange={(e) => setRoutineType(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="WEIDER">WEIDER</option>
            <option value="FULL_BODY">FULL BODY</option>
            <option value="UPPER_LOWER">UPPER/LOWER</option>
            <option value="PUSH_PULL_LEGS">PUSH/PULL/LEGS</option>
            <option value="OTHER">OTRA</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Días asignados</label>
          <div className="flex flex-wrap gap-2 pt-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                  selectedDays.includes(day.value)
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                    : "border-slate-700 bg-slate-950 text-slate-300"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {selectedDays.length === 0 && (
            <p className="mt-2 text-xs text-amber-200">Selecciona al menos un día para que la rutina aparezca en el calendario semanal.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Ejercicios</h3>
          <button
            type="button"
            onClick={addDraft}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200"
          >
            Añadir fila
          </button>
        </div>

        {drafts.map((draft, index) => (
          <div key={index} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">Ejercicio {index + 1}</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDraft(index)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-300">Ejercicio</label>
                <input
                  type="text"
                  value={exerciseSearches[index] ?? (draft.exerciseId ? exerciseNameById[draft.exerciseId] ?? "" : "")}
                  onChange={(e) => {
                    setExerciseSearches((prev) => ({ ...prev, [index]: e.target.value }));
                  }}
                  onKeyDown={(e) => handleExerciseKeyDown(index, e)}
                  placeholder="Buscar por nombre"
                  className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white"
                />

                <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {filteredExerciseOptions(index).length === 0 ? (
                    <div className="px-2 py-3 text-xs text-slate-400">Sin resultados</div>
                  ) : (
                    filteredExerciseOptions(index).map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleExercisePick(index, exercise.id)}
                        className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                      >
                        {highlightMatch(exercise.name, exerciseSearches[index] ?? "")}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Movimiento</label>
                <input
                  type="text"
                  value={movementSearches[index] ?? (draft.movementId ? movementNameById[draft.movementId] ?? "" : "")}
                  onChange={(e) => {
                    setMovementSearches((prev) => ({ ...prev, [index]: e.target.value }));
                  }}
                  onKeyDown={(e) => handleMovementKeyDown(index, e)}
                  placeholder="Buscar por nombre"
                  className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white"
                />

                <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {filteredMovementOptions(index).length === 0 ? (
                    <div className="px-2 py-3 text-xs text-slate-400">Sin resultados</div>
                  ) : (
                    filteredMovementOptions(index).map((movement) => (
                      <button
                        key={movement.id}
                        type="button"
                        onClick={() => handleMovementPick(index, movement.id)}
                        className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                      >
                        {highlightMatch(movement.name, movementSearches[index] ?? "")}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Series</label>
                <input
                  type="number"
                  min={1}
                  value={draft.targetSets}
                  onChange={(e) => updateDraft(index, { targetSets: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Reps mín</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.targetRepsMin}
                    onChange={(e) => updateDraft(index, { targetRepsMin: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Reps máx</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.targetRepsMax}
                    onChange={(e) => updateDraft(index, { targetRepsMax: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-2 block text-xs text-slate-300">RIR objetivo por serie</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: draft.targetSets }, (_, setIndex) => (
                    <label key={setIndex} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-200">
                      <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-400">Serie {setIndex + 1}</span>
                      <select
                        value={draft.targetRirs?.[setIndex] ?? draft.targetRir ?? 2}
                        onChange={(e) => updateSetRir(index, setIndex, Number(e.target.value))}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-sm text-white"
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
      >
        {loading ? "Guardando..." : `Guardar rutina (${totalDrafts})`}
      </button>
    </form>
  );
}
