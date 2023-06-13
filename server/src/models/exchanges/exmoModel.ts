import { ExchangeModel } from './base/exchangeModel.js'
import {
  ExmoTickerResponse,
  ExmoTickerData,
  ExmoTicker,
  TickerUpdate,
} from '../../types'

export class ExmoModel extends ExchangeModel {
  constructor() {
    super()

    this.exchangeUrl = 'https://exmo.me/'
    this.tickersUrl = 'https://api.exmo.com/v1.1/ticker'
    this.wsConnectionUrl = 'wss://ws-api.exmo.com:443/v1/public'
    this.tickersTopic = 'spot/order_book_snapshots:'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: ExmoTickerResponse
  }): ExmoTickerData[] {
    const { data } = response
    const tickersData = Object.keys(data).map((symbol) => {
      const { buy_price, sell_price } = data[symbol]
      return {
        symbol: symbol,
        buy_price: buy_price,
        sell_price: sell_price,
      }
    })
    return this.getValidTickers(tickersData)
  }

  getValidTickers(tickersData: ExmoTickerData[]): ExmoTickerData[] {
    return tickersData.filter((tickerData: ExmoTickerData) => {
      const { buy_price, sell_price } = tickerData
      return parseFloat(buy_price) !== 0 && parseFloat(sell_price) !== 0
    })
  }

  parseTickerData(tickerData: ExmoTickerData): TickerUpdate {
    const { symbol, buy_price, sell_price } = tickerData
    return {
      symbol: symbol,
      askPrice: parseFloat(sell_price),
      askQty: undefined,
      bidPrice: parseFloat(buy_price),
      bidQty: undefined,
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    const { event } = messageData
    if (event === 'info') return true
    if (event === 'subscribed') return true
    if (event === 'snapshot') return true
    if (event === 'update') return false
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

    const topics = symbols.map((s) => `${this.tickersTopic}${s}`)

    this.socket!.send(
      JSON.stringify({
        id: 1,
        method: 'subscribe',
        topics: topics,
      })
    )
  }

  updateTickers(tickerData: ExmoTicker): void {
    const { topic, data } = tickerData
    const symbol = topic.split(':')[1]
    const { ask, bid } = data

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      url: this.exchangeUrl,
      symbol: symbol,
    })

    this.updateTickerData({
      symbol: symbol,
      askPrice: Array.isArray(ask[0]) ? parseFloat(ask[0][0]) : undefined,
      askQty: Array.isArray(ask[0]) ? parseFloat(ask[0][1]) : undefined,
      bidPrice: Array.isArray(bid[0]) ? parseFloat(bid[0][0]) : undefined,
      bidQty: Array.isArray(bid[0]) ? parseFloat(bid[0][1]) : undefined,
    })

    this.updated++
  }
}
