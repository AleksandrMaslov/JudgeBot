export type KucoinTicker = {
  type: string
  topic: string
  subject: string
  data: {
    sequence: number
    size: string
    price: string
    bestAsk: string
    bestAskSize: string
    bestBid: string
    bestBidSize: string
  }
}
