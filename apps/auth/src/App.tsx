import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ProtectedRoute } from "@repo/ui/components/protected-route";
import { AuthProvider } from "@repo/ui/context/auth-context";
import { Api } from "@repo/api/account";
import AppSidebar, { type ItemProps } from "@repo/ui/components/app-sidebar";
import { ThemeProvider } from "@repo/ui/components/theme-provider";
import { House, KeyRound, User } from "lucide-react";
import { Toaster } from "@repo/ui/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@repo/ui/components/ui/sidebar";

import { Separator } from "@repo/ui/components/ui/separator";

const api = Api.getInstance(import.meta.env.VITE_API_URL);

const navGroups: ItemProps = [
  {
    groupName: "Account",
    items: [
      {
        title: "Home",
        url: "/",
        icon: House,
      },
      {
        title: "Account and Password",
        url: "/account",
        icon: User,
      },
      {
        title: "Recovery",
        url: "/recovery",
        icon: KeyRound,
      },
    ],
  },
];

function App() {
  return (
    <>
      <Toaster richColors />
      <ThemeProvider>
        <AuthProvider api={api}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <SidebarProvider>
                  <AppSidebar name="Axosec Auth" groups={navGroups} />
                  <div className="py-4 w-full">
                    <header className="flex justify-between px-4">
                      <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <Separator orientation="vertical" />
                        <span>Home</span>
                      </div>
                    </header>
                    <main className="p-4">
                      <ProtectedRoute>
                        <Outlet />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              }>
                <Route index element={<HomePage />} />
                <Route path="account" element={<h1>Account settings</h1>} />
                <Route path="recovery" element={<h1>There are currently no recovery options</h1>} />
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
