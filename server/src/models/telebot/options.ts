import { BotCommand, ConstructorOptions } from 'node-telegram-bot-api'

export const constructorOptions: ConstructorOptions = {
  polling: true,
}

export const commands: BotCommand[] = [
  { command: '/welcome', description: 'Приветствие' },
  { command: '/status', description: 'Текущее состояние бирж' },
  { command: '/trade', description: 'Заняться делом' },
]
