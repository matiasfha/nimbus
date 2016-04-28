const Github = require('github-api')

const setup = (token) =>
	new Github({
		token: token,
		auth: 'oauth'
	})

const getOpenPrs = (user, repo, github) => {
	const repo = github.getRepo(user, repo)
	const pulls = repo.listPulls({
		state: 'open'
	})
	console.log(pulls)
}

const getUsername = (configs) => {
	//Get username/organization
	let userName = configs.organization
	if(configs.hasOwnProperty('user')) {
		userName = configs.user
	}
	return userName
}

export const hear = (controller, configs) => {
	controller.on('slash_command', (bot, msg) => {
		const regex = /report prs (.*)/
		const match = msg.text.match(regex)
		if(match) {
			getOpenPrs(getUsername(configs), match[1])
		}
		bot.replyPrivate(msg, 'Hi')
	})
}
