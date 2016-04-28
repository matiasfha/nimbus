const Github = require('github-api')

const setup = (token) =>
	new Github({
		token: token,
		auth: 'oauth'
	})

export const hear = (controller, configs) => {
	controller.on('slash_command', (bot, msg) => {
		bot.log(msg)
		bot.replyPrivate(msg, 'Hi')
	})
}
