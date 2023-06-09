import { BotCommand, ConstructorOptions } from 'node-telegram-bot-api'

export const constructorOptions: ConstructorOptions = {
  polling: true,
}

export const commands: BotCommand[] = [
  // { command: '/start', description: 'Начальное приветствие' },
  { command: '/status', description: 'Текущее состояние бирж' },
  { command: '/trade', description: 'Заняться делом' },
]
