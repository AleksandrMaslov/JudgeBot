export type TickerUpdate = {
  symbol: string
  askPrice: number
  askQty: number | undefined
  bidPrice: number
  bidQty: number | undefined
}
