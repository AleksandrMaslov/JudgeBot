import { KucoinSymbolData } from './symbolData'

export type KucoinSymbolResponse = {
  data: KucoinSymbolData[]

  // "timezone": "UTC",
  // "serverTime": 1565246363776,
  // "rateLimits": [
  //   {
  //     //These are defined in the `ENUM definitions` section under `Rate Limiters (rateLimitType)`.
  //     //All limits are optional
  //   }
  // ],
  // "exchangeFilters": [
  //   //These are the defined filters in the `Filters` section.
  //   //All filters are optional.
  // ],
}
