import Jenkins from 'jenkins-api'
import promisify from 'es6-promisify'

const lastChannel = ''

const setupJenkins = (configs) => {
	let url = `http://${configs.get('BOT_JENKINS_USER')}:${configs.get('BOT_JENKINS_ACCESS_TOKEN')}@`
	url = `${url}${configs.get('BOT_JENKINS_URL')}`
	return Jenkins.init(url)
}

const requestBuild = (jenkins, {branch, recipe, token, name}) =>
	promisify(jenkins.build)(name, {branch, recipe, token})

const getBuildInfo = (jenkins, name) =>
	promisify(jenkins.last_build_info)(name)

const setupPostUrl = (server, bot) => {
	server.post('/jenkins-build', (req, res) => {
		const buildID = req.body.BUILD_ID
		const buildResult = req.body.BUILD_RESULT
		const buildUrl = req.body.BUILD_URL
		const jobName = req.body.JOB_NAME
		if(lastChannel!==''){
			bot.say({
				text: ' ',
				channel: lastChannel,
				attachments: [{
					title: `Jenkins build result for job ${jobName}`,
					title_link: buildUrl,
					text: `The job status: ${buildResult}`,
					color: 'green'
				}]
			})
		}
	})
}

export const hear = (controller, configs) => {
	const jenkins = setupJenkins(configs)
	const name = configs.get('BOT_JENKINS_JOB_NAME')
	const token = configs.get('BOT_JENKINS_JOB_TOKEN')
	setupPostUrl(configs.get('server'), controller.bot)
	controller.hears(['deploy ([\\w\\S]*) ([\\w\\S]*)'], 'direct_message,direct_mention,mention', (bot, msg) => {
		const branch = msg.match[1]
		const recipe = msg.match[2]
		const lastChannel = msg.channel
		requestBuild(jenkins, {
			branch,
			recipe,
			token,
			name
		}).then((response) => {
			//TODO Fix url of this message to show the actual build link
			bot.reply(msg, {
				text: ' ',
				attachments: [{
					title: `Jenkins is running job ${name} from branch${branch} using recipe ${recipe}`,
					title_link: response.location,
					fallback: '',
					text: '',
					color: '#36a64f'
				}],
				unfurl_links: false
			})
		}, (error) => {
			bot.reply(msg, error)
			console.log(error)
		})
	})

	controller.hears(['last deploy info'], 'direct_message,direct_mention,mention', (bot, msg) => {
		getBuildInfo(jenkins, name).then((response) => {
			let color =  '#408000'
			if(response.result === 'FAILURE'){
				color = '#cc2a36'
			}
			bot.reply(msg, {
				text: ' ',
				attachments: [{
					title: `Last build info about ${name}`,
					title_link: response.url,
					fallback: '',
					text: '',
					color: color,
					fields: [{
						title: 'Build result',
						value: response.result
					}]
				}]
			})
		})
	})
}
