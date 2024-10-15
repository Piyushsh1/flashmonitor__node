/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import { AES, enc } from 'crypto-js' // Npm: Crypto-js for hashing graphql queries.


/*
 * OBJECTS
 */
const isAuthenticated = async (__resolve, __directiveArgs, __, ___, Context, ____) => {
  // Const assignment.
  const _functionName = `Routes -> Account -> isAuthenticated(${____.fieldName})`

  /*
   * Only proceed if user is logged in
   * else report failure.
   */
  if (Context && Context.Session && Context.Session.isLoggedIn && !Context.isSmppExecution) {
    // Local variable.
    let _isBrowser

    // Style guide.
    Context.Debug({ 'message': 'User is logged in.' }, _functionName)

    /*
     * Report failure if __directiveArgs doesnt matches to current
     * user role.
     */
    if (__directiveArgs && __directiveArgs.accountType && __directiveArgs.accountType !== Context.Session.user.accountType) {
      // Style guide.
      Context.Debug({ 'message': 'User role does not match.' }, _functionName)

      // Report failure.
      return new Error('UNAUTHORIZED_ACCESS')
    }

    // Check if token is required.
    if (__directiveArgs.requireToken && _.isEmpty(Context.Session.headers['d-authorization'])) {
      // Style guide.
      Context.Debug({ 'message': 'Token is required.' }, _functionName)

      // Report failure.
      return new Error('UNAUTHORIZED_ACCESS')
    }

    // Const assignment.
    _isBrowser = Context?.Session?.headers?.['b-authorization']

    // If isBrowser is present then decrypt it.
    if (_isBrowser) {
      // Decrypt isBrowser.
      _isBrowser = AES.decrypt(_isBrowser, process.env.APP_PASSWORD)
      _isBrowser = _isBrowser.toString(enc.Utf8)
    }

    /*
     * Check if given request is from browser or not.
     * if not then check if user has provided accessToken.
     */
    if (_.isEmpty(_isBrowser) || !_isBrowser?.includes('WTF')) {
      // Style guide.
      Context.Debug({ 'message': 'Request is not from browser.' }, _functionName)

      // Check if header has accessToken.
      if (!Context?.Session?.headers?.['d-authorization']) return new Error('REQUIRE_ACCESS_TOKEN')

      // Load account which contains this accessToken.
      const _AccountFindMany = await Context.DataBase.account.findMany({ 'where': { 'AccessToken': { 'some': { 'token': Context.Session.headers['d-authorization'] } } } })

      // If account is not found then report failure.
      if (_AccountFindMany instanceof Error) return _AccountFindMany
      if (_.isEmpty(_AccountFindMany)) return new Error('UNAUTHORIZED_ACCESS')

      // Check if given accessToken belongs to user or not.
      if (!_.flatten(_.pluck(_AccountFindMany, 'id'))?.includes(Context.Session.user.id)) return new Error('UNAUTHORIZED_ACCESS')

      // Return the original resolver.
      return __resolve(__, ___, Context, ____)
    }

    // Style guide.
    Context.Debug({ 'message': 'Request is from browser.' }, _functionName)

    // Return the original resolver.
    return __resolve(__, ___, Context, ____)
  } else if (Context.isSmppExecution) {
    // Style guide.
    Context.Debug({ 'message': 'Smpp executing graph..' }, _functionName)

    // Return the original resolver.
    return __resolve(__, ___, Context, ____)
  }

  // Style guide.
  Context.Debug({ 'message': 'User is not logged in reporting failure.' }, _functionName)

  // Else report failure.
  return new Error('REQUIRE__LOGIN')
}


/*
 * EXPORTS
 */
export default isAuthenticated
