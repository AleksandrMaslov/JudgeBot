import { ExchangeModel } from '../models/exchanges/base/exchangeModel.js'
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
    this.binance.getTradeablePairsWith(this.kucoin, asset)
  }
}
