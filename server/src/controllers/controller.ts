import { WebSocket } from 'ws'
import { ExchangeModel } from '../models/exchanges/base/exchangeModel.js'
import { BinanceModel } from '../models/exchanges/binanceModel.js'
import { BybitModel } from '../models/exchanges/bybitModel.js'
import { KucoinModel } from '../models/exchanges/kucoinModel.js'
import { TradeCase } from '../models/tradeCase.js'

export class Controller {
  private exchanges: ExchangeModel[]

  constructor() {
    this.exchanges = [new BinanceModel(), new KucoinModel(), new BybitModel()]
  }

  public refresh(timer: number): NodeJS.Timer {
    return setInterval(() => {
      this.process()
    }, timer)
  }

  public process(): void {
    const asset = 'USDT'

    this.exchanges.forEach((exchange) => {
      console.log(
        `${exchange.constructor.name} (${
          exchange.socket?.readyState === 1 ? '- Online -' : '- Offline -'
        }) - Symbols: ${Object.keys(exchange.tickers).length}`
      )
    })

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

    this.logCases(cases)
  }

  private logCases(cases: TradeCase[]): void {
    for (const tradeCase of cases) {
      const { proffit } = tradeCase
      if (proffit! < 1) continue
      if (proffit! > 50) continue
      tradeCase.log()
    }
    console.log()
  }
}
