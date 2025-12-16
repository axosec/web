import { useState, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Dialog } from "./dialog";
import "./protected-route.css";
import { Button } from "./button";
import { Form, Input } from "./form";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status, user, unlock, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (status === "LOADING") {
    return <div className="lock-loading">Loading environment...</div>;
  }

  if (status === "UNAUTHENTICATED") {
    return <Navigate to="/login" replace />;
  }

  if (status === "LOCKED") {

    const handleUnlock = async () => {
      setError("");
      setIsUnlocking(true);
      try {
        await unlock(password);
      } catch (e: any) {
        setError("Incorrect password. Please try again.");
      } finally {
        setIsUnlocking(false);
      }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      handleUnlock()
    }

    const handleClose = () => {
      logout();
      navigate("/login");
    };

    return (
      <div className="lock-screen">
        <p>Session Locked. Authentication required.</p>

        <Dialog
          open={true}
          onClose={handleClose}
          title="Unlock Vault"
          footer={
            <div className="lock-footer">
              <Button
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnlock}
                variant="secondary"
                disabled={isUnlocking}
              >
                {isUnlocking ? "Unlocking..." : "Unlock"}
              </Button>
            </div>
          }
        >
          <div className="lock-dialog-body">
            <p className="lock-description">
              Your session is active, but your keys are locked.
              Enter your Master Password {"for " + user?.email || ""} to continue.
            </p>

            <Form className="lock-input-container" onSubmit={handleFormSubmit}>
              <Input
                type="password"
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="lock-error">{error}</p>}
            </Form>
          </div>
        </Dialog>
      </div>
    );
  }

  return children;
}