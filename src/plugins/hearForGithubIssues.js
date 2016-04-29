const Github = require('github-api')
const getIssue = ({ userName, repoName, issueNumber, token }, callback, error) => {
	// const url = `https://api.github.com/repos/${user}/${reponame}/issues/${issueNumber}`
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

const getRepoName = (msg, configs) => {
	//if the repoName is defined in the msg
	if(msg.match[2]){
		return msg.match[2].replace(/\/$/,'')
	}
	const repo = configs.reposMap.find((item) => {
		console.log(item.id, msg.channel)
		return item.id === msg.channel
	})
	if(!repo) {
		return configs.baseRepo
	}
	console.log(repo)
	return repo.repo
}

const getUsername = (configs) => {
	//Get username/organization
	let userName = configs.organization
	if(configs.hasOwnProperty('user')) {
		userName = configs.user
	}
	return userName
}


/** Hear functions **/
export const hear = (controller, configs) => {
	controller.hears([/issue ((\S*|^)?#(\d+)).*/, /pr ((\S*|^)?#(\d+)).*/],'direct_message,direct_mention,mention,ambient', (bot,msg) => {
		const issueNumber = msg.match[3]
		const userName = getUsername(configs)
		const repoName = getRepoName(msg, configs)
		getIssue({ userName, repoName, issueNumber, token: configs.githubToken })
			.then((issue) => {
				replyIssue(bot, msg, {issue, userName, repoName})
			},
			(err) => {
				replyError(bot, msg)
				console.log(err)
			}
		)
	})
}
