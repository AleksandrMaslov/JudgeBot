import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'
import { TradeCase } from '../models/tradeCase.js'

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

  private process(): void {
    // ALL
    // this.binance.getCasesWith(this.kucoin)

    // BY ASSET
    const asset = 'ETH'
    const cases = this.binance.getCasesWithAsset(this.kucoin, asset)
    this.logCases(cases)
  }

  private logCases(cases: TradeCase[]): void {
    for (const tradeCase of cases) {
      const { proffit } = tradeCase
      if (proffit! < 1) continue
      if (proffit! > 50) continue
      tradeCase.log()
    }
    console.log()
  }
}
