import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'

export class Controller {
  private binance: BinanceModel
  private kucoin: KucoinModel
  private base: string

  constructor() {
    this.base = 'USDT'

    this.binance = new BinanceModel()
    this.kucoin = new KucoinModel()
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process(this.base)
    }, timer)
  }

  private process(asset: string) {
    // FILTER WITH 0 PRICE
    const binanceAssets = Object.keys(this.binance.tickers).filter((k) =>
      k.includes(asset)
    )

    const kucoinAssets = Object.keys(this.kucoin.tickers).filter((k) =>
      k.includes(asset)
    )

    console.log(`Binance: ${binanceAssets.length}\n${binanceAssets}`)
    console.log(`Kucoin: ${kucoinAssets.length}\n${kucoinAssets}`)
  }
}
