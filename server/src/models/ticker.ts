import { SymbolData } from '../types'

export class Ticker {
  public symbol: string
  public base: string
  public quote: string
  public askPrice: number
  public askQty: number
  public bidPrice: number
  public bidQty: number

  constructor(symbolData: SymbolData) {
    const { symbol, base, quote } = symbolData

    this.symbol = symbol
    this.base = base
    this.quote = quote

    this.askPrice = 0
    this.askQty = 0
    this.bidPrice = 0
    this.bidQty = 0
  }
}
