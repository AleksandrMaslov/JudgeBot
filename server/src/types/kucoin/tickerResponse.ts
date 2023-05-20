import { KucoinTickerData } from './tickerData'

export type KucoinTickerResponse = {
  data: {
    ticker: KucoinTickerData[]
    // "time":1602832092060,
  }
  // code: string
}
