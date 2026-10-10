export type Role = "participant" | "admin";
export type UserStatus = "active" | "self_excluded" | "suspended";
export type CompetitionStatus =
  | "draft"
  | "open"
  | "closed"
  | "resolved"
  | "cancelled";
export type PredictionStatus = "active" | "won" | "lost" | "refunded";
export type TieRule = "split_equal" | "earliest_wins" | "refund_all";
export type WalletTxType =
  | "signup_bonus"
  | "stake"
  | "payout"
  | "refund"
  | "daily_bonus"
  | "admin_adjust";
export type CompetitionCategory =
  | "deportes"
  | "esports"
  | "academico"
  | "entretenimiento"
  | "clima"
  | "comunidad"
  | "otro";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  balance: number;
  dailyLimit: number | null;
  birthDate: string;
};
