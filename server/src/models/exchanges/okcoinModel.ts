import { ExchangeModel } from './base/exchangeModel.js'
import {
  OkcoinTickerResponse,
  OkcoinTickerData,
  OkcoinTicker,
  TickerUpdate,
} from '../../types'

export class OkcoinModel extends ExchangeModel {
  constructor() {
    super()

    this.tickersUrl =
      'https://www.okcoin.com/api/v5/market/tickers?instType=SPOT'
    this.wsConnectionUrl = 'wss://real.okcoin.com:8443/ws/v5/public'
    this.pingMessage = { op: 'ping' }
    this.senderPrefix = this.constructor.name

    this.init()
    this.definePingTimer()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: OkcoinTickerResponse
  }): OkcoinTickerData[] {
    const {
      data: { data },
    } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: OkcoinTickerData[]): OkcoinTickerData[] {
    return tickersData.filter(
      (tickerData: OkcoinTickerData) =>
        parseFloat(tickerData.askPx) !== 0 &&
        parseFloat(tickerData.askSz) !== 0 &&
        parseFloat(tickerData.bidPx) !== 0 &&
        parseFloat(tickerData.bidSz) !== 0
    )
  }

  parseTickerData(tickerData: OkcoinTickerData): TickerUpdate {
    const { instId, askPx, askSz, bidPx, bidSz } = tickerData
    return {
      symbol: instId,
      askPrice: parseFloat(askPx),
      askQty: parseFloat(askSz),
      bidPrice: parseFloat(bidPx),
      bidQty: parseFloat(bidSz),
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    const { event, arg } = messageData
    if (event === 'error') return true
    if (event === 'subscribe') return true

    const { channel } = arg
    if (channel === 'tickers') return false

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

    const args = symbols.map((s) => {
      return {
        channel: 'tickers',
        instId: s,
      }
    })

    this.socket!.send(
      JSON.stringify({
        op: 'subscribe',
        args: args,
      })
    )
  }

  updateTickers(tickerData: OkcoinTicker): void {
    const { data } = tickerData
    const { instId, askPx, askSz, bidPx, bidSz } = data[0]

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: instId,
    })

    this.updateTickerData({
      symbol: instId,
      // askPrice: Array.isArray(asks[0]) ? parseFloat(asks[0][0]) : undefined,
      // askQty: Array.isArray(asks[0]) ? parseFloat(asks[0][1]) : undefined,
      // bidPrice: Array.isArray(bids[0]) ? parseFloat(bids[0][0]) : undefined,
      // bidQty: Array.isArray(bids[0]) ? parseFloat(bids[0][1]) : undefined,
      askPrice: parseFloat(askPx),
      askQty: parseFloat(askSz),
      bidPrice: parseFloat(bidPx),
      bidQty: parseFloat(bidSz),
    })

    this.updated++
  }
}
