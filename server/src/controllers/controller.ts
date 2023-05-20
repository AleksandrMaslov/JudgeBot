import { ExchangeModel } from '../models/exchanges/base/exchangeModel.js'
import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'

export class Controller {
  private binance: BinanceModel
  // private kucoin: KucoinModel

  constructor() {
    this.binance = new BinanceModel()
    // this.kucoin = new KucoinModel()
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process()
    }, timer)
  }

  private process() {
    // FILTER WITH 0 PRICE
    // const baseExchange = this.getSmallerExchangeOfTwo(this.binance, this.kucoin)
  }

  private getTradeblePairsOfTwo(
    exchangeA: ExchangeModel,
    exchangeB: ExchangeModel
  ): ExchangeModel {
    // const baseSymbolsA = this.binance.getBaseTickers(this.baseAsset)
    return exchangeA
  }

  // private getBaseSymbolsList(exchange: ExchangeModel) {
  //   return exchange.tickers.
  // }
}
