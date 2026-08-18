"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres borrar esta sesión?")) return;

    setIsDeleting(true);
    const res = await fetch(`/api/workout-sessions/${sessionId}`, { method: "DELETE" });
    setIsDeleting(false);

    if (!res.ok) {
      alert("No se pudo borrar la sesión.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Borrando..." : "Borrar"}
    </button>
  );
}

export function DeleteAllSessionsButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAll() {
    if (!confirm("¿Seguro que quieres borrar todo el historial de sesiones? Esta acción no se puede deshacer.")) return;

    setIsDeleting(true);
    const res = await fetch("/api/workout-sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setIsDeleting(false);

    if (!res.ok) {
      alert("No se pudo borrar el historial.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      disabled={isDeleting}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Borrando historial..." : "Borrar historial"}
    </button>
  );
}

export function DeleteRoutineButton({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres borrar esta rutina?")) return;

    setIsDeleting(true);
    const res = await fetch(`/api/routines/${routineId}`, { method: "DELETE" });
    setIsDeleting(false);

    if (!res.ok) {
      alert("No se pudo borrar la rutina.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Borrando..." : "Borrar"}
    </button>
  );
}

export function DeleteAllRoutinesButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAll() {
    if (!confirm("¿Seguro que quieres borrar todas las rutinas? Esta acción no se puede deshacer.")) return;

    setIsDeleting(true);
    const res = await fetch("/api/routines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setIsDeleting(false);

    if (!res.ok) {
      alert("No se pudo borrar las rutinas.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      disabled={isDeleting}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Borrando rutinas..." : "Borrar rutinas"}
    </button>
  );
}
