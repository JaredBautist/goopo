import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/services/session-user";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registro" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/mi-cuenta");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-center font-display text-2xl font-bold">Crea tu cuenta</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Recibe 1.000 Goopos de bienvenida para participar (demo, sin valor real).
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-primary-700 hover:underline dark:text-primary-300">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
