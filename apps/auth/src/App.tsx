import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ProtectedRoute } from "@repo/ui/components/protected-route";
import { AuthProvider } from "@repo/ui/context/auth-context";
import { Api } from "@repo/api/account";
import AppSidebar from "@repo/ui/components/app-sidebar";
import { ThemeProvider } from "@repo/ui/components/theme-provider";
import { House, User } from "lucide-react";
import { Toaster } from "@repo/ui/components/ui/sonner";

const api = Api.getInstance(import.meta.env.VITE_API_URL);

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: House,
  },
  {
    title: "Account",
    url: "/account",
    icon: User,
  },
];

function App() {
  return (
    <>
      <Toaster richColors/>
      <ThemeProvider>
        <AuthProvider api={api}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppSidebar name="Axosec" items={navItems}>
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              </AppSidebar>
              }>
                <Route index element={<HomePage />} />
                <Route path="account" element={<h1>Hello guys</h1>} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
