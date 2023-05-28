export type OkcoinTicker = {
  arg: {
    channel: string //'tickers'
    instId: string //'BTC-USD'
  }
  data: [
    {
      instId: string //'BTC-USD'
      askPx: string //'16838.75'
      askSz: string //'0.0275'
      bidPx: string //'16836.5'
      bidSz: string //'0.0404'
      // instType: 'SPOT'
      // last: '16838.75'
      // lastSz: '0.0027'
      // open24h: '16762.13'
      // high24h: '16943.44'
      // low24h: '16629.04'
      // sodUtc0: '16688.74'
      // sodUtc8: '16700.35'
      // volCcy24h: '3016898.9552'
      // vol24h: '179.6477'
      // ts: '1672842446928'
    }
  ]
}
