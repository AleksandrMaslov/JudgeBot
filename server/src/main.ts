import { BinanceModel } from './models/binanceModel.js'
import { Controller } from './controllers/controller.js'

const model = new BinanceModel()
const app = new Controller(model)
