import axios from 'axios'
import WebSocket from 'ws'

import { SymbolData, SymbolUpdate } from '../../types'
import { Ticker } from '../ticker.js'

export class ExchangeModel {
  public tickers: any
  public symbols: string[]

  symbolsUrl: string
  wsConnectionUrl: string
  senderPrefix: string
  socket?: WebSocket
  isDebugMode: boolean

  constructor() {
    this.tickers = {}
    this.symbols = []

    this.symbolsUrl = ''
    this.wsConnectionUrl = ''
    this.senderPrefix = ''
    this.isDebugMode = false

    if (this.constructor == ExchangeModel) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  // ABSTRACT METHODS
  init(): void {
    this.getSymbols()
    this.connect()
  }

  parseSymbolResponse(response: any): any[] {
    const symbolsData = response
    return this.getValidSymbols(symbolsData)
  }

  getValidSymbols(symbols: any[]): any[] {
    return []
  }

  parseTicker(symbolData: any): SymbolData {
    return symbolData
  }

  async initWS(): Promise<WebSocket> {
    return new WebSocket(this.wsConnectionUrl)
  }

  messageHandler(messageData: any): void {}

  isDataMessageNotValid(messageData: any): boolean {
    return false
  }

  subscribeAllTickers(): void {}

  updateTickers(tickerData: any): void {}

  // GET SYMBOLS
  async getSymbols(): Promise<void> {
    await axios
      .get(this.symbolsUrl)

      .then((response) => {
        const symbolsData = this.parseSymbolResponse(response)

        this.defineSymbolsList(symbolsData)

        this.defineTickers(symbolsData)

        if (this.isDebugMode)
          console.log(
            `* ${this.senderPrefix} - Got ${symbolsData.length} symbols data`
          )
      })

      .catch((error) => {
        console.log(`* ${this.senderPrefix} - SymbolsRequestError`)
      })
  }

  private defineSymbolsList(symbolsData: { symbol: string }[]): void {
    this.symbols = symbolsData.map((s: { symbol: string }) => s.symbol)
  }

  private defineTickers(symbolsData: any[]) {
    symbolsData.map((symbolData: any) => {
      const symbol = symbolData.symbol
      this.tickers[symbol] = new Ticker(this.parseTicker(symbolData))
    })
  }

  // WS CONNECTION
  private async connect(): Promise<void> {
    this.socket = await this.initWS()
    this.socket.onopen = () => this.onSocketOpen()
    this.socket.onerror = () => this.onSocketError()
    this.socket.onclose = () => this.onSocketClose()
    this.socket.onmessage = (event: WebSocket.MessageEvent) =>
      this.onSocketMessage(event)
  }

  private onSocketMessage(event: WebSocket.MessageEvent): void {
    const messageData = JSON.parse(event.data.toString())

    this.messageHandler(messageData)

    if (this.isDataMessageNotValid(messageData)) return

    this.processData(messageData)
  }

  private onSocketOpen(): void {
    this.subscribeAllTickers()

    if (this.isDebugMode)
      console.log(`* ${this.senderPrefix} - Tickers data connected`)
  }

  private onSocketClose(): void {
    console.log(`* ${this.senderPrefix} - WS Closed message`)
  }

  private onSocketError(): void {
    console.log(`* ${this.senderPrefix} - WS Error message`)
  }

  // UTILS
  private processData(tickersData: any[]): void {
    try {
      this.updateTickers(tickersData)
    } catch (error) {
      console.log(`* ${this.senderPrefix} - ProcessingError \n${error}`)
    }
  }

  extendTickersIfNeeded(symbol: string): void {
    if (this.tickers[symbol]) return

    this.symbols.push(symbol)

    this.tickers[symbol] = new Ticker({
      symbol: symbol,
      base: 'UNDEFINED',
      quote: 'UNDEFINED',
    })
  }

  updateTickerBySymbolUpdate(symbolData: SymbolUpdate) {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = symbolData

    this.tickers[symbol].askPrice = askPrice
    this.tickers[symbol].askQty = askQty

    this.tickers[symbol].bidPrice = bidPrice
    this.tickers[symbol].bidQty = bidQty
  }
}
