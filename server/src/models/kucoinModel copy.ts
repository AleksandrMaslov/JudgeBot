import axios from 'axios'
import WebSocket from 'ws'

import { BinanceTicker } from '../types'

export class KucoinModel {
  public tickers: any
  public symbols: string[]

  private socket!: WebSocket

  private tokenUrl: string
  private id?: string
  private pingTimer: number
  private lastPingTime: number

  constructor() {
    this.tickers = {}
    this.symbols = []

    this.getSymbols()

    // this.socket = new WebSocket(`wss://stream.binance.com:9443/ws`)
    // this.defineSocketListeners()

    this.tokenUrl = 'https://api.kucoin.com/api/v1/bullet-public'

    this.pingTimer = 20000
    this.lastPingTime = Date.now()
  }

  private getSymbols = async (): Promise<void> =>
    await axios
      .get('https://api.kucoin.com/api/v2/symbols')
      .then((response) => {
        const {
          data: { data },
        } = response

        const validSymbols = data.filter((d: any) => d.enableTrading)

        this.symbols = validSymbols.map((s: any) => s.symbol.replace('-', ''))

        validSymbols.map((s: any) => {
          const symbol = s.symbol
          this.tickers[symbol] = {
            symbol: symbol,
            base: s.baseCurrency,
            quote: s.quoteCurrency,
            askPrice: 0,
            askQty: 0,
            bidPrice: 0,
            bidQty: 0,
          }
        })
      })
      .catch((error) => {
        console.log('Kucoin - RequestError')
      })

  private processData = (tickers: BinanceTicker[]): void => {
    try {
      tickers.map((ticker: BinanceTicker) => {
        const symbol = ticker.s
        const askPrice = parseFloat(ticker.a)
        const askQty = parseFloat(ticker.A)
        const bidPrice = parseFloat(ticker.b)
        const bidQty = parseFloat(ticker.B)

        this.tickers[symbol].askPrice = askPrice
        this.tickers[symbol].askQty = askQty

        this.tickers[symbol].bidPrice = bidPrice
        this.tickers[symbol].bidQty = bidQty
      })
    } catch (error) {
      console.log('Kucoin - ProcessingError')
    }
  }

  private async connect(): Promise<void> {
    const { token, endpoint } = await this.requestToken(this.tokenUrl)
    this.socket = new WebSocket(`${endpoint}?token=${token}`)

    await this.waitOpening()
    await this.defineSocketListeners(this.socket)

    this.definePingTimer()
  }

  private async requestToken(
    url: string
  ): Promise<{ token: string; endpoint: string }> {
    const {
      data: { data },
    } = await axios.post(url)

    const { token } = data
    const { endpoint } = data.instanceServers[0]
    return { token: token, endpoint: endpoint }
  }

  private defineSocketListeners = (): void => {
    this.socket.onopen = () => this.onSocketOpen()
    this.socket.onerror = () => this.onSocketError()
    this.socket.onclose = () => this.onSocketClose()
    this.socket.onmessage = (event: WebSocket.MessageEvent) =>
      this.onSocketMessage(event)
  }

  private onSocketMessage(event: WebSocket.MessageEvent): void {
    const data = JSON.parse(event.data.toString())

    console.log(data)

    // if (data.result === null) return
    // this.processData(data)
  }

  private onSocketOpen(): void {
    this.socket.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: ['!ticker@arr'],
        id: 987654321,
      })
    )
  }

  private onSocketClose(): void {
    console.log('Closed')
  }

  private onSocketError(): void {
    console.log('Error')
  }
}
