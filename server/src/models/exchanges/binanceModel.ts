import { ExchangeModel } from './base/exchangeModel.js'
import {
  SymbolData,
  BinanceTicker,
  BinanceSymbolResponse,
  BinanceSymbolData,
  TickerUpdate,
  BinanceTickerResponse,
  BinanceTickerData,
} from '../../types'

export class BinanceModel extends ExchangeModel {
  constructor() {
    super()

    this.symbolsUrl = 'https://api.binance.com/api/v3/exchangeInfo'
    this.tickersUrl = 'https://api.binance.com/api/v3/ticker/bookTicker'
    this.wsConnectionUrl = 'wss://stream.binance.com:9443/ws'
    this.senderPrefix = this.constructor.name
    this.isDebugMode = true

    this.init()
  }

  // SYMBOLS DATA
  parseSymbolsResponse(response: {
    data: BinanceSymbolResponse
  }): BinanceSymbolData[] {
    const {
      data: { symbols },
    } = response

    return this.getValidSymbols(symbols)
  }

  getValidSymbols(symbolsData: BinanceSymbolData[]): BinanceSymbolData[] {
    return symbolsData.filter(
      (symbolData: BinanceSymbolData) => symbolData.status === 'TRADING'
    )
  }

  parseSymbolData(symbolData: BinanceSymbolData): SymbolData {
    return {
      symbol: symbolData.symbol,
      base: symbolData.baseAsset,
      quote: symbolData.quoteAsset,
    }
  }

  // TICKERS DATA
  parseTickersResponse(response: {
    data: BinanceTickerResponse
  }): BinanceTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: BinanceTickerData[]): BinanceTickerData[] {
    return tickersData.filter(
      (tickerData: BinanceTickerData) =>
        parseFloat(tickerData.askPrice) === 0 ||
        parseFloat(tickerData.askQty) === 0 ||
        parseFloat(tickerData.bidPrice) === 0 ||
        parseFloat(tickerData.bidQty) === 0
    )
  }

  parseTickerData(tickerData: BinanceTickerData): TickerUpdate {
    return {
      symbol: tickerData.symbol,
      askPrice: parseFloat(tickerData.askPrice),
      askQty: parseFloat(tickerData.askQty),
      bidPrice: parseFloat(tickerData.bidPrice),
      bidQty: parseFloat(tickerData.bidQty),
    }
  }

  // WS DATA
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

      this.ensureTicker({ symbol: s })

      this.updateTickerData({
        symbol: s,
        askPrice: parseFloat(a),
        askQty: parseFloat(A),
        bidPrice: parseFloat(b),
        bidQty: parseFloat(B),
      })
    })
  }
}