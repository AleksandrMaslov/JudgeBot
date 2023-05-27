import { OkxTickerData } from './tickerData'

export type OkxTickerResponse = {
  code: string //'0'
  msg: string //''
  data: OkxTickerData[]
}
