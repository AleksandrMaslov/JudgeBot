export type TidexTicker = {
  // id: null
  // method: string //'depth.update'
  params: [
    boolean, //false,
    { asks: string[][]; bids: string[][] },
    string //'ETH_UAH'
  ]
}
