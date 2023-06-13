import { ExchangeModel } from './base/exchangeModel.js'
import { CoinbaseTickerResponse, CoinbaseTicker } from '../../types'

export class CoinbaseModel extends ExchangeModel {
  constructor() {
    super()

    this.exchangeUrl = 'https://www.coinbase.com/'
    this.wsConnectionUrl = 'wss://ws-feed.exchange.coinbase.com'
    this.senderPrefix = this.constructor.name

    this.init()
  }

  // OVERRIDE WS DATA METHODS
  messageHandler(messageData: any): void {
    const { type } = messageData
    if (!(type === 'status')) return
    this.parseStatusData(messageData)
  }

  isDataMessageNotValid(messageData: any): boolean {
    const { type } = messageData
    if (type === 'subscriptions') return true
    if (type === 'ticker') return false
    if (type === 'status') return true
    console.log('UNDEFINED MESSAGE:', messageData)
    return true
  }

  async subscribeAllTickers(): Promise<void> {
    this.socket!.send(
      JSON.stringify({
        type: 'subscribe',
        channels: [{ name: 'status' }],
      })
    )

    let symbols = Object.keys(this.tickers)
    let total = symbols.length

    while (total === 0) {
      await this.delay(500)
      symbols = Object.keys(this.tickers)
      total = symbols.length
    }

    this.socket!.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: symbols,
        channels: ['ticker'],
      })
    )
  }

  updateTickers(tickerData: CoinbaseTicker): void {
    const { product_id, best_ask, best_ask_size, best_bid, best_bid_size } =
      tickerData

    this.ensureTicker({
      exchange: this.constructor.name.replace('Model', ''),
      url: this.exchangeUrl,
      symbol: product_id,
    })

    this.updateTickerData({
      symbol: product_id,
      askPrice: parseFloat(best_ask),
      askQty: parseFloat(best_ask_size),
      bidPrice: parseFloat(best_bid),
      bidQty: parseFloat(best_bid_size),
    })

    this.updated++
  }

  // PRIVATE
  private parseStatusData(data: CoinbaseTickerResponse): void {
    const { products } = data

    const validProducts = products.filter((p) => {
      const { status, type } = p
      if (!(status === 'online')) return false
      if (!(type === 'spot')) return false
      return true
    })

    validProducts.forEach((p) => {
      const { id } = p
      this.ensureTicker({
        exchange: this.constructor.name.replace('Model', ''),
        url: this.exchangeUrl,
        symbol: id,
      })
    })
  }
}
