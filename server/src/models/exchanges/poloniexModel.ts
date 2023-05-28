import WebSocket from 'ws'

import { ExchangeModel } from './base/exchangeModel.js'
import {
  PoloniexTickerResponse,
  PoloniexTickerData,
  PoloniexTicker,
  TickerUpdate,
} from '../../types'

export class PoloniexModel extends ExchangeModel {
  constructor() {
    super()

    this.tickersUrl = 'https://api.poloniex.com/markets/ticker24h'
    this.wsConnectionUrl = 'wss://ws.poloniex.com/ws/public'
    this.pingMessage = { event: 'ping' }

    this.senderPrefix = this.constructor.name
    this.isDebugMode = true

    this.init()
    this.definePingTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: PoloniexTickerResponse
  }): PoloniexTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: PoloniexTickerData[]): PoloniexTickerData[] {
    return tickersData.filter(
      (tickerData: PoloniexTickerData) =>
        parseFloat(tickerData.ask) !== 0 &&
        parseFloat(tickerData.askQuantity) !== 0 &&
        parseFloat(tickerData.bid) !== 0 &&
        parseFloat(tickerData.bidQuantity) !== 0
    )
  }

  parseTickerData(tickerData: PoloniexTickerData): TickerUpdate {
    return {
      symbol: tickerData.symbol,
      askPrice: parseFloat(tickerData.ask),
      askQty: parseFloat(tickerData.askQuantity),
      bidPrice: parseFloat(tickerData.bid),
      bidQty: parseFloat(tickerData.bidQuantity),
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    if (messageData.event === 'subscribe') return true
    if (messageData.event === 'pong') return true
    if (messageData.channel === 'book') return false
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

    this.socket!.send(
      JSON.stringify({
        event: 'subscribe',
        channel: ['book'],
        symbols: symbols,
      })
    )
  }

  updateTickers(tickerData: PoloniexTicker): void {
    const { data } = tickerData
    const { symbol, asks, bids } = data[0]

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbol,
    })

    this.updateTickerData({
      symbol: symbol,
      askPrice: Array.isArray(asks[0]) ? parseFloat(asks[0][0]) : undefined,
      askQty: Array.isArray(asks[0]) ? parseFloat(asks[0][1]) : undefined,
      bidPrice: Array.isArray(bids[0]) ? parseFloat(bids[0][0]) : undefined,
      bidQty: Array.isArray(bids[0]) ? parseFloat(bids[0][1]) : undefined,
    })
  }
}
