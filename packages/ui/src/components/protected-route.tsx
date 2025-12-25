import { useState, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@repo/ui/context/auth-context";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";

export function ProtectedRoute({ loginRedirect = "/login", children }: { loginRedirect?: string, children: JSX.Element }) {
  const { status, user, unlock, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (status === "LOADING") {
    return <div className="lock-loading">Loading environment...</div>;
  }

  if (status === "UNAUTHENTICATED") {
    const url = loginRedirect;

    const isExternal = /^https?:\/\//i.test(url);

    if (isExternal) {
      window.location.assign(url);
      return null;
    }
    return <Navigate to={loginRedirect} replace />;
  }

  if (status === "LOCKED") {
    const handleUnlock = async () => {
      setError("");
      setIsUnlocking(true);
      try {
        await unlock(password);
      } catch {
        setError("Incorrect password. Please try again.");
      } finally {
        setIsUnlocking(false);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUnlock();
    };

    const handleClose = () => {
      logout();
      const url = loginRedirect;

      const isExternal = /^https?:\/\//i.test(url);

      if (isExternal) {
        window.location.assign(url);
        return null;
      }
      navigate(loginRedirect);
    };

    return (
      <Dialog open onOpenChange={(open: boolean) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Unlock Vault</DialogTitle>
            <DialogDescription>
              Your session is active, but your keys are locked.
              Enter your Master Password{" "}
              {user?.email ? `for ${user.email}` : ""} to continue.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isUnlocking}
              >
                {isUnlocking ? "Unlocking..." : "Unlock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return children;
}
