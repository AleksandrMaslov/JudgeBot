import { BinanceModel } from '../models/exchanges/binanceModel.js'

export class Controller {
  private model: BinanceModel

  constructor(model: BinanceModel) {
    this.model = model
  }
}
