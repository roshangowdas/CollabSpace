import { z } from 'zod'

/**
 * Reserved usernames that cannot be claimed by users
 */
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'collabspace',
  'support',
  'help',
  'api',
  'auth',
  'login',
  'register',
  'signup',
  'signin',
  'logout',
  'dashboard',
  'settings',
  'profile',
  'onboarding',
  'billing',
  'pricing',
  'team',
  'terms',
  'privacy',
  'system',
  'null',
  'undefined',
  'moderator',
  'bot',
]

/**
 * Username validation schema:
 * - 3 to 30 characters
 * - Alphanumeric characters and underscores only
 * - Must not start or end with an underscore
 * - Cannot be a reserved word
 */
export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  )
  .regex(
    /^[a-zA-Z0-9].*[a-zA-Z0-9]$/,
    'Username must begin and end with an alphanumeric character'
  )
  .refine(
    (val) => !RESERVED_USERNAMES.includes(val.toLowerCase()),
    'This username is reserved and cannot be claimed'
  )

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid work email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name must not exceed 60 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid work email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the Terms of Service to continue'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid work email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must not exceed 60 characters'),
  username: usernameSchema,
  jobTitle: z
    .string()
    .max(80, 'Job title must not exceed 80 characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(300, 'Bio must not exceed 300 characters')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Please provide a valid image URL')
    .or(z.literal(''))
    .optional(),
})

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name must not exceed 60 characters'),
  username: usernameSchema,
  bio: z
    .string()
    .max(300, 'Bio must not exceed 300 characters')
    .optional()
    .or(z.literal('')),
  teamRole: z
    .string()
    .min(1, 'Please select your role')
    .max(50, 'Role must not exceed 50 characters'),
})

/**
 * Workspace validation schemas
 */
export const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name cannot exceed 100 characters'),
  slug: z
    .string()
    .min(1, 'Workspace URL slug is required')
    .min(2, 'Slug must be at least 2 characters')
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9].*[a-z0-9]$/, 'Slug cannot begin or end with a hyphen'),
  description: z
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .or(z.literal('')),
  logoUrl: z
    .string()
    .url('Please enter a valid image URL')
    .optional()
    .or(z.literal('')),
})

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  role: z.enum(['Admin', 'Developer', 'Designer', 'Tester', 'Member'], {
    errorMap: () => ({ message: 'Please select a valid role (Admin, Developer, Designer, Tester, Member)' }),
  }),
})

/**
 * Project validation schemas
 */
export const projectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .min(2, 'Project name must be at least 2 characters')
      .max(120, 'Project name cannot exceed 120 characters'),
    key: z
      .string()
      .min(1, 'Project key is required')
      .min(2, 'Key must be at least 2 characters')
      .max(10, 'Key cannot exceed 10 characters')
      .regex(/^[A-Z0-9]+$/, 'Key must be uppercase letters and numbers only (e.g. COL, WEB, APP1)'),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    startDate: z
      .string()
      .optional()
      .or(z.literal('')),
    dueDate: z
      .string()
      .optional()
      .or(z.literal('')),
    visibility: z.enum(['workspace', 'private'], {
      errorMap: () => ({ message: 'Visibility must be either workspace or private' }),
    }).default('workspace'),
    status: z.enum(['active', 'paused', 'completed', 'archived'], {
      errorMap: () => ({ message: 'Please select a valid project status' }),
    }).default('active'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        const start = new Date(data.startDate).getTime()
        const due = new Date(data.dueDate).getTime()
        return isNaN(start) || isNaN(due) || due >= start
      }
      return true
    },
    {
      message: 'Due date must be on or after start date',
      path: ['dueDate'],
    }
  )

export const editProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .min(2, 'Project name must be at least 2 characters')
      .max(120, 'Project name cannot exceed 120 characters'),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    startDate: z
      .string()
      .optional()
      .or(z.literal('')),
    dueDate: z
      .string()
      .optional()
      .or(z.literal('')),
    visibility: z.enum(['workspace', 'private'], {
      errorMap: () => ({ message: 'Visibility must be either workspace or private' }),
    }),
    status: z.enum(['active', 'paused', 'completed', 'archived'], {
      errorMap: () => ({ message: 'Please select a valid project status' }),
    }),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        const start = new Date(data.startDate).getTime()
        const due = new Date(data.dueDate).getTime()
        return isNaN(start) || isNaN(due) || due >= start
      }
      return true
    },
    {
      message: 'Due date must be on or after start date',
      path: ['dueDate'],
    }
  )

export const projectMemberSchema = z.object({
  userId: z.string().min(1, 'Please select a user to add'),
  role: z.enum(['Lead', 'Contributor', 'Viewer'], {
    errorMap: () => ({ message: 'Role must be Lead, Contributor, or Viewer' }),
  }),
})

/**
 * Task validation schemas
 */
export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'completed']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(250, 'Title cannot exceed 250 characters'),
  projectId: z.string().min(1, 'Please select a project for this task'),
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'in_review', 'completed'], {
    errorMap: () => ({ message: 'Status must be Todo, In Progress, In Review, or Completed' }),
  }).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Priority must be Low, Medium, High, or Urgent' }),
  }).default('medium'),
  assigneeId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().min(0, 'Estimated hours must be a positive number').nullable())
    .optional(),
  labels: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
    ])
    .optional(),
})

export const editTaskSchema = taskSchema.partial().extend({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(250, 'Title cannot exceed 250 characters')
    .optional(),
})
