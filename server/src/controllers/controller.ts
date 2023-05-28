import { ExchangeModel } from '../models/exchanges/base/exchangeModel.js'
import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { BybitModel } from '../models/exchanges/bybitModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'
import { OkxModel } from '../models/exchanges/okxModel.js'
import { PoloniexModel } from '../models/exchanges/poloniexModel.js'
import { TradeCase } from '../models/tradeCase.js'

export class Controller {
  private exchanges: ExchangeModel[]

  constructor() {
    this.exchanges = [
      new BinanceModel(),
      new KucoinModel(),
      new BybitModel(),
      new OkxModel(),
      new PoloniexModel(),
    ]
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process()
    }, timer)
  }

  public process(): void {
    this.logExchanges()
    console.log()
    const cases = this.getAllCasesWithAsset('USDT')
    this.logCases(cases)
    console.log()
    console.log()
  }

  private getAllCasesWithAsset(asset: string): TradeCase[] {
    let cases: TradeCase[] = []
    let list = Array.from(this.exchanges)

    while (list.length > 1) {
      const baseExchange = list.pop()

      list.forEach((pairExchange) => {
        cases = [
          ...cases,
          ...baseExchange!.getCasesWithAsset(pairExchange, asset),
        ]
      })
    }
    return cases
  }

  private logExchanges(): void {
    this.exchanges.forEach((exchange) => {
      console.log(
        `${exchange.constructor.name} (${
          exchange.socket?.readyState === 1 ? '- Online -' : '- Offline -'
        }) - Symbols: ${Object.keys(exchange.tickers).length}`
      )
    })
  }

  private logCases(cases: TradeCase[]): void {
    cases
      .filter((c) => c.proffit! > 10 && c.proffit! < 50)
      .sort((a, b) => b.proffit! - a.proffit!)
      .forEach((c) => c.log())
  }
}
