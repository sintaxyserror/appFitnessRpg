import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
