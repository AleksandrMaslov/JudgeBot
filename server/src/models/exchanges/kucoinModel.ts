import axios from 'axios'
import WebSocket from 'ws'

import { ExchangeModel } from './base/exchangeModel.js'
import { SymbolData, KucoinTicker } from '../../types'

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
    this.definePingTimer()
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

  parseTicker(symbolData: any): SymbolData {
    return {
      symbol: symbolData.symbol,
      base: symbolData.baseCurrency,
      quote: symbolData.quoteCurrency,
    }
  }

  async initWS(): Promise<WebSocket> {
    const { token, endpoint } = await this.requestToken(this.tokenUrl)
    return new WebSocket(`${endpoint}?token=${token}`)
  }

  messageHandler(messageData: any): void {
    const { type, id } = messageData
    if (type === 'welcome') {
      this.id = id

      this.socket?.send(
        JSON.stringify({
          id: id,
          type: 'subscribe',
          topic: '/market/ticker:all',
          privateChannel: false,
          response: true,
        })
      )

      return
    }

    if (type === 'ack') return
    if (type === 'pong') return
    if (type === 'message') return

    console.log(messageData)
  }

  isDataMessageNotValid(messageData: any): boolean {
    const { topic } = messageData
    if (topic === '/market/ticker:all') return false
    return true
  }

  updateTickers(tickersData: KucoinTicker): void {
    const {
      subject,
      data: { bestAsk, bestAskSize, bestBid, bestBidSize },
    } = tickersData

    this.extendTickersIfNeeded(subject)

    this.updateTickerBySymbolUpdate({
      symbol: subject,
      askPrice: parseFloat(bestAsk),
      askQty: parseFloat(bestAskSize),
      bidPrice: parseFloat(bestBid),
      bidQty: parseFloat(bestBidSize),
    })
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

    this.socket?.send(
      JSON.stringify({
        id: this.id,
        type: 'ping',
      })
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
