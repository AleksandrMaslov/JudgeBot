import { Ticker } from './ticker'

export class TriangleCase {
  public baseAsset?: string

  public proffit?: number

  public tickerA: Ticker
  public tickerB: Ticker
  public tickerC: Ticker

  constructor(
    baseAsset: string,
    tickerA: Ticker,
    tickerB: Ticker,
    tickerC: Ticker
  ) {
    this.baseAsset = baseAsset

    this.tickerA = tickerA
    this.tickerB = tickerB
    this.tickerC = tickerC

    console.log(baseAsset, tickerA, tickerB, tickerC)

    // this.analize()
  }

  // public log(): void {
  //   console.log(
  //     `${this.baseAsset}-${this.pairAsset}: ${this.start?.exchange} / `,
  //     this.start?.askPrice,
  //     ` => `,
  //     this.end?.bidPrice,
  //     ` / ${this.end?.exchange} = `,
  //     this.proffit,
  //     '%'
  //   )
  // }

  private analize() {
    if (this.tickerA.base !== this.tickerB.base) {
      // console.log(
      //   'Reversed:',
      //   this.tickerA.exchange,
      //   this.tickerA.base,
      //   this.tickerA.quote,
      //   this.tickerB.exchange,
      //   this.tickerB.base,
      //   this.tickerB.quote
      // )

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

    // this.start = buyTicker
    // this.end = sellTicker
    this.proffit = parseFloat(((spread * 100) / buyTicker.askPrice!).toFixed(2))
  }

  private calculateReverseProffit(buyTicker: Ticker, sellTicker: Ticker): void {
    const spread = this.rollPrice(sellTicker.askPrice!) - buyTicker.askPrice!

    // this.start = buyTicker
    // this.end = sellTicker
    this.proffit = parseFloat(((spread * 100) / buyTicker.askPrice!).toFixed(2))
  }

  private rollPrice(price: number): number {
    return 1 / price
  }
}
