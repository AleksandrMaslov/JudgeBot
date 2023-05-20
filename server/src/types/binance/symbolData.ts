export type BinanceSymbolData = {
  symbol: string
  status: string
  baseAsset: string
  quoteAsset: string

  // baseAssetPrecision: 8
  // quotePrecision: 8
  // quoteAssetPrecision: 8
  // orderTypes: [
  //   'LIMIT',
  //   'LIMIT_MAKER',
  //   'MARKET',
  //   'STOP_LOSS',
  //   'STOP_LOSS_LIMIT',
  //   'TAKE_PROFIT',
  //   'TAKE_PROFIT_LIMIT'
  // ]
  // icebergAllowed: true
  // ocoAllowed: true
  // quoteOrderQtyMarketAllowed: true
  // allowTrailingStop: false
  // cancelReplaceAllowed: false
  // isSpotTradingAllowed: true
  // isMarginTradingAllowed: true
  // filters: [//These are defined in the Filters section.
  // //All filters are optional]
  // permissions: ['SPOT', 'MARGIN']
  // defaultSelfTradePreventionMode: 'NONE'
  // allowedSelfTradePreventionModes: ['NONE']
}
