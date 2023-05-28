import { OkcoinTickerData } from './tickerData'

export type OkcoinTickerResponse = {
  code: string //'0'
  msg: string //''
  data: OkcoinTickerData[]
}
