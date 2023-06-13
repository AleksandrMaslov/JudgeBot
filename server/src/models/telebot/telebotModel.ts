import { TradeCase } from '../exchanges/base/tradeCase.js'

import TelegramApi, {
  BotCommand,
  InlineKeyboardMarkup,
  Message,
  Metadata,
} from 'node-telegram-bot-api'

import {
  CONSTRUCTOR_OPTIONS,
  COMMANDS,
  HEADER,
  ONLINE,
  ONLINE_SYMBOL,
  OFFLINE_SYMBOL,
  OFFLINE,
} from './options.js'

export class TeleBot {
  private token: string
  private api: TelegramApi
  private commands: BotCommand[]
  private greetingsSticker: string

  private statusMessages: Message[]
  private caseMessages: Message[]

  private exchangeStatus: InlineKeyboardMarkup
  private tradeCasesData: string

  constructor() {
    this.token = '6232959751:AAGyW3KyPIN2fT8cqhXoJ_eVI1bW0Nzjf_s'
    this.api = new TelegramApi(this.token, CONSTRUCTOR_OPTIONS)
    this.commands = COMMANDS

    this.greetingsSticker =
      'https://tlgrm.ru/_/stickers/668/b21/668b2148-fa65-48ed-9a6c-e69982e919bd/3.webp'

    this.defineCommands()
    this.defineListeners()

    console.log('[ Online ] TeleBot')

    this.exchangeStatus = {
      inline_keyboard: [[{ text: '', callback_data: '0' }]],
    }

    this.tradeCasesData = ''

    this.statusMessages = []
    this.caseMessages = []
  }

  public updateStatus(
    stats: {
      status: boolean
      name: string
      symbols: string
      updates: string
      url: string
    }[]
  ): void {
    const statsWithHeaders = [HEADER, ...stats]

    this.exchangeStatus = {
      inline_keyboard: statsWithHeaders.map((stat, i) => {
        const { status, name, symbols, updates, url } = stat

        if (!(typeof status === 'boolean')) {
          return [
            { text: `${status}`, callback_data: i.toString() },
            { text: `${symbols}`, callback_data: i.toString() },
            { text: `${updates}`, callback_data: i.toString() },
            { text: `${name}`, callback_data: i.toString() },
          ]
        }

        const textStatus = status
          ? `${ONLINE_SYMBOL} [ ${ONLINE} ]`
          : `${OFFLINE_SYMBOL} [ ${OFFLINE} ]`

        return [
          { text: `${textStatus}`, callback_data: i.toString() },
          { text: `${symbols}`, callback_data: i.toString() },
          { text: `${updates}`, callback_data: i.toString() },
          { text: `${name}`, url: url, callback_data: i.toString() },
        ]
      }),
    }

    if (!this.statusMessages) return
    this.updateStatusKeyboard()
  }

  public updateCases(cases: TradeCase[]): void {
    this.tradeCasesData = cases.reduce((result, tradeCase) => {
      const data = tradeCase.getData()
      const {
        base,
        pair,
        start,
        startUrl,
        end,
        endUrl,
        askPrice,
        bidPrice,
        proffit,
      } = data

      const startLink = `<a href="${startUrl}">${start}</a>`
      const endLink = `<a href="${endUrl}">${end}</a>`
      const footer = `${startLink}       >>       ${endLink}\n\n`
      const caseMessage = `💸 ${proffit}%     ${base} - ${pair}\n${askPrice}$    >>    ${bidPrice}$\n${footer}`
      return result + caseMessage
    }, '')

    if (!this.caseMessages) return
    if (this.tradeCasesData.length === 0) return

    try {
      this.updateCasesData()
    } catch (error) {
      console.log('CASES MESSAGE - TOO LONG')
    }
  }

  private defineCommands(): void {
    this.api.setMyCommands(this.commands)
  }

  private defineListeners(): void {
    this.api.on('message', async (message, metadata) => {
      this.onMessage(message, metadata)
    })
  }

  private async onMessage(mesage: Message, metadata: Metadata): Promise<void> {
    const { type } = metadata
    const { text, chat, from } = mesage
    const { id } = chat
    const { username } = from!

    if (type !== 'text') return

    console.log(`${username}: ${text}`)

    if (text?.startsWith('/')) {
      this.onCommand(mesage)
      return
    }

    this.api.sendMessage(id, `Я тебя не понимаю`)
  }

  private async onCommand(mesage: Message): Promise<void> {
    const { text, chat } = mesage
    const { id } = chat

    if (!text) return

    if (!COMMANDS.map((c) => c.command).includes(text)) {
      this.api.sendMessage(id, `Я не понимаю такой команды, попробуй еще раз`)
      return
    }

    if (text === '/welcome') {
      this.onWelcomeCommand(mesage)
      return
    }

    if (text === '/trade') {
      this.onTradeCommand(mesage)
      return
    }

    if (text === '/status') {
      this.onStatusCommand(mesage)
      return
    }
  }

  private onWelcomeCommand(mesage: Message): void {
    const { chat, from } = mesage
    const { id } = chat
    const { username, first_name, last_name } = from!

    const userName = `${first_name ? first_name : ''} ${
      last_name ? ` ${last_name}` : ''
    }${username ? `(${username})` : ''}`

    this.api.sendSticker(id, this.greetingsSticker).then(() => {
      this.api.sendMessage(id, `Добро пожаловать, ${userName}`)
    })
  }

  private async onStatusCommand(mesage: Message): Promise<void> {
    const { chat } = mesage
    const { id } = chat

    this.statusMessages.push(
      await this.api.sendMessage(id, `Exchanges Connection Status:`, {
        reply_markup: this.exchangeStatus,
        protect_content: true,
      })
    )
  }

  private async onTradeCommand(mesage: Message): Promise<void> {
    if (this.tradeCasesData.length === 0) return

    const { chat } = mesage
    const { id } = chat

    this.caseMessages.push(
      await this.api.sendMessage(id, this.tradeCasesData, {
        protect_content: true,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    )
  }

  private updateStatusKeyboard(): void {
    this.statusMessages.forEach((message) => {
      const { message_id, chat } = message
      const { id } = chat

      this.api.editMessageReplyMarkup(this.exchangeStatus, {
        chat_id: id,
        message_id: message_id,
      })
    })
  }

  private updateCasesData(): void {
    this.caseMessages.forEach((message) => {
      const { text, message_id, chat } = message
      const { id } = chat

      if (text === this.tradeCasesData) return

      this.api.editMessageText(this.tradeCasesData, {
        chat_id: id,
        message_id: message_id,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    })
  }

  private deleteMessage(message: Message): void {
    const { message_id, chat } = message
    const { id } = chat
    this.api.deleteMessage(id, message_id)
  }
}
