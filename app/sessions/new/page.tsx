import { WorkoutSessionForm } from "@/components/workouts/WorkoutSessionForm";

export default function NewWorkoutSessionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Registrar entreno</h1>
        <WorkoutSessionForm />
      </div>
    </div>
  );
}
