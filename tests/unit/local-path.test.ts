import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ensureDbDirectory, fileUrlToPath } from "@/server/db/local-path";

describe("fileUrlToPath", () => {
  it("resuelve rutas relativas contra el directorio de trabajo", () => {
    expect(fileUrlToPath("file:./data/goopo.db")).toBe(
      resolve(process.cwd(), "./data/goopo.db"),
    );
  });

  it("mantiene las rutas absolutas", () => {
    expect(fileUrlToPath("file:/tmp/goopo.db")).toBe("/tmp/goopo.db");
  });

  it("devuelve null para URLs remotas", () => {
    expect(fileUrlToPath("libsql://goopo.turso.io")).toBeNull();
    expect(fileUrlToPath("https://example.com/db")).toBeNull();
  });
});

describe("ensureDbDirectory", () => {
  let dir: string | null = null;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = null;
  });

  it("crea la carpeta de la base de datos si no existe", async () => {
    dir = await mkdtemp(join(tmpdir(), "goopo-db-"));
    const dbPath = join(dir, "anidada", "data", "goopo.db");

    await ensureDbDirectory(`file:${dbPath}`);

    const info = await stat(join(dir, "anidada", "data"));
    expect(info.isDirectory()).toBe(true);
  });

  it("no falla si la carpeta ya existe", async () => {
    dir = await mkdtemp(join(tmpdir(), "goopo-db-"));
    const dbPath = join(dir, "goopo.db");

    await ensureDbDirectory(`file:${dbPath}`);
    await ensureDbDirectory(`file:${dbPath}`);

    expect((await stat(dir)).isDirectory()).toBe(true);
  });

  it("ignora las URLs remotas", async () => {
    await expect(ensureDbDirectory("libsql://goopo.turso.io")).resolves.toBeUndefined();
  });
});
