import axios from 'axios'
import WebSocket from 'ws'

import { SymbolData, TickerUpdate } from '../../../types'
import { Ticker } from '../../ticker.js'

export class ExchangeModel {
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

    if (this.constructor == ExchangeModel) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  // PUBLIC METHODS
  public getTradeablePairsWith(exchange: ExchangeModel, asset: string): void {
    const currentBasedTickers = this.getBasedTickers(asset)
    const exchangeBasedTickers = exchange.getBasedTickers(asset)

    const currentLength = Object.keys(currentBasedTickers).length
    const exchangeLength = Object.keys(exchangeBasedTickers).length

    console.log(currentLength, exchangeLength)

    let pairs: Ticker[][]
    if (currentLength < exchangeLength)
      pairs = this.defineTradeablePairs(
        currentBasedTickers,
        exchangeBasedTickers
      )
    else
      pairs = this.defineTradeablePairs(
        exchangeBasedTickers,
        currentBasedTickers
      )
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

        rawSymbolsData.map((rawSymbolData: any) => {
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

        rawTickersData.map((rawTickerData: any) => {
          const tickerData = this.parseTickerData(rawTickerData)
          this.ensureTicker(tickerData)
          this.updateTickerData(tickerData)
        })
        if (this.isDebugMode) this.logTickersResponse(rawTickersData)
      })

      .catch(() => this.logTickersRequestError())
  }

  private updateSymbolData(symbolData: SymbolData) {
    const { symbol, base, quote } = symbolData
    this.tickers[symbol].base = base
    this.tickers[symbol].quote = quote
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

  // TRADING UTILS
  private getBasedTickers(asset: string): {} {
    let tickers: any = {}
    for (const pair of Object.entries<Ticker>(this.tickers)) {
      const [symbol, ticker] = pair

      if (!symbol.includes(asset)) continue
      if (!ticker.askPrice) continue
      // if (!ticker.askQty) continue
      if (!ticker.bidPrice) continue
      // if (!ticker.bidQty) continue
      if (ticker.askPrice === 0) continue
      if (ticker.askQty === 0) continue
      if (ticker.bidPrice === 0) continue
      if (ticker.bidQty === 0) continue

      const pairAsset = symbol.replace(asset, '').replace('-', '')
      tickers[pairAsset] = ticker
    }
    return tickers
  }

  private defineTradeablePairs(baseTickers: any, tickers: any): Ticker[][] {
    const tradePairs = []
    const spreads = []

    for (const pair of Object.entries<Ticker>(baseTickers)) {
      const [pairAsset, ticker] = pair
      if (!tickers[pairAsset]) continue

      const pairTicker: Ticker = tickers[pairAsset]
      tradePairs.push([ticker, pairTicker])

      let spreadA: number
      let spreadB: number
      let proffitA: number
      let proffitB: number
      if (ticker.base === pairTicker.base) {
        spreadA = ticker.askPrice! - pairTicker.bidPrice!
        proffitA = parseFloat(((spreadA * 100) / ticker.askPrice!).toFixed(2))
        spreadB = pairTicker.askPrice! - ticker.bidPrice!
        proffitB = parseFloat(
          ((spreadB * 100) / pairTicker.askPrice!).toFixed(2)
        )
      } else {
        console.log('different!', ticker.base, pairTicker.base)
        // FIX
        spreadA = ticker.askPrice! - pairTicker.bidPrice!
        proffitA = parseFloat(((spreadA * 100) / ticker.askPrice!).toFixed(2))
        spreadB = pairTicker.askPrice! - ticker.bidPrice!
        proffitB = parseFloat(
          ((spreadB * 100) / pairTicker.askPrice!).toFixed(2)
        )
      }

      if (proffitA > 2 || proffitB > 2)
        spreads.push([pairAsset, proffitA, proffitB])
    }

    console.log(spreads.length)
    console.log(spreads)

    return tradePairs
  }

  // INTERNAL UTILS
  ensureTicker(symbolData: SymbolData | TickerUpdate): void {
    const { symbol } = symbolData
    if (this.tickers[symbol]) return
    this.tickers[symbol] = new Ticker({ symbol: symbol })
  }

  updateTickerData(tickerData: TickerUpdate) {
    const { symbol, askPrice, askQty, bidPrice, bidQty } = tickerData

    this.tickers[symbol].askPrice = askPrice
    this.tickers[symbol].askQty = askQty

    this.tickers[symbol].bidPrice = bidPrice
    this.tickers[symbol].bidQty = bidQty
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
