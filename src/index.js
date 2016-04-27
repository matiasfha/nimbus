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
		debug: false,
		log: 7
	})

	const bot = controller.spawn({
		token: slackToken
	}).startRTM()
	if(process.env.PORT){
		controller.setupWebserver(process.env.PORT)
	}
	return {bot, controller}
}


const getChannels = (bot, configs) => {
	const channePromise = new Promise((resolve, reject) => {
		bot.api.channels.list({exclude_archived: 1}, (err, response) => {
			if(response.ok) {
				const channels = response.channels.filter((channel) => {
					const reposMap = configs.reposMap
					if(reposMap.hasOwnProperty(channel.name)){
						return {id: channel.id, channel: channel.name, repo: reposMap[channel.name]}
					}
				})
				return resolve(channels)
			}
			return reject(err)
		})
	})

	const privatePromise = new Promise((resolve, reject) => {
		bot.api.groups.list({exclude_archived: 1}, (err, response) => {
			if(response.ok) {
				const channels = response.groups.filter((channel) => {
					const reposMap = configs.reposMap
					if(reposMap.hasOwnProperty(channel.name)){
						return {id: channel.id, channel: channel.name, repo: reposMap[channel.name]}
					}
				})
				return resolve(channels)
			}
			return reject(err)
		})
	})

	return Promise.all([channePromise, privatePromise])
}
/*
* Import plugins
*/
import { hearForGithubIssues } from './hearForGithubIssues'

const configs = setConfigs()
const { bot, controller } = initBot(configs.slackToken)
getChannels(bot, configs).then((response) => {
	const reposMap = response[0].concat(response[1])
	hearForGithubIssues(controller, configs, reposMap)
}, (error) => console.log(error))
