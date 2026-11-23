/**
 * Centralized Supabase & PostgREST database error handler for CollabSpace.
 * Translates PostgreSQL error codes and Supabase Auth errors into user-friendly messages.
 */

export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  INSUFFICIENT_PRIVILEGE: '42501',
  UNDEFINED_TABLE: '42P01',
  ROW_LEVEL_SECURITY_VIOLATION: 'PGRST301',
  SINGLE_ROW_EXPECTED: 'PGRST116',
}

/**
 * Parses and returns a clean, user-friendly error object.
 * @param {Error|{ message: string, code?: string, details?: string, hint?: string }} error
 * @returns {{ title: string, message: string, code: string, isNetworkError: boolean }}
 */
export function handleDatabaseError(error) {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unknown error occurred.',
      code: 'UNKNOWN',
      isNetworkError: false,
    }
  }

  const code = error.code || 'UNKNOWN'
  const rawMessage = error.message || String(error)
  const isNetwork =
    rawMessage.includes('Failed to fetch') ||
    rawMessage.includes('NetworkError') ||
    rawMessage.includes('network') ||
    rawMessage.includes('timeout')

  let title = 'Database Operation Failed'
  let message = rawMessage

  switch (code) {
    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      title = 'Duplicate Record'
      message = 'A record with this identifier or email already exists.'
      break

    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      title = 'Reference Error'
      message = 'The referenced workspace, channel, or user could not be found.'
      break

    case PG_ERROR_CODES.INSUFFICIENT_PRIVILEGE:
    case '42501':
      title = 'Access Denied'
      message = 'You do not have permission to perform this action. Row Level Security policy blocked this request.'
      break

    case PG_ERROR_CODES.SINGLE_ROW_EXPECTED:
      title = 'Record Not Found'
      message = 'The requested item could not be found in the workspace.'
      break

    case 'PGRST204':
      title = 'Table Probe Response'
      message = 'PostgreSQL responded to schema probe.'
      break

    default:
      if (isNetwork) {
        title = 'Connection Error'
        message = 'Could not reach Supabase. Please check your internet connection and verify VITE_SUPABASE_URL in .env.'
      } else if (rawMessage.includes('Invalid login credentials')) {
        title = 'Invalid Credentials'
        message = 'The email address or password provided is incorrect.'
      } else if (rawMessage.includes('Email not confirmed')) {
        title = 'Email Verification Required'
        message = 'Please check your inbox to verify your email before logging in.'
      } else if (rawMessage.includes('User already registered')) {
        title = 'Account Already Exists'
        message = 'An account with this email address is already registered.'
      }
      break
  }

  return {
    title,
    message,
    code,
    details: error.details || error.hint || null,
    isNetworkError: isNetwork,
  }
}

