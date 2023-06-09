import {
  BotCommand,
  ConstructorOptions,
  InlineKeyboardMarkup,
  SendMessageOptions,
} from 'node-telegram-bot-api'

export const constructorOptions: ConstructorOptions = {
  polling: true,
}

export const commands: BotCommand[] = [
  { command: '/start', description: 'Начальное приветствие' },
  { command: '/info', description: 'Получить информацию' },
]

export const keyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      // {
      //   text: string;
      //   url?: string | undefined;
      //   callback_data?: string | undefined;
      //   web_app?: WebAppInfo;
      //   login_url?: LoginUrl | undefined;
      //   switch_inline_query?: string | undefined;
      //   switch_inline_query_current_chat?: string | undefined;
      //   callback_game?: CallbackGame | undefined;
      //   pay?: boolean | undefined
      // }
      { text: 'BTC', callback_data: 'BTCUSDT' },
      { text: 'ETH', callback_data: 'ETHUSDT' },
      { text: 'TXA', callback_data: 'TXAUSDT' },
      { text: 'TWT', callback_data: 'TWTUSDT' },
    ],
    [{ text: 'URL', url: 'https://mail.ru' }],
  ],
}

export const keyboardOptions: SendMessageOptions = {
  // reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply
  reply_markup: keyboard,
  protect_content: true,

  // parse_mode?: ParseMode
  // disable_web_page_preview?: boolean

  // message_thread_id?: number
  // disable_notification?: boolean
  // reply_to_message_id?: number
  // allow_sending_without_reply: true,
}

export const testKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: 'TEST', callback_data: 'BTCUSDT' },
      { text: 'TEST', callback_data: 'ETHUSDT' },
      { text: 'TEST', callback_data: 'TXAUSDT' },
      { text: 'TEST', callback_data: 'TWTUSDT' },
    ],
  ],
}
