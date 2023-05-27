import axios from 'axios'
import WebSocket from 'ws'

import { SymbolData, TickerUpdate } from '../../../types'
import { Ticker } from '../../ticker.js'

export class ConnectableModel {
  public tickers: any

  symbolsUrl: string
  tickersUrl: string
  wsConnectionUrl: string
  tickersTopic: string

  senderPrefix: string
  socket?: WebSocket
  isDebugMode: boolean

  constructor() {
    this.tickers = {}

    this.symbolsUrl = ''
    this.tickersUrl = ''
    this.wsConnectionUrl = ''
    this.tickersTopic = ''

    this.senderPrefix = ''
    this.isDebugMode = false

    if (this.constructor == ConnectableModel)
      throw new Error("Abstract classes can't be instantiated.")
  }

  // ABSTRACT INTERNAL METHODS
  init(): void {
    this.getTickersList()
    this.getTickersData()
    this.connect()
  }

  parseSymbolsResponse(response: any): any[] {
    return this.getValidSymbols(response)
  }

  getValidSymbols(symbols: any[]): any[] {
    return symbols
  }

  parseSymbolData(rawSymbolData: any): SymbolData {
    return rawSymbolData
  }

  parseTickersResponse(response: any): any[] {
    return this.getValidSymbols(response)
  }

  getValidTickers(tickers: any[]): any[] {
    return tickers
  }

  parseTickerData(rawTickerData: any): TickerUpdate {
    return rawTickerData
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

  // GET TICKERS
  private async getTickersList(): Promise<void> {
    await axios
      .get(this.symbolsUrl)

      .then((response) => {
        const rawSymbolsData = this.parseSymbolsResponse(response)

        rawSymbolsData.forEach((rawSymbolData: any) => {
          const symbolData = this.parseSymbolData(rawSymbolData)
          this.ensureTicker(symbolData)
          this.updateSymbolData(symbolData)
        })

        if (this.isDebugMode) this.logSymbolsResponse(rawSymbolsData)
      })

      .catch(() => this.logSymbolsRequestError())
  }

  private async getTickersData(): Promise<void> {
    await axios
      .get(this.tickersUrl)

      .then((response) => {
        const rawTickersData = this.parseTickersResponse(response)

        rawTickersData.forEach((rawTickerData: any) => {
          const tickerData = this.parseTickerData(rawTickerData)
          this.ensureTicker(tickerData)
          this.updateTickerData(tickerData)
        })
        if (this.isDebugMode) this.logTickersResponse(rawTickersData)
      })

      .catch(() => this.logTickersRequestError())
  }

  private updateSymbolData(symbolData: SymbolData) {
    const { symbol } = symbolData
  }

  // WS CONNECTION
  private async connect(): Promise<void> {
    this.socket = await this.initWS()
    this.socket.onopen = () => this.onSocketOpen()
    this.socket.onclose = () => this.logSocketClosed()
    this.socket.onerror = () => this.logSocketError()
    this.socket.onmessage = (event: WebSocket.MessageEvent) =>
      this.onSocketMessage(event)
  }

  private onSocketMessage(event: WebSocket.MessageEvent): void {
    const messageData = JSON.parse(event.data.toString())

    this.messageHandler(messageData)

    if (this.isDataMessageNotValid(messageData)) return

    try {
      this.updateTickers(messageData)
    } catch (error) {
      this.logUpdatingError(error)
    }
  }

  private onSocketOpen(): void {
    this.subscribeAllTickers()

    if (this.isDebugMode) this.logConnection()
  }

  // INTERNAL UTILS
  ensureTicker(data: SymbolData | TickerUpdate): void {
    const { symbol } = data
    if (this.tickers[symbol]) return
    this.tickers[symbol] = new Ticker({
      exchange: this.constructor.name.replace('Model', ''),
      symbol: symbol,
    })
  }

  updateTickerData(tickerData: TickerUpdate) {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = tickerData

    if (askPrice) this.tickers[symbol].askPrice = askPrice
    if (askQty) this.tickers[symbol].askQty = askQty

    if (bidPrice) this.tickers[symbol].bidPrice = bidPrice
    if (bidQty) this.tickers[symbol].bidQty = bidQty
  }

  // LOGGING
  private logSymbolsResponse(rawSymbolsData: any[]): void {
    console.log(
      `* ${this.senderPrefix} - Got ${rawSymbolsData.length} symbols data`
    )
  }

  private logTickersResponse(rawTickersData: any[]): void {
    console.log(
      `* ${this.senderPrefix} - Got ${rawTickersData.length} tickers data`
    )
  }

  private logConnection(): void {
    console.log(`* ${this.senderPrefix} - Tickers data connected`)
  }

  private logSocketClosed(): void {
    console.log(`* ${this.senderPrefix} - WS Closed message`)
  }

  private logSymbolsRequestError(): void {
    console.log(`* ${this.senderPrefix} - SymbolsRequestError`)
  }

  private logTickersRequestError(): void {
    console.log(`* ${this.senderPrefix} - TickersRequestError`)
  }

  private logSocketError(): void {
    console.log(`* ${this.senderPrefix} - WS Error message`)
  }

  private logUpdatingError(error: any): void {
    console.log(`* ${this.senderPrefix} - UpdatingError \n${error}`)
  }
}
