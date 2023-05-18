import axios from 'axios'
import WebSocket from 'ws'

import { Symbol } from '../../types'

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

  parseTicker(symbolData: any): Symbol {
    return symbolData
  }

  isDataMessageNotValid(messageData: any): boolean {
    return true
  }

  subscribeAllTickers(): void {}

  updateTicker(tickerData: any): void {}

  // GET SYMBOLS
  private async getSymbols(): Promise<void> {
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
      this.tickers[symbol] = this.parseTicker(symbolData)
    })
  }

  // WS CONNECTION
  private connect(): void {
    this.socket = new WebSocket(this.wsConnectionUrl)
    this.socket.onopen = () => this.onSocketOpen()
    this.socket.onerror = () => this.onSocketError()
    this.socket.onclose = () => this.onSocketClose()
    this.socket.onmessage = (event: WebSocket.MessageEvent) =>
      this.onSocketMessage(event)
  }

  private onSocketMessage(event: WebSocket.MessageEvent): void {
    const messageData = JSON.parse(event.data.toString())

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
  private processData = (tickersData: any[]): void => {
    try {
      tickersData.map((tickerData: any) => {
        this.updateTicker(tickerData)
      })

      if (this.isDebugMode)
        console.log(
          `${this.senderPrefix} - Updated ${tickersData.length} tickers`
        )
    } catch (error) {
      console.log(`* ${this.senderPrefix} - ProcessingError \n${error}`)
    }
  }
}
