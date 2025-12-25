import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import { ProtectedRoute } from "@repo/ui/components/protected-route";
import { AuthProvider } from "@repo/ui/context/auth-context";
import { AccountApi } from "@repo/api/account";
import { ThemeProvider } from "@repo/ui/components/theme-provider";
import { Toaster } from "@repo/ui/components/ui/sonner";

const authApi = AccountApi.getInstance(import.meta.env.VITE_AUTH_API_URL);

function App() {
  return (
    <>
      <Toaster richColors />
      <ThemeProvider>
        <AuthProvider api={authApi}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute loginRedirect={import.meta.env.VITE_AUTH_FRONTEND_URL + "/login"}>
                  <HomePage />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider >
      </ThemeProvider >
    </>
  );
}

export default App;
