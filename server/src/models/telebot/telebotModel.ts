import TelegramApi, {
  BotCommand,
  CallbackQuery,
  Message,
  Metadata,
} from 'node-telegram-bot-api'

import {
  constructorOptions,
  commands,
  keyboardOptions,
  testKeyboard,
  keyboard,
} from './options.js'

export class TeleBot {
  private token: string
  private api: TelegramApi
  private commands: BotCommand[]
  private greetingsSticker: string

  constructor() {
    this.token = '6232959751:AAGyW3KyPIN2fT8cqhXoJ_eVI1bW0Nzjf_s'
    this.api = new TelegramApi(this.token, constructorOptions)
    this.commands = commands

    this.greetingsSticker =
      'https://tlgrm.ru/_/stickers/668/b21/668b2148-fa65-48ed-9a6c-e69982e919bd/3.webp'

    this.defineCommands()
    this.defineListeners()

    console.log('[ Online ] TeleBot')
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

    this.api.sendMessage(id, `Я тебя не понимаю`)
  }

  private async onCommand(mesage: Message): Promise<void> {
    const { text, chat, from } = mesage
    const { id } = chat
    const { username, first_name, last_name } = from!

    if (text === '/start') {
      const userName = `${first_name ? first_name : ''}-${
        last_name ? `-${last_name}` : ''
      }${username ? `(${username})` : ''}`

      this.api
        .sendSticker(id, this.greetingsSticker)
        .then(() => this.api.sendMessage(id, `Добро пожаловать, ${userName}`))
      return
    }

    if (text === '/info') {
      this.api.sendMessage(id, `Меню:`, keyboardOptions)
      return
    }

    this.api.sendMessage(id, `Я не понимаю такой команды, попробуй еще раз`)
  }

  private async onCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
    const { message } = callbackQuery
    const { message_id, text, reply_markup, chat } = message!
    const { id } = chat
    console.log(reply_markup)

    this.api.editMessageReplyMarkup(testKeyboard, {
      chat_id: id,
      message_id: message_id,
    })

    this.api.editMessageText('TEST TEXT', {
      chat_id: id,
      message_id: message_id,
      reply_markup: keyboard,
    })
  }
}
