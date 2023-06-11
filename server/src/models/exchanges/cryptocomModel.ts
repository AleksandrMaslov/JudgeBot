import { ExchangeModel } from './base/exchangeModel.js'
import {
  CryptoComTickerResponse,
  CryptoComTickerData,
  CryptoComTicker,
  TickerUpdate,
} from '../../types'

export class CryptoComModel extends ExchangeModel {
  constructor() {
    super()

    this.exchangeUrl = 'https://crypto.com/'
    this.tickersUrl =
      'https://api.crypto.com/exchange/v1/public/get-instruments'
    this.wsConnectionUrl = 'wss://stream.crypto.com/exchange/v1/market'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: CryptoComTickerResponse
  }): CryptoComTickerData[] {
    const {
      data: {
        result: { data },
      },
    } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: CryptoComTickerData[]): CryptoComTickerData[] {
    return tickersData.filter(
      (tickerData: CryptoComTickerData) => tickerData.tradable
    )
  }

  parseTickerData(tickerData: CryptoComTickerData): TickerUpdate {
    const { symbol } = tickerData
    return {
      symbol: symbol,
      askPrice: undefined,
      askQty: undefined,
      bidPrice: undefined,
      bidQty: undefined,
    }
  }

  // OVERRIDE WS DATA METHODS
  messageHandler(messageData: any): void {
    const { method, id } = messageData
    if (!(method === 'public/heartbeat')) return

    this.socket!.send(
      JSON.stringify({
        id: id,
        method: 'public/respond-heartbeat',
      })
    )
  }

  isDataMessageNotValid(messageData: any): boolean {
    const { method, result } = messageData
    if (method === 'public/heartbeat') return true
    if (result) return false
    if (method === 'subscribe') return true
    console.log('UNDEFINED MESSAGE:', messageData)
    return true
  }

  async subscribeAllTickers(): Promise<void> {
    const step = 10
    let symbols = Object.keys(this.tickers)
    let total = symbols.length

    while (total === 0) {
      await this.delay(500)
      symbols = Object.keys(this.tickers)
      total = symbols.length
    }

    const channels = symbols.map((s) => `book.${s}.10`)

    for (let i = 0; i < total; i += step) {
      const slice = channels.slice(i, i + step)

      this.socket!.send(
        JSON.stringify({
          id: 1,
          method: 'subscribe',
          params: { channels: slice },
        })
      )
      await this.delay(500)
    }
  }

  updateTickers(tickerData: CryptoComTicker): void {
    const { result } = tickerData
    const { instrument_name, data } = result
    const { asks, bids } = data[0]

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: instrument_name,
    })

    this.updateTickerData({
      symbol: instrument_name,
      askPrice: Array.isArray(asks[0]) ? parseFloat(asks[0][0]) : undefined,
      askQty: Array.isArray(asks[0]) ? parseFloat(asks[0][1]) : undefined,
      bidPrice: Array.isArray(bids[0]) ? parseFloat(bids[0][0]) : undefined,
      bidQty: Array.isArray(bids[0]) ? parseFloat(bids[0][1]) : undefined,
    })

    this.updated++
  }
}
