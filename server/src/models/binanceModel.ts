import { ExchangeModel } from './base/exchangeModel.js'
import { Symbol, BinanceTicker } from '../types'

export class BinanceModel extends ExchangeModel {
  constructor() {
    super()

    this.symbolsUrl = 'https://api.binance.com/api/v3/exchangeInfo'
    this.wsConnectionUrl = 'wss://stream.binance.com:9443/ws'
    this.senderPrefix = this.constructor.name
    this.isDebugMode = true

    this.init()
  }

  parseSymbolResponse(response: any): any[] {
    const {
      data: { symbols },
    } = response

    return this.getValidSymbols(symbols)
  }

  getValidSymbols(symbolsData: any[]): any[] {
    return symbolsData.filter((s: any) => s.status === 'TRADING')
  }

  parseTicker(symbolData: any): Symbol {
    return {
      symbol: symbolData.symbol,
      base: symbolData.baseAsset,
      quote: symbolData.quoteAsset,
      askPrice: 0,
      askQty: 0,
      bidPrice: 0,
      bidQty: 0,
    }
  }

  isDataMessageNotValid(messageData: any): boolean {
    return messageData.result === null
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
}
