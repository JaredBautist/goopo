import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatus,
  computeLazyClosures,
  acceptsPredictions,
} from "@/server/domain/competition-state";

describe("transiciones válidas", () => {
  it("draft -> publish -> open", () => {
    expect(canTransition("draft", "publish")).toBe(true);
    expect(nextStatus("draft", "publish")).toBe("open");
  });
  it("open -> manual_close -> closed", () => {
    expect(nextStatus("open", "manual_close")).toBe("closed");
  });
  it("open -> cancel -> cancelled", () => {
    expect(nextStatus("open", "cancel")).toBe("cancelled");
  });
  it("closed -> resolve -> resolved", () => {
    expect(nextStatus("closed", "resolve")).toBe("resolved");
  });
  it("closed -> cancel -> cancelled", () => {
    expect(nextStatus("closed", "cancel")).toBe("cancelled");
  });
});

describe("transiciones inválidas", () => {
  it("no se puede resolver una competencia open", () => {
    expect(canTransition("open", "resolve")).toBe(false);
    expect(nextStatus("open", "resolve")).toBeNull();
  });
  it("no se puede resolver una resuelta (inmutable)", () => {
    expect(nextStatus("resolved", "resolve")).toBeNull();
    expect(nextStatus("resolved", "cancel")).toBeNull();
  });
  it("no se puede cancelar una resolved", () => {
    expect(canTransition("resolved", "cancel")).toBe(false);
  });
  it("no se puede publicar algo que no es draft", () => {
    expect(canTransition("open", "publish")).toBe(false);
  });
});

describe("cierre perezoso", () => {
  const now = new Date("2024-06-01T12:00:00Z");
  it("pasa a closed solo las open vencidas", () => {
    const comps = [
      { id: "a", status: "open", closesAt: "2024-06-01T11:59:59Z" },
      { id: "b", status: "open", closesAt: "2024-06-01T12:00:00Z" }, // exactamente closes_at
      { id: "c", status: "open", closesAt: "2024-06-01T12:00:01Z" },
      { id: "d", status: "closed", closesAt: "2024-05-01T00:00:00Z" },
      { id: "e", status: "draft", closesAt: "2024-05-01T00:00:00Z" },
    ];
    expect(computeLazyClosures(comps, now)).toEqual(["a", "b"]);
  });
});

describe("acceptsPredictions", () => {
  const now = new Date("2024-06-01T12:00:00Z");
  it("acepta en ventana y rechaza antes/después", () => {
    const comp = { status: "open" as const, opensAt: "2024-06-01T00:00:00Z", closesAt: "2024-06-02T00:00:00Z" };
    expect(acceptsPredictions(comp, now)).toBe(true);
    expect(
      acceptsPredictions({ ...comp, opensAt: "2024-06-01T13:00:00Z" }, now),
    ).toBe(false);
    expect(
      acceptsPredictions({ ...comp, closesAt: "2024-06-01T12:00:00Z" }, now),
    ).toBe(false);
    expect(
      acceptsPredictions({ ...comp, status: "closed" as const }, now),
    ).toBe(false);
  });
});
