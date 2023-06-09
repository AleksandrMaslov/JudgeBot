import { ExchangeModel } from './base/exchangeModel.js'
import {
  BitfinexTickerResponse,
  BitfinexTickerData,
  TickerUpdate,
} from '../../types'
import axios from 'axios'

export class BitfinexModel extends ExchangeModel {
  private refreshTimer: number
  private lastRefreshTime: number

  constructor() {
    super()

    this.tickersUrl = 'https://api-pub.bitfinex.com/v2/tickers?symbols=ALL'
    this.wsConnectionUrl =
      'wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
    this.senderPrefix = this.constructor.name

    this.refreshTimer = 1000
    this.lastRefreshTime = Date.now()

    this.init()
    this.defineRefreshTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: BitfinexTickerResponse
  }): BitfinexTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: BitfinexTickerData[]): BitfinexTickerData[] {
    return tickersData.filter((tickerData: BitfinexTickerData) => {
      const [symbol, bid, bidQuantity, ask, askQuantity, ...rest] = tickerData
      return (
        ask !== 0 &&
        askQuantity !== 0 &&
        bid !== 0 &&
        bidQuantity !== 0 &&
        !symbol.startsWith('f') &&
        !symbol.includes('TEST') &&
        !symbol.includes(':')
      )
    })
  }

  parseTickerData(tickerData: BitfinexTickerData): TickerUpdate {
    const [symbol, bid, bidQuantity, ask, askQuantity, ...rest] = tickerData
    return {
      symbol: symbol.replace('t', '').replace('UST', 'USDT'),
      askPrice: ask,
      askQty: askQuantity,
      bidPrice: bid,
      bidQty: bidQuantity,
    }
  }

  // PRIVATE
  async defineRefreshTimer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      while (!this.isTimeToRefresh()) await this.delay(1000)
      this.refresh()
      resolve()
      this.defineRefreshTimer()
    })
  }

  private isTimeToRefresh(): boolean {
    const current = Date.now()
    const diff = current - this.lastRefreshTime
    if (diff > this.refreshTimer) return true
    return false
  }

  private async refresh(): Promise<void> {
    this.lastRefreshTime = Date.now()
    if (!this.tickersUrl) return

    await axios
      .get(this.tickersUrl)

      .then((response) => {
        const rawTickersData = this.parseTickersResponse(response)
        this.updated = rawTickersData.length

        rawTickersData.forEach((rawTickerData: any) => {
          const tickerData = this.parseTickerData(rawTickerData)
          this.ensureTicker(tickerData)
          this.updateTickerData(tickerData)
        })
      })
  }
}
