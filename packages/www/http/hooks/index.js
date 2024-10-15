/*
 * IMPORTS
 */
import postStart from './postStart'
import preStart from './preStart'
import preStop from './preStop'
import postStop from './postStop'


/*
 * EXPORTS
 */
export default async (__hookName, __Context) => {
  // Const assignment.
  const _hooks = {
    'preStart': preStart,
    'postStart': postStart,
    'preStop': preStop,
    'postStop': postStop
  }

  // Return hook execution.
  return _hooks?.[__hookName]?.(await __Context?.({ 'request': {} }))
}
