import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'

export class Controller {
  private binance: BinanceModel
  private kucoin: KucoinModel

  constructor() {
    this.binance = new BinanceModel()
    this.kucoin = new KucoinModel()
  }
}
