import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/auth.context";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AppPage } from "./pages/AppPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminKnowledgePage } from "./pages/AdminKnowledgePage";
import { AdminDocumentsPage } from "./pages/AdminDocumentsPage";
import { AdminLayout } from "./features/admin/components/AdminLayout";
import { AdminUsersPage } from "./features/admin/pages/AdminUsersPage";
import { AdminUserDetailPage } from "./features/admin/pages/AdminUserDetailPage";
import { AdminUserConversationPage } from "./features/admin/pages/AdminUserConversationPage";
import { AdminProvidersPage } from "./features/admin/pages/AdminProvidersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicRoute>
                <VerifyOtpPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/chat/:conversationId"
            element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/*
            Nested layout route: AdminLayout renders the persistent sidebar/header shell
            once and an <Outlet/> for whichever admin page matches below — the least
            disruptive way to add shared chrome without touching how ProtectedRoute/
            AdminRoute already compose (each still wraps the whole subtree exactly once).
          */}
          <Route
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/app/admin" element={<AdminDashboardPage />} />
            <Route path="/app/admin/users" element={<AdminUsersPage />} />
            <Route path="/app/admin/users/:userId" element={<AdminUserDetailPage />} />
            <Route
              path="/app/admin/users/:userId/conversations/:conversationId"
              element={<AdminUserConversationPage />}
            />
            <Route path="/app/admin/knowledge" element={<AdminKnowledgePage />} />
            <Route path="/app/admin/documents" element={<AdminDocumentsPage />} />
            <Route path="/app/admin/providers" element={<AdminProvidersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
