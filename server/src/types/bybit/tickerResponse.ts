import { BybitTickerData } from './tickerData'

export type BybitTickerResponse = {
  retCode: number //0
  retMsg: string //'OK'
  result: {
    category: string //'spot'
    list: BybitTickerData[]
  }
  retExtInfo: object //{}
  time: number //1673859087947
}
