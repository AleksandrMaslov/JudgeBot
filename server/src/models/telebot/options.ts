import { BotCommand, ConstructorOptions } from 'node-telegram-bot-api'

export const CONSTRUCTOR_OPTIONS: ConstructorOptions = {
  polling: true,
}

export const COMMANDS: BotCommand[] = [
  { command: '/welcome', description: 'Приветствие' },
  { command: '/status', description: 'Текущее состояние бирж' },
  { command: '/trade', description: 'Заняться делом' },
]

export const ONLINE_SYMBOL = '🍀'
export const ONLINE = 'On'

export const OFFLINE_SYMBOL = '🪵'
export const OFFLINE = 'Off'

export const HEADER = {
  status: 'STATUS',
  name: 'EXCHANGE',
  symbols: 'PAIRS',
  updates: 'UPDATES',
  url: '',
}
