export type InviteStatusFilter =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired"
  | "all";

export type InviteListItem = {
  id: string;
  email: string;
  token: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export type InviteStatusCounts = Record<InviteStatusFilter, number>;

export type AdminUserListItem = {
  id: string;
  email: string;
  is_blocked: boolean;
  name: string | null;
  slug: string | null;
  cardId: string | null;
  accountType: "Admin" | "User";
};
