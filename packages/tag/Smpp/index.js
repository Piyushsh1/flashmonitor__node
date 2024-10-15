/*
 * EXPORTS
 */
export default {
  'DebuggingIpPort': (s, j) => `SMPP__DEBUGGING::${s}__${j}`,
  'Notification': s => `SMPP__NOTIFICATION::${s}`,
  'Session': s => `SMPP__SESSION::${s}`,
  'id': s => `SMPP__ID::${s}`
}
