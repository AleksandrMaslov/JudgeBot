import { ExchangeModel } from './base/exchangeModel.js'
import {
  TidexTickerResponse,
  TidexTickerData,
  TidexTicker,
  TickerUpdate,
} from '../../types'

export class TidexModel extends ExchangeModel {
  private refreshTimer: number
  private lastRefreshTime: number

  constructor() {
    super()

    this.tickersUrl = 'https://api.tidex.com/api/v1/public/tickers'
    this.wsConnectionUrl = 'wss://ws.tidex.com/'
    this.pingMessage = {
      method: 'server.ping',
      params: [],
      id: Date.now(),
    }

    this.senderPrefix = this.constructor.name

    this.refreshTimer = 1000
    this.lastRefreshTime = Date.now()

    this.init()
    this.defineRefreshTimer()
    this.definePingTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: TidexTickerResponse
  }): TidexTickerData[] {
    const { data } = response
    const { result } = data
    const tickers = Object.entries(result).map((pair: any) => {
      const [symbol, tickerData] = pair
      const { ticker } = tickerData
      const { ask, bid } = ticker
      return {
        symbol,
        ask,
        bid,
      }
    })
    return this.getValidTickers(tickers)
  }

  getValidTickers(tickersData: TidexTickerData[]): TidexTickerData[] {
    return tickersData.filter((tickerData: TidexTickerData) => {
      const { ask, bid } = tickerData
      return parseFloat(ask) !== 0 && parseFloat(bid) !== 0
    })
  }

  parseTickerData(tickerData: TidexTickerData): TickerUpdate {
    const { symbol, ask, bid } = tickerData
    return {
      symbol: symbol,
      askPrice: parseFloat(ask),
      askQty: undefined,
      bidPrice: parseFloat(bid),
      bidQty: undefined,
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    const { method, result } = messageData
    if (method === 'depth.update') return false
    const { status } = result
    if (status === 'success') return true
    if (result === 'pong') return true
    console.log('UNDEFINED MESSAGE:', messageData)
    return true
  }

  async subscribeAllTickers(): Promise<void> {
    let symbols = Object.keys(this.tickers)
    let total = symbols.length
    while (total === 0) {
      await this.delay(500)
      symbols = Object.keys(this.tickers)
      total = symbols.length
    }

    this.refresh()
  }

  updateTickers(tickerData: TidexTicker): void {
    const { params } = tickerData
    const [clean, data, symbol] = params
    const { asks, bids } = data

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbol,
    })

    this.updateTickerData({
      symbol: symbol,
      askPrice: Array.isArray(asks) ? parseFloat(asks[0][0]) : undefined,
      askQty: Array.isArray(asks) ? parseFloat(asks[0][1]) : undefined,
      bidPrice: Array.isArray(bids) ? parseFloat(bids[0][0]) : undefined,
      bidQty: Array.isArray(bids) ? parseFloat(bids[0][1]) : undefined,
    })

    this.updated++
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

    const symbols = Object.keys(this.tickers)
    if (symbols.length == 0) return

    symbols.forEach(async (s, i) => {
      this.socket!.send(
        JSON.stringify({
          method: 'depth.subscribe',
          params: [s, 1, '0'],
          id: i + i + i,
        })
      )
      await this.delay(300)
    })
  }
}
