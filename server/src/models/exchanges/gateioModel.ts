import axios from 'axios'
import { ExchangeModel } from './base/exchangeModel.js'
import {
  GateioTickerResponse,
  GateioTickerData,
  GateioTicker,
  TickerUpdate,
} from '../../types'

export class GateioModel extends ExchangeModel {
  private refreshTimer: number
  private lastRefreshTime: number

  constructor() {
    super()

    this.tickersUrl = 'https://api.gateio.ws/api/v4/spot/currency_pairs'
    this.wsConnectionUrl =
      'wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
    this.senderPrefix = this.constructor.name

    this.refreshTimer = 10000
    this.lastRefreshTime = Date.now()

    this.init()
    this.defineRefreshTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: GateioTickerResponse
  }): GateioTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: GateioTickerData[]): GateioTickerData[] {
    return tickersData.filter((tickerData: GateioTickerData) => {
      const { trade_status } = tickerData
      return trade_status === 'tradable'
    })
  }

  parseTickerData(tickerData: GateioTickerData): TickerUpdate {
    const { id } = tickerData
    return {
      symbol: id,
      askPrice: undefined,
      askQty: undefined,
      bidPrice: undefined,
      bidQty: undefined,
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
    const url = 'https://api.gateio.ws/api/v4/spot/order_book?currency_pair='
    if (Object.keys(this.tickers).length < 1) return

    const symbols = Object.keys(this.tickers)

    symbols.map(async (s) => {
      axios.get(`${url}${s}`).then(async (response) => {
        const { data } = response
        console.log(data)

        // console.log(data)
        // this.updated = rawTickersData.length
        // rawTickersData.forEach((rawTickerData: any) => {
        //   const tickerData = this.parseTickerData(rawTickerData)
        //   this.ensureTicker(tickerData)
        //   this.updateTickerData(tickerData)
        // })
        // await this.delay(500)
      })
    })
  }
}
