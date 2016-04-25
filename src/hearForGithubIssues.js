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
	const replyMsg = `I don't know the repository to look for that issue.\n Try repoName/#1234`
	bot.reply(context, replyMsg)
}

const replyIssue = (bot, context, {issue, userName, repoName}) => {
	let text = ''
	if(issue.body) {
		text = issue.body.substring(0,100)
	}
	const issueUrl = `https://github.com/${userName}/${repoName}/issues/${issue.number}`
	let replyMsg = `Issue ${issue.number}: ${issue.title} ${issueUrl}`

	if(issue.asignee){
		replyMsg=`${replyMsg}\nassigned to: ${issue.assignee.login}`
	}
	if(issue.milestone){
		const mTitle = encodeURIComponent(issue.milestone.title)
		const milestoneUrl = `https://github.com/${userName}/${repoName}/milestones/${mTitle}`
		replyMsg =`${replyMsg}\nMilestone: ${issue.milestone.title} ${milestoneUrl}`
	}

	replyMsg=`${replyMsg}\n${text}...`
	bot.reply(context, replyMsg)
}

const getRepoName = (bot, msg, configs) => {
	//get the channel name based on channelID
	const setRepoName = (channelName: string, msg: string, reposMap: Object) => {
		//if the repoName is defined in the msg
		if(msg){
			return msg.replace(/\/$/,'')
		}
		//If the channelName is defined
		if(channelName!=='') {
			//if channelName is defined in the reposMap
			if(reposMap.hasOwnProperty(channelName)) {
				return configs.reposMap[channelName]
			}
		}
		return undefined
	}

	return new Promise((resolve, reject) => {
		bot.api.channels.info({ channel: msg.channel }, (err, response) => {
			let channelName = ''
			if(response.ok){
				channelName = response.channel.name
			}
			const repoName = setRepoName(channelName, msg.match[2], configs.reposMap)
			if(repoName) {
				return resolve(repoName)
			}
			return reject(repoName)
		})
	})
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
export const hearForGithubIssues = (bot, configs) => {
	bot.hears([/((\S*|^)?#(\d+)).*/],['direct_message','direct_mention','mention','ambient'], (bot,msg) => {
		const issueNumber = msg.match[3]
		const userName = getUsername(configs)
		getRepoName(bot, msg, configs)
			.then((repoName) => {
				getIssue({ userName, repoName, issueNumber, token: configs.githubToken })
					.then((issue) => {
						replyIssue(bot, msg, {issue, userName, repoName})
					},
					(err) => console.log(err)
				)
			})
	})
}
