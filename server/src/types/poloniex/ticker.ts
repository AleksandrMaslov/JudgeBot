export type PoloniexTicker = {
  channel: string //'book'
  data: [
    {
      symbol: string //'BTC_USDT'
      asks: string[][] //
      bids: string[][] //[['40001.5', '2.87'], ['39999.4', '1']]
      // createTime: number //1648052239156
      // id: number //123456
      // ts: number //1648052239192
    }
  ]
}
