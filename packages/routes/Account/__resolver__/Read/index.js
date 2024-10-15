/*
 * EXPORTS
 */
import QRCode from 'qrcode' // Npm: QR code generator.
import _ from 'underscore' // NPM: Utility module.
import { authenticator } from 'otplib' // Npm: One-time password library.


/*
 * EXPORTS
 */
export default async (__, { accountId, emailId, referralId, accountType, take, skip, search }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = {}

      // Const assignment.
      const _functionName = 'Routes -> Account -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching account details..' }, _functionName)

      // Conditional query based on args.
      if (_.isEmpty(_whatToQuery) && !_.isEmpty(emailId)) Object.assign(_whatToQuery, ({ 'email': emailId }))
      if (!_.isEmpty(accountType)) Object.assign(_whatToQuery, { 'accountType': accountType })
      if (_.isEmpty(_whatToQuery) && !_.isEmpty(referralId)) Object.assign(_whatToQuery, ({ 'referralId': referralId }))
      if (_.isEmpty(_whatToQuery) && !_.isEmpty(accountId)) Object.assign(_whatToQuery, ({ 'id': accountId }))
      if (!_.isEmpty(search)) Object.assign(_whatToQuery, ({ 'OR': [{ 'displayName': { 'startsWith': search, 'mode': 'insensitive' } }, { 'email': { 'startsWith': search, 'mode': 'insensitive' } }] }))
      Object.assign(_whatToQuery, { 'isDeleted': false, 'accountType': { 'not': 'ADMIN' } })

      // Fetch count of account table.
      const _totalCount = await Context.DataBase.account.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all account details from database.
      const _AccountFindMany = await Context.DataBase.account.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'isBlocked': true,
          'displayName': true,
          'thumbnailStoredAt': true,
          'accountType': true,
          'email': true,
          'is2FAEnabled': true,
          'bio': true,
          'fullName': true,
          'profileCoverThumbnailStoredAt': true,
          'CustomerLogin': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true
            }
          },
          'VendorLogin': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true
            }
          }
        },
        'orderBy': {
          'updatedAt': 'desc'
        },
        take,
        skip
      })

      /*
       * If getting account details contains error
       * than report failure
       */
      if (_AccountFindMany && !(_AccountFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given account details.' }, _functionName)

        // Return account details.
        return _AccountFindMany?.map(async j => {
          // Local variable.
          let _qrCodeDataUrl

          // Only Generate secret if account email exists.
          if (j && j.email) {
            // Generate secret and otp auth URL
            const _secret = authenticator.generateSecret()

            // Generate QR code.
            const _qrCode = authenticator.keyuri(j?.email, 'SmsFlash', _secret)

            // Generate the QR code as a data URL
            _qrCodeDataUrl = await QRCode.toDataURL(_qrCode)
          }

          // Return account details.
          return ({ ...j, _totalCount, '_patch_showcaseURL': _qrCodeDataUrl, 'message': 'Successfully read the accounts', 'status': 'READ_SUCCESSFUL' })
        })
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to get account details with id: ${emailId ?? referralId}`, 'error': _AccountFindMany }, _functionName)

      // Report failure.
      return _AccountFindMany instanceof Error ? _AccountFindMany : new Error('FAILED_TO_FIND_ACCOUNT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
