export type ExmoTicker = {
  event: string //'snapshot'
  topic: string //'spot/order_book_updates:BTC_USD'
  data: {
    ask: string[][] //[['100', '3', '300'], ['200', '4', '800']]
    bid: string[][] //[['99', '2', '198'], ['98', '1', '98']]
  }
  // ts: 1574427585174
}
