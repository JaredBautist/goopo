import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/services/session-user";
import { LoginForm, DemoAccounts } from "./login-form";

export const metadata = { title: "Ingresar" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/competencias");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-center font-display text-2xl font-bold">Ingresa a Goopo</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Participa, consulta tu saldo y sigue tus pronósticos.
      </p>
      <LoginForm />
      <DemoAccounts />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary-700 hover:underline dark:text-primary-300">
          Regístrate con 1.000 Goopos de regalo
        </Link>
      </p>
    </div>
  );
}
