import { ExchangeModel } from './exchangeModel.js'
import { SymbolData, BinanceTicker } from '../../types'

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

  parseTicker(symbolData: any): SymbolData {
    return {
      symbol: symbolData.symbol,
      base: symbolData.baseAsset,
      quote: symbolData.quoteAsset,
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

  updateTickers(tickersData: BinanceTicker[]): void {
    tickersData.map((tickerData: BinanceTicker) => {
      const { s, a, A, b, B } = tickerData

      this.extendTickersIfNeeded(s)

      this.updateTickerBySymbolUpdate({
        symbol: s,
        askPrice: parseFloat(a),
        askQty: parseFloat(A),
        bidPrice: parseFloat(b),
        bidQty: parseFloat(B),
      })
    })
  }
}
