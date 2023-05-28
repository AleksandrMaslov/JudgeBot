import {
  ExchangeModel,
  TradeCase,
  BinanceModel,
  BybitModel,
  KucoinModel,
  OkcoinModel,
  OkxModel,
  PoloniexModel,
} from '../models/index.js'

export class Controller {
  private exchanges: ExchangeModel[]

  constructor() {
    this.exchanges = [
      new BinanceModel(),
      // new BybitModel(),
      // new KucoinModel(),
      // new OkcoinModel(),
      // new OkxModel(),
      // new PoloniexModel(),
    ]
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process()
    }, timer)
  }

  private process(): void {
    this.exchanges.forEach((e) => e.logStatus())
    console.log()
    // const cases = this.getAllCasesWithAsset('USDT')
    // this.logCases(cases)
    // console.log()
    // console.log()
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

  private logCases(cases: TradeCase[]): void {
    cases
      // .filter((c) => c.proffit! > 10 && c.proffit! < 50)
      // .sort((a, b) => b.proffit! - a.proffit!)
      .forEach((c) => c.log())
  }
}
