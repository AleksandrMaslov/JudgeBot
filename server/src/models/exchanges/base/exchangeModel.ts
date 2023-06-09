import { ConnectableModel } from './connectableModel.js'
import { Ticker } from '../../ticker.js'
import { TradeCase } from '../../tradeCase.js'
import { TriangleCase } from '../../triangleCase.js'

export class ExchangeModel extends ConnectableModel {
  constructor() {
    super()

    if (this.constructor == ExchangeModel)
      throw new Error("Abstract classes can't be instantiated.")
  }

  public getStatus(): {
    status: string
    name: string
    symbols: string
    updates: string
  } {
    const online = 'Online'
    const offline = 'Offline(!)'
    const status = this.socket
      ? this.socket?.readyState === 1
        ? online
        : offline
      : offline

    const symbolsTotal = Object.keys(this.tickers).length
    const name = this.constructor.name
    const updates = this.updated.toString()

    this.updated = 0
    return {
      status: `[ ${status} ]`,
      name: `${name}`,
      symbols: `Symbols: ${symbolsTotal}`,
      updates: `Updates: ${updates}`,
    }
  }

  public getSelfCases(): TradeCase[] {
    const assets = this.getAssets()
    console.log('START')

    let cases: any = []
    for (const assetA of assets) {
      for (const assetB of assets) {
        if (assetA == assetB) continue

        for (const assetC of assets) {
          if (assetB == assetC) continue
          if (assetC == assetA) continue

          const tickersA: any = this.getBasedTickers(assetA)
          if (!tickersA[assetB]) continue

          const tickersB: any = this.getBasedTickers(assetB)
          if (!tickersB[assetC]) continue

          const tickersC: any = this.getBasedTickers(assetC)
          if (!tickersC[assetA]) continue

          const tradeCase = new TriangleCase(
            assetA,
            tickersA[assetB],
            tickersB[assetC],
            tickersC[assetA]
          )
          // TOO LONG
        }
      }
      console.log('A')
    }

    console.log(cases.length)
    return cases
  }

  public getCasesWithAsset(
    exchange: ExchangeModel,
    asset: string
  ): TradeCase[] {
    const currentBasedTickers = this.getBasedTickers(asset)
    const exchangeBasedTickers = exchange.getBasedTickers(asset)
    const tickers = [currentBasedTickers, exchangeBasedTickers]
    return this.getTradeCases(asset, tickers)
  }

  public showAllCasesWith(exchange: ExchangeModel): void {
    const assets = Array.from(
      new Set([...this.getAssets(), ...exchange.getAssets()])
    )

    while (assets.length !== 0) {
      const asset = assets.pop()
      const cases = this.getCasesWithAsset(exchange, asset!)
      for (const tradeCase of cases) {
        const { proffit } = tradeCase
        if (proffit! < 1) continue
        if (proffit! > 50) continue
        tradeCase.log()
      }
    }
    console.log()
  }

  private getAssets(): string[] {
    return Array.from(
      new Set([
        ...Object.values(this.tickers).map((t: any) => t.base),
        ...Object.values(this.tickers).map((t: any) => t.quote),
      ])
    )
  }

  private getTradeCases(asset: string, unorderedTickers: any[]): TradeCase[] {
    const orderedTickers = this.getOrderedTickers(unorderedTickers)
    const [baseTickers, pairTickers] = orderedTickers

    const tradeCases = []
    for (const pair of Object.entries<Ticker>(baseTickers)) {
      const [pairAsset, ticker] = pair
      const pairTicker: Ticker = pairTickers[pairAsset]

      if (!pairTicker) continue
      tradeCases.push(new TradeCase(asset, pairAsset, ticker, pairTicker))
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

      const pairAsset = symbol
        .replace(asset, '')
        .replace('-', '')
        .replace('_', '')

      tickers[pairAsset] = ticker
    }
    return tickers
  }
}
