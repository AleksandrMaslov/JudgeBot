import { ExchangeModel } from './base/exchangeModel.js'
import {
  HuobiTickerResponse,
  HuobiTickerData,
  HuobiTicker,
  TickerUpdate,
} from '../../types'

export class HuobiModel extends ExchangeModel {
  constructor() {
    super()

    this.exchangeUrl = 'https://www.huobi.com/'
    this.tickersUrl = 'https://api.huobi.pro/market/tickers'
    this.wsConnectionUrl = 'wss://api.huobi.pro/ws'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: HuobiTickerResponse
  }): HuobiTickerData[] {
    const {
      data: { data },
    } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: HuobiTickerData[]): HuobiTickerData[] {
    return tickersData.filter((tickerData: HuobiTickerData) => {
      const { ask, askSize, bid, bidSize } = tickerData
      return ask !== 0 && askSize !== 0 && bid !== 0 && bidSize !== 0
    })
  }

  parseTickerData(tickerData: HuobiTickerData): TickerUpdate {
    const { symbol, ask, askSize, bid, bidSize } = tickerData
    const validSymbol = symbol.toUpperCase()
    return {
      symbol: validSymbol,
      askPrice: ask,
      askQty: askSize,
      bidPrice: bid,
      bidQty: bidSize,
    }
  }

  // OVERRIDE WS DATA METHODS
  messageHandler(messageData: any): void {
    const { ping } = messageData
    if (!ping) return
    this.socket!.send(JSON.stringify({ pong: ping }))
  }

  isDataMessageNotValid(messageData: any): boolean {
    const { ping, tick, subbed } = messageData
    if (ping) return true
    if (subbed) return true
    if (tick) return false
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

    symbols.forEach(async (s) => {
      this.socket!.send(
        JSON.stringify({
          sub: `market.${s.toLowerCase()}.ticker`,
          id: 'id12345',
        })
      )
      await this.delay(300)
    })
  }

  updateTickers(tickerData: HuobiTicker): void {
    const { ch, tick } = tickerData
    const symbol = ch.split('.')[1].toUpperCase()
    const { ask, askSize, bid, bidSize } = tick

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbol,
    })

    this.updateTickerData({
      symbol: symbol,
      askPrice: ask,
      askQty: askSize,
      bidPrice: bid,
      bidQty: bidSize,
    })

    this.updated++
  }
}
