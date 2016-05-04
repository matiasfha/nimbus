import Botkit from 'botkit'
import fs from 'fs'
import jsonfile from 'jsonfile'
import path from 'path'
import redisStorage from 'botkit-storage-redis'

const checkEnv = (githubToken = '', slackToken = '') => {
	if(githubToken==='' || slackToken===''){
		console.log('You need to set at least the github TOKEN and slack TOKEN')
		process.exit()
	}
}

const setConfigs = () :Object => {
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
			slackToken: slackToken,
			baseRepo: process.env.BOT_GITHUB_BASE_REPO
		}
		if(process.env.BOT_GITHUB_USER){
			configs.user = process.env.BOT_GITHUB_USER
		}
	}
	return configs
}

const initBot = (slackToken) => {
	const redisConfig = {
		url: process.env.REDIS_URL
	}
	const controller = Botkit.slackbot({
		debug: false,
		log: 2,
		storage: redisStorage(redisConfig)
	})

	const bot = controller.spawn({
		token: slackToken
	}).startRTM()

	if(process.env.PORT){
		controller.setupWebserver(process.env.PORT, (err, server) => {
			server.get('/jenkins-build', (req, res) => {
				console.log(req.query)
			})
			controller.createWebhookEndpoints(server)
		})
	}
	return {bot, controller}
}


const getChannels = (bot, configs) => {
	const getMap = (list: Array) =>
		list.filter((channel) => {
			const reposMap = configs.reposMap
			if(reposMap.hasOwnProperty(channel.name)){
				return {id: channel.id, channel: channel.name, repo: reposMap[channel.name]}
			}
		})

	const getPromise = (object: Object, type: string) =>
		new Promise((resolve, reject) => {
			object.list({exclude_archived: 1}, (err, response) => {
				if(response.ok) {
					const channels = getMap(response[type])
					return resolve(channels)
				}
				return reject(err)
			})
		})

	const channelPromise = getPromise(bot.api.channels, 'channels')
	const privatePromise = getPromise(bot.api.groups, 'groups')
	const teamPromise = new Promise((resolve, reject) => {
		bot.api.team.info({}, (err, response) => {
			controller.storage.teams.save({id: response.team.id}, (err) => {
				if(err) {
					console.error(err)
					reject(err)
				}else{
					resolve(response.team)
				}
			})
		})
	})
	return Promise.all([channelPromise, privatePromise, teamPromise])
}
/*
* Import plugins
*/
const importPlugins = (directory) => {
	let plugins = []
	fs.readdirSync(directory).forEach((filename) => {
		directory = directory.replace('src/','')
		plugins.push(`${directory}/${filename}`)
	})
	return plugins
}
const plugins = importPlugins('./src/plugins')
// import { hearForGithubIssues } from './hearForGithubIssues'

const configs = setConfigs()
const { bot, controller } = initBot(configs.slackToken)
getChannels(bot, configs).then((response) => {
	configs.reposMap = response[0].concat(response[1])
	plugins.forEach((plugin) => {
		require(plugin).hear(controller, configs)
	})
}, (error) => console.log(error))
