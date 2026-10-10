import { Navbar } from "./navbar";
import { getCurrentUser } from "@/server/services/session-user";
import { countUnread } from "@/server/services/notifications.service";

export async function NavbarServer() {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;
  return (
    <Navbar
      user={
        user
          ? {
              username: user.username,
              displayName: user.displayName,
              role: user.role,
              balance: user.balance,
              unread,
            }
          : null
      }
    />
  );
}
