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
			organization: process.env.BOT_GITHUB_ORGANIZATION,
			reposMap: process.env.BOT_GITHUB_REPOS_MAP,
			slackToken: slackToken
		}
		if(process.env.BOT_GITHUB_USER){
			configs.user = process.env.BOT_GITHUB_USER
		}
	}
	return configs
}

const initBot = (slackToken) => {
	const controller = Botkit.slackbot({
		debug: true,
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
	if(process.env.PORT){
		controller.setupWebserver(process.env.PORT)
	}
	return controller
}

/*
* Import plugins
*/
import { hearForGithubIssues } from './hearForGithubIssues'

const configs = setConfigs()
const bot = initBot(configs.slackToken)
hearForGithubIssues(bot, configs)
