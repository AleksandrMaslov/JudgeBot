import { SymbolData } from '../../../types'

export class Ticker {
  public exchange: string
  public url: string
  public symbol: string
  public askPrice: number | undefined
  public askQty: number | undefined
  public bidPrice: number | undefined
  public bidQty: number | undefined

  constructor(symbolData: SymbolData) {
    const { exchange, url, symbol } = symbolData

    this.exchange = exchange
    this.url = url
    this.symbol = symbol

    this.askPrice = undefined
    this.askQty = undefined
    this.bidPrice = undefined
    this.bidQty = undefined
  }
}
