import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/common'
import {
  HomePage,
  NotFoundPage,
  DesignSystemPage,
  DashboardPage,
  ProfilePage,
  AccountSettingsPage,
  OnboardingPage,
  InvitationAcceptPage,
  ProjectsPage,
  ProjectDetailsPage,
  TasksPage,
  MyTasksPage,
  ChatPage,
  NotificationCenterPage,
  FileManagerPage,
  DocumentsPage,
  DocumentEditorPage,
  WhiteboardsPage,
  WhiteboardCanvasPage,
  AnalyticsPage,
  WorkspaceAdminPage,
  RegisterPage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  PrivacyPolicyPage,
  TermsPage,
  CookiePolicyPage,
  RefundPolicyPage,
} from '@/pages'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<HomePage />} />

      {/* Public Legal & Compliance Routes (DPDP Act 2023 & SaaS Terms) */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/refund" element={<RefundPolicyPage />} />
      <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
      <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
      <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />
      <Route path="/refund-policy" element={<Navigate to="/refund" replace />} />

      {/* Workspace Invitation Acceptance Route */}
      <Route path="/invite/:token" element={<InvitationAcceptPage />} />

      {/* Public Only Authentication Routes (redirects logged-in users to /dashboard) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Routes (requires active Supabase session) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics-preview"
        element={<Navigate to="/analytics" replace />}
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks-preview"
        element={<Navigate to="/tasks" replace />}
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:projectId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-preview"
        element={<Navigate to="/chat" replace />}
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/files"
        element={
          <ProtectedRoute>
            <FileManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs/:documentId"
        element={
          <ProtectedRoute>
            <DocumentEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs-preview"
        element={<Navigate to="/docs" replace />}
      />
      <Route
        path="/whiteboards"
        element={
          <ProtectedRoute>
            <WhiteboardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/whiteboards/:whiteboardId"
        element={
          <ProtectedRoute>
            <WhiteboardCanvasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/admin"
        element={<WorkspaceAdminPage />}
      />
      <Route
        path="/admin"
        element={<WorkspaceAdminPage />}
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-settings"
        element={<Navigate to="/settings" replace />}
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Design System Showcase */}
      <Route path="/design-system" element={<DesignSystemPage />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
