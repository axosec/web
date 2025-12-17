import { useAuth } from "@repo/ui/context/auth-context";

export function HomePage() {
  const { user } = useAuth()
  return (
    <div>
      <h1>
        Welcome {user?.username || ""}
      </h1>
    </div>
  );
}
