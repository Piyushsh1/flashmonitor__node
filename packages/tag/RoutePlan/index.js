/*
 * EXPORTS
 */
export default {
  'ClientByIp': __e => `ROUTE__IP::${__e}`,
  'ClientById': __e => `ROUTE__ID::${__e}`,
  'ClientByIpMccMnc': (__e, __mcc, __mnc) => `ROUTE__IP_MCC_MNC::${__e}__${__mcc}__${__mnc}`,
  'ClientByIdMccMnc': (__e, __mcc, __mnc) => `ROUTE__ID_MCC_MNC::${__e}__${__mcc}__${__mnc}`,
  'ClientByRouteId': __e => `ROUTE_PLAN__ROUTE_ID::${__e}`
}
