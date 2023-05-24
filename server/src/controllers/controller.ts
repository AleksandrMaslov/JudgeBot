import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'

export class Controller {
  private binance: BinanceModel
  private kucoin: KucoinModel

  constructor() {
    this.binance = new BinanceModel()
    this.kucoin = new KucoinModel()
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process()
    }, timer)
  }

  private process() {
    const asset = 'USDT'
    const cases = this.binance.getCasesWith(this.kucoin, asset)
    this.calculate(cases)
  }

  private calculate(tradeablePairs: any[][]): void {
    let spreads = []
    for (const pair of tradeablePairs) {
      const [pairAsset, ticker, pairTicker] = pair

      let proffitA: number
      let proffitB: number
      if (ticker.base === pairTicker.base) {
        const spreadA = ticker.askPrice! - pairTicker.bidPrice!
        proffitA = parseFloat(((spreadA * 100) / ticker.askPrice!).toFixed(2))
        const spreadB = pairTicker.askPrice! - ticker.bidPrice!
        proffitB = parseFloat(
          ((spreadB * 100) / pairTicker.askPrice!).toFixed(2)
        )
      } else {
        console.log('different!', ticker.base, pairTicker.base)
        // FIX
        const spreadA = ticker.askPrice! - pairTicker.bidPrice!
        proffitA = 0 //parseFloat(((spreadA * 100) / ticker.askPrice!).toFixed(2))
        const spreadB = pairTicker.askPrice! - ticker.bidPrice!
        proffitB = 0 //parseFloat( ((spreadB * 100) / pairTicker.askPrice!).toFixed(2) )
      }

      if (proffitA > 2 || proffitB > 2)
        spreads.push([pairAsset, proffitA, proffitB])
    }
    console.log(spreads.length)
    console.log(spreads)
  }
}
