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
    this.tickersTopic = '!ticker@arr'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE SYMBOLS DATA METHODS
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
    const { symbol } = symbolData
    return {
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbol,
    }
  }

  // OVERRIDE TICKERS DATA METHODS
  parseTickersResponse(response: {
    data: BinanceTickerResponse
  }): BinanceTickerData[] {
    const { data } = response
    return this.getValidTickers(data)
  }

  getValidTickers(tickersData: BinanceTickerData[]): BinanceTickerData[] {
    return tickersData.filter((tickerData: BinanceTickerData) => {
      const { askPrice, askQty, bidPrice, bidQty } = tickerData
      return (
        parseFloat(askPrice) !== 0 &&
        parseFloat(askQty) !== 0 &&
        parseFloat(bidPrice) !== 0 &&
        parseFloat(bidQty) !== 0
      )
    })
  }

  parseTickerData(tickerData: BinanceTickerData): TickerUpdate {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = tickerData
    return {
      symbol: symbol,
      askPrice: parseFloat(askPrice),
      askQty: parseFloat(askQty),
      bidPrice: parseFloat(bidPrice),
      bidQty: parseFloat(bidQty),
    }
  }

  // OVERRIDE WS DATA METHODS
  isDataMessageNotValid(messageData: any): boolean {
    const { result } = messageData
    return result === null
  }

  subscribeAllTickers(): void {
    this.socket!.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: [this.tickersTopic],
        id: 987654321,
      })
    )
  }

  updateTickers(tickersData: BinanceTicker[]): void {
    tickersData.map((tickerData: BinanceTicker) => {
      const { s, a, A, b, B } = tickerData

      this.ensureTicker({
        exchange: this.constructor.name.replace('Model', ''),
        symbol: s,
      })

      this.updateTickerData({
        symbol: s,
        askPrice: parseFloat(a),
        askQty: parseFloat(A),
        bidPrice: parseFloat(b),
        bidQty: parseFloat(B),
      })

      this.updated++
    })
  }
}
