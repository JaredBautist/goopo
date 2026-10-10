import { describe, it, expect } from "vitest";
import { rechargeDemoWallet } from "@/server/services/wallet.service";
import { ensureDb } from "@/server/db/client";

describe("rechargeDemoWallet", () => {
  it("recharges user wallet with valid demo amount and updates ledger", async () => {
    const client = await ensureDb();
    const userRes = await client.execute("SELECT id, balance FROM users WHERE username = 'ana'");
    const user = userRes.rows[0];
    expect(user).toBeDefined();
    if (!user) throw new Error("User not found");

    const userId = String(user.id);
    const initialBalance = Number(user.balance);

    const rechargeResult = await rechargeDemoWallet({
      userId,
      amount: 500,
    });

    expect(rechargeResult.ok).toBe(true);
    expect(rechargeResult.amount).toBe(500);
    expect(rechargeResult.newBalance).toBe(initialBalance + 500);

    // Verify in db
    const updatedUserRes = await client.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [userId],
    });
    expect(updatedUserRes.rows[0]).toBeDefined();
    expect(Number(updatedUserRes.rows[0]?.balance)).toBe(initialBalance + 500);

    // Verify transaction row was logged
    const txRes = await client.execute({
      sql: "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [userId],
    });
    expect(txRes.rows[0]).toBeDefined();
    expect(Number(txRes.rows[0]?.amount)).toBe(500);
    expect(String(txRes.rows[0]?.type)).toBe("daily_bonus");
  });

  it("rejects non-positive amounts or excessive amounts", async () => {
    const client = await ensureDb();
    const userRes = await client.execute("SELECT id FROM users WHERE username = 'ana'");
    const user = userRes.rows[0];
    expect(user).toBeDefined();
    if (!user) throw new Error("User not found");

    const userId = String(user.id);

    await expect(rechargeDemoWallet({ userId, amount: 0 })).rejects.toThrow("MONTO_INVALIDO");
    await expect(rechargeDemoWallet({ userId, amount: -100 })).rejects.toThrow("MONTO_INVALIDO");
    await expect(rechargeDemoWallet({ userId, amount: 15000 })).rejects.toThrow("MONTO_INVALIDO");
  });
});
