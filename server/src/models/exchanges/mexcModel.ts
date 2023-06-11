import axios from 'axios'
import { ExchangeModel } from './base/exchangeModel.js'
import { MexcTickerResponse, MexcTickerData, TickerUpdate } from '../../types'

export class MexcModel extends ExchangeModel {
  private refreshTimer: number
  private lastRefreshTime: number

  constructor() {
    super()

    this.exchangeUrl = 'https://www.mexc.com/'
    this.tickersUrl = 'https://api.mexc.com/api/v3/ticker/bookTicker'
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
    data: MexcTickerResponse
  }): MexcTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: MexcTickerData[]): MexcTickerData[] {
    return tickersData.filter((tickerData: MexcTickerData) => {
      const { askPrice, askQty, bidPrice, bidQty } = tickerData
      return (
        parseFloat(askPrice) !== 0 &&
        parseFloat(askQty) !== 0 &&
        parseFloat(bidPrice) !== 0 &&
        parseFloat(bidQty) !== 0
      )
    })
  }

  parseTickerData(tickerData: MexcTickerData): TickerUpdate {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = tickerData
    return {
      symbol: symbol,
      askPrice: parseFloat(askPrice),
      askQty: parseFloat(askQty),
      bidPrice: parseFloat(bidPrice),
      bidQty: parseFloat(bidQty),
    }
  }

  // PRIVATE METHOD
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
