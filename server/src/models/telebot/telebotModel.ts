import TelegramApi, {
  BotCommand,
  CallbackQuery,
  InlineKeyboardMarkup,
  Message,
  Metadata,
} from 'node-telegram-bot-api'

import { constructorOptions, commands } from './options.js'

export class TeleBot {
  private token: string
  private api: TelegramApi
  private commands: BotCommand[]
  private greetingsSticker: string

  private lastMessage?: Message
  private exchangeStatus: InlineKeyboardMarkup

  constructor() {
    this.token = '6232959751:AAGyW3KyPIN2fT8cqhXoJ_eVI1bW0Nzjf_s'
    this.api = new TelegramApi(this.token, constructorOptions)
    this.commands = commands

    this.greetingsSticker =
      'https://tlgrm.ru/_/stickers/668/b21/668b2148-fa65-48ed-9a6c-e69982e919bd/3.webp'

    this.defineCommands()
    this.defineListeners()

    console.log('[ Online ] TeleBot')

    this.exchangeStatus = {
      inline_keyboard: [[{ text: '', callback_data: '0' }]],
    }
  }

  public updateStatus(
    stats: {
      status: string
      name: string
      symbols: string
      updates: string
    }[]
  ): void {
    this.exchangeStatus = {
      inline_keyboard: stats.map((stat, i) => {
        const { status, name, symbols, updates } = stat
        const prefix = status.includes('Online') ? `🍀` : `🪵`

        return [
          { text: `${prefix}${status}`, callback_data: i.toString() },
          { text: `${name}`, callback_data: i.toString() },
          { text: `${symbols}`, callback_data: i.toString() },
          { text: `${updates}`, callback_data: i.toString() },
        ]
      }),
    }

    if (!this.lastMessage) return
    this.updateStatusKeyboard()
  }

  private defineCommands(): void {
    this.api.setMyCommands(this.commands)
  }

  private defineListeners(): void {
    this.api.on('message', async (message, metadata) => {
      this.onMessage(message, metadata)
    })

    this.api.on('callback_query', async (callbackQuery) =>
      this.onCallbackQuery(callbackQuery)
    )
  }

  private async onMessage(mesage: Message, metadata: Metadata): Promise<void> {
    const { type } = metadata
    const { text, chat } = mesage
    const { id } = chat

    if (type !== 'text') return

    if (text?.startsWith('/')) {
      this.onCommand(mesage)
      return
    }

    console.log(text)

    this.api.sendMessage(id, `Я тебя не понимаю`)
  }

  private async onCommand(mesage: Message): Promise<void> {
    const { text, chat } = mesage
    const { id } = chat

    this.deleteMessage(mesage)
    this.clearLastMessage()

    if (text === '/start') {
      this.onStartCommand(mesage)
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

    this.api.sendMessage(id, `Я не понимаю такой команды, попробуй еще раз`)
  }

  private clearLastMessage(): void {
    if (!this.lastMessage) return
    this.deleteMessage(this.lastMessage)
    this.lastMessage = undefined
  }

  private onStartCommand(mesage: Message): void {
    const { chat, from } = mesage
    const { id } = chat
    const { username, first_name, last_name } = from!

    const userName = `${first_name ? first_name : ''} ${
      last_name ? ` ${last_name}` : ''
    }${username ? `(${username})` : ''}`

    this.api
      .sendSticker(id, this.greetingsSticker)
      .then(() => this.api.sendMessage(id, `Добро пожаловать, ${userName}`))
  }

  private async onStatusCommand(mesage: Message): Promise<void> {
    const { chat } = mesage
    const { id } = chat

    this.lastMessage = await this.api.sendMessage(
      id,
      `Exchanges Connection Status:`,
      {
        reply_markup: this.exchangeStatus,
        protect_content: true,
      }
    )
  }

  private async onTradeCommand(mesage: Message): Promise<void> {
    const { chat } = mesage
    const { id } = chat

    this.lastMessage = await this.api.sendMessage(id, `Trading Pairs:`, {
      reply_markup: this.exchangeStatus,
      protect_content: true,
    })
  }

  private async onCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
    const { message } = callbackQuery
    const { message_id, text, reply_markup, chat } = message!
    const { id } = chat

    // this.api.editMessageText('TEST TEXT', {
    //   chat_id: id,
    //   message_id: message_id,
    //   reply_markup: keyboard,
    // })
  }

  private updateStatusKeyboard(): void {
    const { message_id, chat } = this.lastMessage!
    const { id } = chat
    this.api.editMessageReplyMarkup(this.exchangeStatus, {
      chat_id: id,
      message_id: message_id,
    })
  }

  private deleteMessage(message: Message): void {
    const { message_id, chat } = message
    const { id } = chat
    this.api.deleteMessage(id, message_id)
  }
}
