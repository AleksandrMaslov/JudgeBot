import { CoinbaseTickerData } from './tickerData'

export type CoinbaseTickerResponse = {
  type: string
  products: CoinbaseTickerData[]
  // currencies: []
}
