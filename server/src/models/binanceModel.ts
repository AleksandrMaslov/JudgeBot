import axios from 'axios'
import WebSocket from 'ws'

import { BinanceTicker } from '../types'

export class BinanceModel {
  public symbols: any

  private socket: WebSocket

  constructor() {
    this.symbols = {}
    this.getSymbols()

    this.socket = new WebSocket(`wss://stream.binance.com:9443/ws`)
    this.defineSocketListeners()
  }

  private getSymbols = async (): Promise<void> =>
    await axios
      .get('https://api.binance.com/api/v3/exchangeInfo')
      .then((response) => {
        const {
          data: { symbols },
        } = response

        symbols
          .filter((s: any) => s.status === 'TRADING')
          .map((s: any) => {
            const symbol = s.symbol
            this.symbols[symbol] = {
              symbol: symbol,
              base: s.baseAsset,
              quote: s.quoteAsset,
              askPrice: 0,
              askQty: 0,
              bidPrice: 0,
              bidQty: 0,
            }
          })
      })
      .catch((error) => {
        console.log(error)
      })

  private processData = (tickers: BinanceTicker[]): void => {
    try {
      tickers.map((ticker: BinanceTicker) => {
        const symbol = ticker.s
        const askPrice = parseFloat(ticker.a)
        const askQty = parseFloat(ticker.A)
        const bidPrice = parseFloat(ticker.b)
        const bidQty = parseFloat(ticker.B)

        this.symbols[symbol].askPrice = askPrice
        this.symbols[symbol].askQty = askQty

        this.symbols[symbol].bidPrice = bidPrice
        this.symbols[symbol].bidQty = bidQty
      })
    } catch (error) {
      console.log(error)
    }
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
    if (data.result === null) return
    this.processData(data)
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
