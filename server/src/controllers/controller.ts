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
  TeleBot,
} from '../models/index.js'

export class Controller {
  private telebot: TeleBot
  private exchanges: ExchangeModel[]

  constructor() {
    this.telebot = new TeleBot()

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
      // new OkcoinModel(),
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
    const stats = this.exchanges.map((e) => e.getStatus())
    this.telebot.updateStatus(stats)

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
      .filter((c) => c.proffit! > 5 && c.proffit! < 30)
      .sort((a, b) => b.proffit! - a.proffit!)
      .forEach((c) => c.log())
  }
}
