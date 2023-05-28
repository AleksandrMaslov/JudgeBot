import axios from 'axios'
import WebSocket from 'ws'

import { ExchangeModel } from './base/exchangeModel.js'
import {
  SymbolData,
  TickerUpdate,
  KucoinTicker,
  KucoinSymbolResponse,
  KucoinSymbolData,
  KucoinTickerResponse,
  KucoinTickerData,
} from '../../types'

export class KucoinModel extends ExchangeModel {
  private tokenUrl: string
  private id?: string

  constructor() {
    super()

    this.symbolsUrl = 'https://api.kucoin.com/api/v2/symbols'
    this.tickersUrl = 'https://api.kucoin.com/api/v1/market/allTickers'
    this.wsConnectionUrl = 'wss://stream.binance.com:9443/ws'
    this.tokenUrl = 'https://api.kucoin.com/api/v1/bullet-public'
    this.tickersTopic = '/market/ticker:all'
    this.pingMessage = { id: this.id, type: 'ping' }
    this.senderPrefix = this.constructor.name

    this.init()
    this.definePingTimer()
  }

  // OVERRIDE SYMBOLS DATA METHODS
  parseSymbolsResponse(response: {
    data: KucoinSymbolResponse
  }): KucoinSymbolData[] {
    const {
      data: { data },
    } = response

    return this.getValidSymbols(data)
  }

  getValidSymbols(symbolsData: KucoinSymbolData[]): KucoinSymbolData[] {
    return symbolsData.filter(
      (symbolData: KucoinSymbolData) => symbolData.enableTrading
    )
  }

  parseSymbolData(symbolData: KucoinSymbolData): SymbolData {
    return {
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbolData.symbol,
    }
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: KucoinTickerResponse
  }): KucoinTickerData[] {
    const {
      data: {
        data: { ticker },
      },
    } = response
    return this.getValidTickers(ticker)
  }

  getValidTickers(tickersData: KucoinTickerData[]): KucoinTickerData[] {
    return tickersData.filter(
      (tickerData: KucoinTickerData) =>
        parseFloat(tickerData.buy) !== 0 && parseFloat(tickerData.sell) !== 0
    )
  }

  parseTickerData(tickerData: KucoinTickerData): TickerUpdate {
    return {
      symbol: tickerData.symbol,
      askPrice: parseFloat(tickerData.buy),
      askQty: 0,
      bidPrice: parseFloat(tickerData.sell),
      bidQty: 0,
    }
  }

  // OVERRIDE WS DATA METHODS
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
          topic: this.tickersTopic,
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

  updateTickers(tickerData: KucoinTicker): void {
    const {
      subject,
      data: { bestAsk, bestAskSize, bestBid, bestBidSize },
    } = tickerData

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: subject,
    })

    this.updateTickerData({
      symbol: subject,
      askPrice: parseFloat(bestAsk),
      askQty: parseFloat(bestAskSize),
      bidPrice: parseFloat(bestBid),
      bidQty: parseFloat(bestBidSize),
    })

    this.updated++
  }

  // PRIVATE METHODS
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
