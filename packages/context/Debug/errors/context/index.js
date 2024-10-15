/*
 * GLOBALS
 */
const _errorList = {
  'MISSING__CONTEXT': 'Context for given call. Please make sure Context is passed to every handler called',
  'NOT__CONSTRUCTOR': 'It seems that you are calling object as function instead calling it as constructor.',
  'REQUIRE__ADMIN__LOGIN': 'Access Denied. Please login as admin and try again',
  'REQUIRE__LOGIN': 'Access Denied. Please login with your login credentials.',
  'RATE__LIMIT': 'You have exceeded the rate limit. Please try again later.',
  'LIMIT__EXCEEDED': 'Its too hot here. kindly slow down with your upload.',
  'SESSION_NOT_BOUND': 'Session is not bound to the given context. Please make sure you are passing correct session and try again',
  'FAILED_TO_FIND_ACCOUNT': 'Failed to find account for given details. Please make sure you are passing correct details and try again',
  'ACCOUNT__AUTHENTICATION__FAILED': 'You are not authenticated to perform this action. Please login with correct account type and try again',
  'ACCOUNT__AUTHORIZATION__FAILED': 'You are not authorized to perform this action. Please login with correct account type and try again'
}


/*
 * EXPORTS
 */
export default ({ error }) => {
  // Error handling.
  try {
    // Const assignment.
    const _errorMessage = error && error.message ? error?.message?.toUpperCase?.() : error?.toString()?.toUpperCase?.()

    // Only return if error is present else skip.
    if (_errorList && _errorList[_errorMessage]) {
      // Report failure.
      return {
        'message': _errorList[_errorMessage],
        'status': _errorMessage
      }
    }

    // Report failure.
    return void 0
  } catch (errorr) {
    // Report failure.
    return errorr
  }
}
