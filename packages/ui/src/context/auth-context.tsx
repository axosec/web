import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Api, type User } from "@repo/api/account";
import { Axosec } from "@repo/core";
import { fromBase64 } from "@repo/core/utils";

type AuthStatus = "LOADING" | "UNAUTHENTICATED" | "LOCKED" | "AUTHENTICATED";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  privateKey: Uint8Array | null;
}

interface AuthContextType extends AuthState {
  unlock: (password: string) => Promise<void>;
  login: (user: User, privKey: Uint8Array) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const axo = Axosec.getInstance();

export function AuthProvider({ children, api }: { children: ReactNode, api: Api }) {
  const [state, setState] = useState<AuthState>({
    status: "LOADING",
    user: null,
    privateKey: null,
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const userProfile = await api.getSelf();

      setState({
        status: "LOCKED",
        user: userProfile,
        privateKey: null,
      });
    } catch (err) {
      console.error("Session check failed", err);
      setState(s => ({ ...s, status: "UNAUTHENTICATED" }));
    }
  };

  const unlock = async (password: string) => {
    if (!state.user) throw new Error("No user to unlock");

    try {
      const saltBytes = fromBase64(state.user.salt);
      const masterKey = await axo.deriveKey(password, saltBytes);

      const encKeyBytes = fromBase64(state.user.enc_private_key);
      const privateKey = await axo.decrypt(encKeyBytes, masterKey);

      setState(s => ({
        ...s,
        status: "AUTHENTICATED",
        privateKey: privateKey
      }));
    } catch (err) {
      throw new Error("Incorrect password");
    }
  };

  const login = (user: User, privKey: Uint8Array) => {
    setState({
      status: "AUTHENTICATED",
      user: user,
      privateKey: privKey
    });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) { }

    setState({
      status: "UNAUTHENTICATED",
      user: null,
      privateKey: null
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, unlock, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
