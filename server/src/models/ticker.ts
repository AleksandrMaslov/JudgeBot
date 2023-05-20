import { SymbolData } from '../types'

export class Ticker {
  public symbol: string
  public base: string | undefined
  public quote: string | undefined
  public askPrice: number | undefined
  public askQty: number | undefined
  public bidPrice: number | undefined
  public bidQty: number | undefined

  constructor(symbolData: SymbolData) {
    const { symbol, base, quote } = symbolData

    this.symbol = symbol

    this.base = base
    this.quote = quote

    this.askPrice = undefined
    this.askQty = undefined
    this.bidPrice = undefined
    this.bidQty = undefined
  }
}
