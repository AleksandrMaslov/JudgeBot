import axios from 'axios'
import { ExchangeModel } from './base/exchangeModel.js'
import {
  KrakenTickerResponse,
  KrakenTickerData,
  TickerUpdate,
} from '../../types'

export class KrakenModel extends ExchangeModel {
  private refreshTimer: number
  private lastRefreshTime: number

  constructor() {
    super()

    this.tickersUrl = 'https://api.kraken.com/0/public/Ticker'
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
    data: KrakenTickerResponse
  }): KrakenTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(data: any): KrakenTickerData[] {
    const { result } = data
    const tickersData = Object.entries(result).map((pair: any) => {
      const [symbol, parameters] = pair
      const { a, b } = parameters
      const [askPrice, x, askQty] = a
      const [bidPrice, y, bidQty] = b

      return {
        symbol: symbol,
        askPrice: parseFloat(askPrice),
        askQty: parseFloat(askQty),
        bidPrice: parseFloat(bidPrice),
        bidQty: parseFloat(bidQty),
      }
    })

    return tickersData.filter((t: KrakenTickerData) => {
      const { askPrice, askQty, bidPrice, bidQty } = t
      return askPrice !== 0 && askQty !== 0 && bidPrice !== 0 && bidQty !== 0
    })
  }

  parseTickerData(tickerData: KrakenTickerData): TickerUpdate {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = tickerData
    return {
      symbol: symbol,
      askPrice: askPrice,
      askQty: askQty,
      bidPrice: bidPrice,
      bidQty: bidQty,
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
