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
import { blackList } from './blackList.js'
import { networks } from './networks.js'

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
    const validCases = this.filterCases(cases)

    this.telebot.updateCases(validCases)
  }

  private getAllCasesWithAsset(asset: string): TradeCase[] {
    let cases: TradeCase[] = []
    let list = Array.from(this.exchanges).filter((e) => e.getStatus().status)

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

  private filterCases(cases: TradeCase[]): TradeCase[] {
    const i = 0
    const j = 20

    return cases
      .filter((c) => c.proffit! > 20 && c.proffit! < 50)
      .filter((c) => this.isNotBlackListed(c))
      .filter((c) => this.isNetworkCompatible(c))
      .sort((a, b) => a.proffit! - b.proffit!)
      .splice(i, j)
  }

  private isNotBlackListed(tradeCase: TradeCase): boolean {
    const data = tradeCase.getData()
    const { base, pair, start, end } = data
    const caseSymbol = `${base}-${pair}`

    if (!blackList[caseSymbol]) return true

    const exchanges = blackList[caseSymbol]
    if (exchanges.includes(start!)) return false
    if (exchanges.includes(end!)) return false

    return true
  }

  private isNetworkCompatible(tradeCase: TradeCase): boolean {
    const data = tradeCase.getData()
    const { pair, start, end } = data

    if (!networks[pair]) return true

    const networksCompatibility = networks[pair]
    if (!networksCompatibility[start!]) return true
    if (!networksCompatibility[end!]) return true

    const startNetworks = networksCompatibility[start!]
    const endNetworks = networksCompatibility[end!]
    const availableNetworks = [
      ...Object.keys(startNetworks),
      ...Object.keys(endNetworks),
    ]
    const duplicates = availableNetworks.filter(
      (item, index) => availableNetworks.indexOf(item) !== index
    )

    if (duplicates.length > 0) return true

    return false
  }
}
