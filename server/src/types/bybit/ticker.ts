export type BybitTicker = {
  topic: string //'orderbook.50.BTCUSDT'
  type: string //'snapshot'
  ts: number //1672304484978
  data: {
    s: string //'BTCUSDT'
    b: string[][] //[['16493.50', '0.006'], ['16493.00', '0.100']]
    a: string[][] //[['16611.00', '0.029'], ['16612.00', '0.213']]
    u: number //18521288
    seq: number //7961638724
  }
}
