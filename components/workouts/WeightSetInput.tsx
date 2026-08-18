"use client";

import { useState } from "react";
import { RirSelect } from "./RirSelect";

export type WeightSetInputValues = {
  reps: number;
  weightKg: number;
  restSeconds?: number;
  rir?: number;
};

type Props = {
  onAdd: (values: WeightSetInputValues) => void;
  disabled: boolean;
  defaultRepsMin?: number;
  defaultRepsMax?: number;
};

export function WeightSetInput({ onAdd, disabled, defaultRepsMin, defaultRepsMax }: Props) {
  const [reps, setReps] = useState(defaultRepsMin ?? 10);
  const [weightKg, setWeightKg] = useState(20);
  const [restSeconds, setRestSeconds] = useState<number | undefined>(90);
  const [rir, setRir] = useState<number | undefined>(undefined);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-gray-600">
          Reps {defaultRepsMin && defaultRepsMax ? `(objetivo ${defaultRepsMin}-${defaultRepsMax})` : ""}
        </label>
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
      <div>
        <label className="mb-1 block text-xs text-gray-600">Descanso (s)</label>
        <input
          type="number"
          min={0}
          value={restSeconds ?? ""}
          onChange={(e) => setRestSeconds(e.target.value ? Number(e.target.value) : undefined)}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <RirSelect value={rir} onChange={setRir} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAdd({ reps, weightKg, restSeconds, rir })}
        className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
      >
        Añadir serie
      </button>
    </div>
  );
}
