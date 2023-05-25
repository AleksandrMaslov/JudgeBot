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

  private process(): void {
    const asset = 'USDT'
    const cases = this.binance.getCasesWith(this.kucoin, asset)

    for (const tradeCase of cases) {
      const { proffit } = tradeCase
      if (proffit! > 1 && proffit! < 100) tradeCase.log()
    }
    console.log('\n')
  }
}
