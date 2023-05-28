import { Ticker } from './ticker'

export class TradeCase {
  public baseAsset: string
  public pairAsset: string

  public proffit?: number

  public start?: Ticker
  public end?: Ticker

  public tickerA: Ticker
  public tickerB: Ticker

  constructor(
    baseAsset: string,
    pairAsset: string,
    tickerA: Ticker,
    tickerB: Ticker
  ) {
    this.baseAsset = baseAsset
    this.pairAsset = pairAsset

    this.tickerA = tickerA
    this.tickerB = tickerB

    this.analize()
  }

  public log(): void {
    console.log(
      `${this.baseAsset}-${this.pairAsset}: ${this.start?.exchange} / `,
      this.start?.askPrice,
      ` => `,
      this.end?.bidPrice,
      ` / ${this.end?.exchange} = `,
      this.proffit,
      '%'
    )
  }

  private analize() {
    if (this.isReversedSymbol()) {
      this.calculateReverseProffit(this.tickerA, this.tickerB)
      if (this.proffit! > 0) return
      this.calculateReverseProffit(this.tickerB, this.tickerA)
      return
    }

    this.calculateProffit(this.tickerA, this.tickerB)
    if (this.proffit! > 0) return
    this.calculateProffit(this.tickerB, this.tickerA)
  }

  private calculateProffit(buyTicker: Ticker, sellTicker: Ticker): void {
    const spread = sellTicker.bidPrice! - buyTicker.askPrice!

    this.start = buyTicker
    this.end = sellTicker
    this.proffit = parseFloat(((spread * 100) / buyTicker.askPrice!).toFixed(2))
  }

  private calculateReverseProffit(buyTicker: Ticker, sellTicker: Ticker): void {
    const spread = this.rollPrice(sellTicker.askPrice!) - buyTicker.askPrice!

    this.start = buyTicker
    this.end = sellTicker
    this.proffit = parseFloat(((spread * 100) / buyTicker.askPrice!).toFixed(2))
  }

  private rollPrice(price: number): number {
    return 1 / price
  }

  private isReversedSymbol(): boolean {
    return !(
      (this.tickerA.symbol.startsWith(this.pairAsset) &&
        this.tickerB.symbol.startsWith(this.pairAsset)) ||
      (this.tickerA.symbol.endsWith(this.pairAsset) &&
        this.tickerB.symbol.endsWith(this.pairAsset))
    )
  }
}
