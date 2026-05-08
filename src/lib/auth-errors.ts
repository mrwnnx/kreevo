import type { AuthError } from '@supabase/supabase-js'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type ErrorsT = Dictionary['auth']['errors']

export function translateAuthError(error: AuthError | { code?: string; message?: string }, t: ErrorsT): string {
  const code = (error as { code?: string }).code
  switch (code) {
    case 'invalid_credentials':
      return t.invalidCredentials
    case 'email_not_confirmed':
    case 'phone_not_confirmed':
      return t.emailNotConfirmed
    case 'user_already_exists':
    case 'email_exists':
    case 'phone_exists':
    case 'identity_already_exists':
      return t.userAlreadyExists
    case 'weak_password':
      return t.weakPassword
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return t.rateLimited
    case 'signup_disabled':
      return t.signupDisabled
    case 'email_address_invalid':
      return t.invalidEmail
    case 'same_password':
      return t.samePassword
    case 'user_not_found':
    case 'identity_not_found':
      return t.userNotFound
    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
      return t.sessionExpired
    case 'validation_failed':
    case 'bad_json':
      return t.validationFailed
    case 'email_provider_disabled':
    case 'phone_provider_disabled':
    case 'provider_disabled':
    case 'oauth_provider_not_supported':
    case 'anonymous_provider_disabled':
    case 'saml_provider_disabled':
      return t.providerDisabled
    case 'captcha_failed':
      return t.captchaFailed
    case 'email_address_not_authorized':
      return t.emailAddressNotAuthorized
    case 'bad_oauth_state':
    case 'bad_oauth_callback':
      return t.oauthError
    default:
      return t.generic
  }
}
