import { ExchangeModel } from './base/exchangeModel.js'
import {
  BybitTickerResponse,
  BybitTickerData,
  BybitTicker,
  TickerUpdate,
} from '../../types'
import { WebSocket } from 'ws'

export class BybitModel extends ExchangeModel {
  private pingTimer: number
  private lastPingTime: number

  constructor() {
    super()

    this.symbolsUrl = ''
    this.tickersUrl = 'https://api.bybit.com/v5/market/tickers?category=spot'
    this.wsConnectionUrl = 'wss://stream.bybit.com/v5/public/spot'
    this.tickersTopic = 'orderbook.1.'

    this.senderPrefix = this.constructor.name
    this.isDebugMode = true

    this.pingTimer = 20000
    this.lastPingTime = Date.now()

    this.init()
    this.definePingTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: BybitTickerResponse
  }): BybitTickerData[] {
    const {
      data: {
        result: { list },
      },
    } = response

    return this.getValidTickers(list)
  }

  getValidTickers(tickersData: BybitTickerData[]): BybitTickerData[] {
    return tickersData.filter(
      (tickerData: BybitTickerData) =>
        parseFloat(tickerData.ask1Price) !== 0 &&
        parseFloat(tickerData.ask1Size) !== 0 &&
        parseFloat(tickerData.bid1Price) !== 0 &&
        parseFloat(tickerData.bid1Size) !== 0
    )
  }

  parseTickerData(tickerData: BybitTickerData): TickerUpdate {
    return {
      symbol: tickerData.symbol,
      askPrice: parseFloat(tickerData.ask1Price),
      askQty: parseFloat(tickerData.ask1Size),
      bidPrice: parseFloat(tickerData.bid1Price),
      bidQty: parseFloat(tickerData.bid1Size),
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    if (messageData.success) return true
    if (messageData.type === 'delta') return false
    if (messageData.type === 'snapshot') return false
    console.log('UNDEFINED MESSAGE:', messageData)
    return true
  }

  async subscribeAllTickers(): Promise<void> {
    const step = 10
    let symbols = Object.keys(this.tickers)
    let total = symbols.length

    while (total === 0) {
      await this.delay(1000)
      symbols = Object.keys(this.tickers)
      total = symbols.length
    }

    const args = symbols.map((s) => `${this.tickersTopic}${s}`)

    for (let i = 0; i < total; i += step) {
      const slice = args.slice(i, i + step)

      this.socket!.send(
        JSON.stringify({
          op: 'subscribe',
          args: slice,
        })
      )
      await this.delay(300)
    }
  }

  updateTickers(tickerData: BybitTicker): void {
    const { data } = tickerData
    const { s, a, b } = data

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: s,
    })

    this.updateTickerData({
      symbol: s,
      askPrice: Array.isArray(a[0]) ? parseFloat(a[0][0]) : undefined,
      askQty: Array.isArray(a[0]) ? parseFloat(a[0][1]) : undefined,
      bidPrice: Array.isArray(b[0]) ? parseFloat(b[0][0]) : undefined,
      bidQty: Array.isArray(b[0]) ? parseFloat(b[0][1]) : undefined,
    })
  }

  // PRIVATE METHODS
  private async definePingTimer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      while (!this.isTimeToPing()) await this.delay(1000)
      this.ping()
      resolve()
      this.definePingTimer()
    })
  }

  private isTimeToPing(): boolean {
    const current = Date.now()
    const diff = current - this.lastPingTime
    if (diff > this.pingTimer) return true
    return false
  }

  private ping(): void {
    this.lastPingTime = Date.now()

    if (this.socket?.readyState != WebSocket.OPEN) return

    this.socket?.send(
      JSON.stringify({
        op: 'ping',
      })
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
