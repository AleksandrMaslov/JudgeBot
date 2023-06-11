import { ExchangeModel } from './base/exchangeModel.js'
import {
  OkxTickerResponse,
  OkxTickerData,
  OkxTicker,
  TickerUpdate,
} from '../../types'

export class OkxModel extends ExchangeModel {
  constructor() {
    super()

    this.exchangeUrl = 'https://www.okx.com/'
    this.tickersUrl = 'https://www.okx.com/api/v5/market/tickers?instType=SPOT'
    this.wsConnectionUrl = 'wss://ws.okx.com:8443/ws/v5/public'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: { data: OkxTickerResponse }): OkxTickerData[] {
    const {
      data: { data },
    } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: OkxTickerData[]): OkxTickerData[] {
    return tickersData.filter((tickerData: OkxTickerData) => {
      const { askPx, askSz, bidPx, bidSz } = tickerData
      return (
        parseFloat(askPx) !== 0 &&
        parseFloat(askSz) !== 0 &&
        parseFloat(bidPx) !== 0 &&
        parseFloat(bidSz) !== 0
      )
    })
  }

  parseTickerData(tickerData: OkxTickerData): TickerUpdate {
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
    const { channel } = arg
    if (event) if (event !== 'subscribe') console.log(messageData)
    if (event) return true
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

  updateTickers(tickerData: OkxTicker): void {
    const { data } = tickerData
    const { instId, askPx, askSz, bidPx, bidSz } = data[0]

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: instId,
    })

    this.updateTickerData({
      symbol: instId,
      askPrice: parseFloat(askPx),
      askQty: parseFloat(askSz),
      bidPrice: parseFloat(bidPx),
      bidQty: parseFloat(bidSz),
    })

    this.updated++
  }
}
