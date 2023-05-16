import { BinanceModel } from '../models/binanceModel.js'

export class Controller {
  private model: BinanceModel

  constructor(model: BinanceModel) {
    this.model = model
  }
}
