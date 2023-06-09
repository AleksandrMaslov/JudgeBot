import {
  ExchangeModel,
  TradeCase,
  BinanceModel,
  BitfinexModel,
  BybitModel,
  CoinbaseModel,
  CryptoComModel,
  ExmoModel,
  HuobiModel,
  KucoinModel,
  OkcoinModel,
  OkxModel,
  PoloniexModel,
  TidexModel,
  MexcModel,
  KrakenModel,
} from '../models/index.js'

export class Controller {
  private exchanges: ExchangeModel[]

  constructor() {
    this.exchanges = [
      new BinanceModel(),
      new BitfinexModel(),
      new BybitModel(),
      new CoinbaseModel(),
      new CryptoComModel(),
      new ExmoModel(),
      new HuobiModel(),
      new KrakenModel(),
      new KucoinModel(),
      new MexcModel(),
      new OkcoinModel(),
      new OkxModel(),
      new PoloniexModel(),
      new TidexModel(),
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

    if (this.exchanges.length < 2) return

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

  private logCases(cases: TradeCase[]): void {
    cases
      .filter((c) => c.proffit! > 5 && c.proffit! < 50)
      .sort((a, b) => b.proffit! - a.proffit!)
      .forEach((c) => c.log())
  }
}
