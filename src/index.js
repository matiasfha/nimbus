import Botkit from 'botkit'
import fs from 'fs'
import jsonfile from 'jsonfile'
import path from 'path'


const checkEnv = (githubToken = '', slackToken = '') => {
	if(githubToken==='' || slackToken===''){
		console.log('You need to set at least the github TOKEN and slack TOKEN')
		process.exit()
	}
}

const setConfigs = () => {
	let configs
	try {
		fs.accessSync(path.join('.','./configs.json'), fs.F_OK)
		configs = jsonfile.readFileSync('configs.json')
	}catch(e) {
		const githubToken = process.env.BOT_GITHUB_TOKEN
		const slackToken = process.env.BOT_SLACK_TOKEN
		checkEnv(githubToken, slackToken)
		configs = {
			githubToken: githubToken,
			user: process.env.BOT_GITHUB_USER,
			organization: process.env.BOT_GITHUB_ORGANIZATION,
			reposMap: process.env.BOT_GITHUB_REPOS_MAP,
			slackToken: slackToken
		}
	}
	return configs
}

const initBot = (slackToken) => {
	const controller = Botkit.slackbot({
		debug: false,
		log: 1
	})

	controller.spawn({
		token: slackToken
	}).startRTM( (err) => {
		if(err){
			throw new Error(err)
		}
		// setTimeout( () => controller.closeRTM(), 500)
	})
	controller.setupWebServer()
	return controller
}

/*
* Import plugins
*/
import { hearForGithubIssues } from './hearForGithubIssues'

const configs = setConfigs()
const bot = initBot(configs.slackToken)
hearForGithubIssues(bot, configs)
