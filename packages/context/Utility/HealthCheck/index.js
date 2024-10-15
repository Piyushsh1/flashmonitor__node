/*
 * IMPORTS
 */
import __debug from 'debug' // Npm: debug module.
import Net from 'net' // Core: net module by node.js


/*
 * OBJECTS
 */
const HealthCheck = async (__host, __port) => {
  // Error handling.
  try {
    /*
     * If only host is provided then use
     * ping.js
     */
    if (__host && !__port) {
      // Const assignment.
      const _Debug = __debug('Context -> Utility -> HealthCheck')
      const _AbortController = new AbortController()
      const $options = {
        'method': 'HEAD',
        'mode': 'no-cors',
        'signal': _AbortController.signal
      }

      // Error handling.
      try {
        // Style guide.
        _Debug(`Checking if host: ${__host} is up and running.`)

        // Const assignment.
        const _FetchPromise = fetch(`http://${__host}`, $options)
        const _TimeoutPromise = new Promise((_, __reject) => { const j = setTimeout(() => { _Debug(`Checking if host: ${__host} is up and running.`); __reject(new Error(`HOST_DOWN_OR_UNREACHABLE`)); clearTimeout(j) }) }, 3000)

        // Await for the promise to resolve.
        await Promise.race([_FetchPromise, _TimeoutPromise])

        // Return success.
        return {
          'message': `Host ${__host} is up and running.`,
          'status': 'HOST_ALIVE'
        }
      } catch (error) {
        // Report error.
        return error
      } finally {
        // Abort fetch operation.
        _AbortController.abort()
      }
    }

    // Connect to given host and port.
    const _NetCreateConnection = await new Promise(__resolve => {
      // Const assignment.
      const _Client = Net.createConnection({ 'host': __host, 'port': __port }, () => { _Client.end() ;__resolve(true) })

      // Event listener.
      _Client.on('error', () => __resolve(false))
    })

    // If connecting to given host and port caught exception then report failure.
    if (!_NetCreateConnection || _NetCreateConnection instanceof Error) return new Error('HOST_DOWN_OR_UNREACHABLE')

    // Return success.
    return {
      'message': `Host ${__host} is up and running.`,
      'status': 'HOST_ALIVE'
    }
  } catch (error) {
    /*
     * Error handling for all possible.
     * network errors.
     */
    if (error.message.includes('ECONNREFUSED')) return new Error('ECONNREFUSED')
    if (error.message.includes('ECONNRESET')) return new Error('ECONNRESET')
    if (error.message.includes('ENOTFOUND')) return new Error('ENOTFOUND')
    if (error.message.includes('ETIMEDOUT')) return new Error('ETIMEDOUT')
    if (error.message.includes('EHOSTUNREACH')) return new Error('EHOSTUNREACH')
    if (error.message.includes('EHOSTDOWN')) return new Error('EHOSTDOWN')
    if (error.message.includes('EPIPE')) return new Error('EPIPE')
    if (error.message.includes('EAI_AGAIN')) return new Error('EAI_AGAIN')
    if (error.message.includes('ECONNABORTED')) return new Error('ECONNABORTED')
    if (error.message.includes('ECONNRESET')) return new Error('ECONNRESET')

    // Report failure.
    return new Error('HOST_DOWN_OR_UNREACHABLE')
  }
}


/*
 * EXPORTS
 */
export default HealthCheck
