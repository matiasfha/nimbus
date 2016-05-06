import Botkit from 'botkit'
import fs from 'fs'
import jsonfile from 'jsonfile'
import path from 'path'
import redisStorage from 'botkit-storage-redis'

import Config from './config'
import { getAllChannels, importPlugins } from './utils'
const configs = new Config()

const runCheck = () => {
	if(!configs.has('BOT_SLACK_TOKEN') || !configs.has('REDIS_URL')){
		console.log('You need to set the slack TOKEN and the REDIS_URL')
		process.exit()
	}
}
runCheck()
//
const initBot = (slackToken) => {
	const redisConfig = {
		url: configs.get('REDIS_URL')
	}
	const controller = Botkit.slackbot({
		debug: false,
		log: 2,
		storage: redisStorage(redisConfig)
	})

	const bot = controller.spawn({
		token: slackToken
	}).startRTM()

	if(configs.has('PORT')){
		controller.setupWebserver(config.get('PORT'), (err, server) => {
			server.get('/jenkins-build', (req, res) => {
				console.log(req.query)
			})
			controller.createWebhookEndpoints(server)
		})
	}
	return {bot, controller}
}

/*
* Import plugins
*/


const { bot, controller } = initBot(configs.get('BOT_SLACK_TOKEN'))
Promise.all([getAllChannels(bot), importPlugins('./src/plugins')])
.then((response) => {
	configs.set({key:'channels', value:response[0]})
	response[1].forEach((plugin) => require(plugin).hear(controller, configs))
})
