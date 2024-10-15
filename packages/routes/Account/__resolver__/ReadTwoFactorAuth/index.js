/*
 * EXPORTS
 */
import QRCode from 'qrcode' // Npm: QR code generator.
import { authenticator } from 'otplib' // Npm: One-time password library.


/*
 * EXPORTS
 */
export default async (__, { accountId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> ReadTwoFactorAuth'

      // Style guide.
      await Context.Debug({ 'message': 'Searching account details..' }, _functionName)

      // Fetch all account details from database.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': accountId } })

      /*
       * If getting account details contains error
       * than report failure
       */
      if (_AccountFindUnique && !(_AccountFindUnique instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given account details.' }, _functionName)

        // Local variable.
        let _qrCodeDataUrl

        // Only Generate secret if account email exists.
        if (_AccountFindUnique && _AccountFindUnique.email) {
          // Generate secret and otp auth URL
          const _secret = authenticator.generateSecret()

          // Generate QR code.
          const _qrCode = authenticator.keyuri(_AccountFindUnique?.email, 'SmsFlash', _secret)

          // Generate the QR code as a data URL
          _qrCodeDataUrl = await QRCode.toDataURL(_qrCode)

          // Only update if account has no 2FA enabled.
          if (!_AccountFindUnique.is2FAEnabled) {
            // Save the secret in database.
            await Context.DataBase.account.update({
              'where': {
                'id': accountId
              },
              'data': {
                'twoFactorAuthentication': _secret
              }
            })
          }
        }

        // Return account details.
        return ({ ..._AccountFindUnique, 'qrCode': _qrCodeDataUrl, 'message': 'Successfully read the accounts', 'status': 'READ_SUCCESSFUL' })
      }

      // Report failure.
      return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('FAILED_TO_FIND_ACCOUNT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
