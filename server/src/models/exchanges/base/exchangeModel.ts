import { ConnectableModel } from './connectableModel.js'
import { TradeCase } from '../../tradeCase.js'
import { Ticker } from '../../ticker.js'

export class ExchangeModel extends ConnectableModel {
  constructor() {
    super()

    if (this.constructor == ExchangeModel) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  public getCasesWith(exchange: ExchangeModel): void {
    const assets = new Set([
      ...Object.values(this.tickers).map((t: any) => t.base),
      ...Object.values(this.tickers).map((t: any) => t.quote),
      ...Object.values(exchange.tickers).map((t: any) => t.base),
      ...Object.values(exchange.tickers).map((t: any) => t.quote),
    ])
    const assetsArray = Array.from(assets)

    while (assetsArray.length !== 0) {
      const asset = assetsArray.pop()
      const cases = this.getCasesWithAsset(exchange, asset)
      for (const tradeCase of cases) {
        const { proffit } = tradeCase
        if (proffit! < 1) continue
        if (proffit! > 50) continue
        tradeCase.log()
      }
    }
    console.log()
  }

  public getCasesWithAsset(
    exchange: ExchangeModel,
    asset: string
  ): TradeCase[] {
    const currentBasedTickers = this.getBasedTickers(asset)
    const exchangeBasedTickers = exchange.getBasedTickers(asset)
    const tickers = [currentBasedTickers, exchangeBasedTickers]
    return this.getTradeCases(tickers)
  }

  private getTradeCases(unorderedTickers: any[]): TradeCase[] {
    const orderedTickers = this.getOrderedTickers(unorderedTickers)
    const [baseTickers, pairTickers] = orderedTickers

    const tradeCases = []
    for (const pair of Object.entries<Ticker>(baseTickers)) {
      const [pairAsset, ticker] = pair
      const pairTicker: Ticker = pairTickers[pairAsset]

      if (!pairTicker) continue
      tradeCases.push(new TradeCase(pairAsset, ticker, pairTicker))
    }

    return tradeCases
  }

  private getOrderedTickers(tickers: any[]): any[] {
    return tickers.sort((a, b) =>
      Object.keys(a).length > Object.keys(b).length ? 1 : -1
    )
  }

  private getBasedTickers(asset: string): {} {
    let tickers: any = {}

    for (const pair of Object.entries<Ticker>(this.tickers)) {
      const [symbol, ticker] = pair

      if (!symbol.includes(asset)) continue
      if (symbol.includes('BTCUP')) continue
      if (symbol.includes('BTCDOWN')) continue
      if (symbol.includes('ETHUP')) continue
      if (symbol.includes('ETHDOWN')) continue

      if (!ticker.askPrice) continue
      // if (!ticker.askQty) continue
      if (!ticker.bidPrice) continue
      // if (!ticker.bidQty) continue

      if (ticker.askPrice === 0) continue
      if (ticker.askQty === 0) continue
      if (ticker.bidPrice === 0) continue
      if (ticker.bidQty === 0) continue

      const pairAsset = symbol.replace(asset, '').replace('-', '')
      tickers[pairAsset] = ticker
    }
    return tickers
  }
}
