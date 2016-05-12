const Github = require('github-api')
import R from 'ramda'
const getIssue = ({ userName, repoName, issueNumber, token }) => {
	const github = new Github({
		token: token,
		auth: 'oauth'
	})
	const issues = github.getIssues(userName, repoName)
	return new Promise((resolve, reject) => {
		issues.get(issueNumber, (err, issue) => {
			if(err){
				return reject(err)
			}
			return resolve(issue)
		})
	})
}

const replyError = (bot, context) => {
	const replyMsg = `>>> I don't know the repository to look for that issue.\n Try repoName/#1234`
	bot.replyPrivate(context, replyMsg)
}

const replyIssue = (bot, context, {issue, userName, repoName}) => {
	let text = ''
	if(issue.body) {
		text = issue.body.substring(0,100)
	}
	const issueUrl = `https://github.com/${userName}/${repoName}/issues/${issue.number}`
	let replyMsg = ''

	let fields = []
	if(issue.assignee){
		fields.push({
			title: 'Assigned to',
			value: issue.assignee.login,
			short: true
		})
	}
	if(issue.milestone){
		const mTitle = encodeURIComponent(issue.milestone.title)
		const milestoneUrl = `https://github.com/${userName}/${repoName}/milestones/${mTitle}`
		fields.push({
			title: 'Milestone',
			value: `<${milestoneUrl}|${issue.milestone.title}>`,
			short: true
		})
	}

	replyMsg=`${replyMsg}\n${text}...`
	bot.reply(context, {
		text:' ',
		attachments: [{
			title: issue.title,
			title_link: issueUrl,
			fallback: replyMsg,
			text: replyMsg,
			color: '#36a64f',
			fields: fields
		}],
		unfurl_links: false

	})
}
const getReposMap = R.curry((configs) => {
	const get = R.memoize(conf => {
		const map = JSON.parse(conf.get('BOT_GITHUB_REPOS_MAP'))
		const channels = conf.get('channels')
		const list = R.filter((item) => R.has(item.name,map))
		const mapping = R.map((item) =>
			Object.assign({}, {id: item.id, channel: item.name, repo: map[item.name] })
		)
		return R.compose(mapping, list)(channels)
	})
	return get(configs)
})


const getRepoName = (msg, configs) => {
	//if the repoName is defined in the msg
	if(msg.match[2]){
		return msg.match[2].replace(/\/$/,'')
	}
	const find = R.find((item) => item.id === msg.channel)
	const repo = R.compose(find, getReposMap)(configs)
	if(!repo) {
		return configs.get('BOT_GITHUB_BASE_REPO')
	}
	return repo.repo
}

const getUsername = (configs) => {
	//Get username/organization
	let userName = configs.get('BOT_GITHUB_ORGANIZATION')
	if(configs.hasOwnProperty('user')) {
		userName = configs.get('BOT_GITHUB_USER')
	}
	return userName
}

/** Hear functions **/
export const hear = (controller, configs) => {
	console.log('Hearing for issues')
	controller.hears([/issue ((\S*|^)?#(\d+)).*/, /pr ((\S*|^)?#(\d+)).*/],'direct_message,direct_mention,mention,ambient', (bot,msg) => {
		const issueNumber = msg.match[3]
		const userName = getUsername(configs)
		const repoName = getRepoName(msg, configs)
		console.log(`Issue ${issueNumber} from ${userName}/${repoName}`)
		getIssue({ userName, repoName, issueNumber, token: configs.get('BOT_GITHUB_TOKEN') })
			.then((issue) => {
				replyIssue(bot, msg, {issue, userName, repoName})
			},
			(err) => {
				replyError(bot, msg)
			}
		)
	})
}
