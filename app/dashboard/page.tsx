import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Bienvenido, {session?.user?.name}
        </h1>
        <p className="mb-6 text-gray-600">{session?.user?.email}</p>
        <SignOutButton />
      </div>
    </div>
  );
}
