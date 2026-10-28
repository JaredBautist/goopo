import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Traduce una URL `file:` de libSQL a una ruta del sistema de archivos.
 * Devuelve `null` para URLs remotas (libsql://, https://, etc.).
 */
export function fileUrlToPath(url: string): string | null {
  if (!url.startsWith("file:")) return null;
  const raw = url.slice("file:".length);
  if (!raw) return null;
  // `file:///ruta` y `file:/ruta` son absolutas; `file:./ruta` es relativa al cwd.
  if (raw.startsWith("//")) {
    try {
      return fileURLToPath(url);
    } catch {
      return null;
    }
  }
  return resolve(process.cwd(), raw);
}

/**
 * libSQL no crea directorios: si la carpeta de la base de datos no existe,
 * `createClient` falla con `SQLITE_CANTOPEN (14)`. La aseguramos antes de abrir.
 * Es idempotente y no hace nada para bases remotas.
 */
export async function ensureDbDirectory(url: string): Promise<void> {
  const path = fileUrlToPath(url);
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
}
