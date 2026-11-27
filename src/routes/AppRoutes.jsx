import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  PageLoadingSkeleton,
  ErrorBoundary,
} from '@/components/common'

// Static import for critical path landing page and 404
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Lazy-loaded routes for code-splitting and sub-250kB initial bundle
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AccountSettingsPage = lazy(() => import('@/pages/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
const InvitationAcceptPage = lazy(() => import('@/pages/InvitationAcceptPage').then((m) => ({ default: m.InvitationAcceptPage })))

const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailsPage = lazy(() => import('@/pages/ProjectDetailsPage').then((m) => ({ default: m.ProjectDetailsPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const MyTasksPage = lazy(() => import('@/pages/MyTasksPage').then((m) => ({ default: m.MyTasksPage })))
const ChatPage = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })))
const NotificationCenterPage = lazy(() => import('@/pages/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })))
const FileManagerPage = lazy(() => import('@/pages/FileManagerPage').then((m) => ({ default: m.FileManagerPage })))

const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })))
const DocumentEditorPage = lazy(() => import('@/pages/DocumentEditorPage').then((m) => ({ default: m.DocumentEditorPage })))
const WhiteboardsPage = lazy(() => import('@/pages/WhiteboardsPage').then((m) => ({ default: m.WhiteboardsPage })))
const WhiteboardCanvasPage = lazy(() => import('@/pages/WhiteboardCanvasPage').then((m) => ({ default: m.WhiteboardCanvasPage })))

const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const WorkspaceAdminPage = lazy(() => import('@/pages/WorkspaceAdminPage').then((m) => ({ default: m.WorkspaceAdminPage })))
const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })))

// Legal & Compliance Pages
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const CookiePolicyPage = lazy(() => import('@/pages/legal/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage })))
const RefundPolicyPage = lazy(() => import('@/pages/legal/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })))

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSkeleton />}>
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
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
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
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:documentId"
            element={
              <ProtectedRoute>
                <DocumentEditorPage />
              </ProtectedRoute>
            }
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
      </Suspense>
    </ErrorBoundary>
  )
}

export default AppRoutes
