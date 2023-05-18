import axios from 'axios'
import WebSocket from 'ws'

import { ExchangeModel } from './base/exchangeModel.js'
import { Symbol, BinanceTicker } from '../types'

export class KucoinModel extends ExchangeModel {
  private tokenUrl: string

  private id?: string
  private pingTimer: number
  private lastPingTime: number

  constructor() {
    super()

    this.symbolsUrl = 'https://api.kucoin.com/api/v2/symbols'
    this.wsConnectionUrl = 'wss://stream.binance.com:9443/ws'
    this.tokenUrl = 'https://api.kucoin.com/api/v1/bullet-public'
    this.senderPrefix = this.constructor.name
    this.isDebugMode = true

    this.pingTimer = 20000
    this.lastPingTime = Date.now()

    this.init()
  }

  parseSymbolResponse(response: any): any[] {
    const {
      data: { data },
    } = response

    return this.getValidSymbols(data)
  }

  getValidSymbols(symbolsData: any[]): any[] {
    return symbolsData.filter((d: any) => d.enableTrading)
  }

  parseTicker(symbolData: any): Symbol {
    return {
      symbol: symbolData.symbol,
      base: symbolData.baseCurrency,
      quote: symbolData.quoteCurrency,
      askPrice: 0,
      askQty: 0,
      bidPrice: 0,
      bidQty: 0,
    }
  }

  async initWS(): Promise<WebSocket> {
    const { token, endpoint } = await this.requestToken(this.tokenUrl)
    return new WebSocket(`${endpoint}?token=${token}`)
  }

  isDataMessageNotValid(messageData: any): boolean {
    console.log(messageData)
    // VALIDATION

    return false
  }

  subscribeAllTickers(): void {
    this.socket!.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: ['!ticker@arr'],
        id: 987654321,
      })
    )
  }

  updateTicker(tickerData: BinanceTicker): void {
    const symbol = tickerData.s

    const askPrice = parseFloat(tickerData.a)
    const askQty = parseFloat(tickerData.A)
    const bidPrice = parseFloat(tickerData.b)
    const bidQty = parseFloat(tickerData.B)

    this.tickers[symbol].askPrice = askPrice
    this.tickers[symbol].askQty = askQty

    this.tickers[symbol].bidPrice = bidPrice
    this.tickers[symbol].bidQty = bidQty
  }

  private async requestToken(
    url: string
  ): Promise<{ token: string; endpoint: string }> {
    const {
      data: { data },
    } = await axios.post(url)

    const { token } = data
    const { endpoint } = data.instanceServers[0]
    return { token: token, endpoint: endpoint }
  }
}
