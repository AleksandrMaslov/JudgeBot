import axios from 'axios'
import WebSocket from 'ws'
import { Data, ungzip } from 'pako'

import { SymbolData, TickerUpdate } from '../../../types'
import { Ticker } from './ticker.js'

export class ConnectableModel {
  public tickers: any
  socket?: WebSocket

  exchangeUrl: string
  symbolsUrl: string | undefined
  tickersUrl: string | undefined
  wsConnectionUrl: string
  tickersTopic: string

  updated: number

  pingTimer: number
  lastPingTime: number
  pingMessage: Object

  senderPrefix: string
  isDebugMode: boolean

  constructor() {
    this.tickers = {}

    this.exchangeUrl = ''
    this.symbolsUrl = undefined
    this.tickersUrl = undefined
    this.wsConnectionUrl = ''
    this.tickersTopic = ''

    this.updated = 0

    this.pingTimer = 20000
    this.lastPingTime = Date.now()
    this.pingMessage = {}

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
    return true
  }

  subscribeAllTickers(): void {}

  updateTickers(tickerData: any): void {}

  // GET TICKERS
  private async getTickersList(): Promise<void> {
    if (!this.symbolsUrl) return

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
    if (!this.tickersUrl) return

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
    const { data } = event

    let stringData: string
    let messageData: Object
    try {
      stringData = data.toString()
      messageData = JSON.parse(stringData)
    } catch (error) {
      stringData = ungzip(data as Data, { to: 'string' })
      messageData = JSON.parse(stringData)
    }

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

  // PING
  async definePingTimer(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      while (!this.isTimeToPing()) await this.delay(1000)
      this.ping()
      resolve()
      this.definePingTimer()
    })
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private isTimeToPing(): boolean {
    const current = Date.now()
    const diff = current - this.lastPingTime
    if (diff > this.pingTimer) return true
    return false
  }

  private ping(): void {
    this.lastPingTime = Date.now()
    if (this.socket!.readyState != WebSocket.OPEN) return
    this.socket!.send(JSON.stringify(this.pingMessage))
  }

  // INTERNAL UTILS
  ensureTicker(data: SymbolData | TickerUpdate): void {
    const { symbol } = data
    if (this.tickers[symbol]) return
    this.tickers[symbol] = new Ticker({
      exchange: this.constructor.name.replace('Model', ''),
      url: this.exchangeUrl,
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
