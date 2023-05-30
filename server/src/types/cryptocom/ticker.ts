export type CryptoComTicker = {
  result: {
    instrument_name: string //'ILV_BTC'
    data: [
      {
        asks: string[][]
        bids: string[][]
      }
    ]
  }
}
