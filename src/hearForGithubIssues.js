const Github = require('github-api')
const getIssue = ({ userName, repoName, issueNumber, token }, callback, error) => {
	// const url = `https://api.github.com/repos/${user}/${reponame}/issues/${issueNumber}`
	const github = new Github({
		token: token,
		auth: 'oauth'
	})
	const issues = github.getIssues(userName, repoName)
	issues.get(issueNumber, (err, issue) => {
		if(err){
			error(err)
			return
		}
		callback(issue)
	})
}


/** Hear functions **/
export const hearForGithubIssues = (bot, configs) => {

	const replyError = (bot, context) => {
		const replyMsg = `I don't know the repository to look for that issue.\n Try repoName/#1234`
		bot.reply(context, replyMsg)
	}

	const replyIssue = (bot, context, {issue, owner, repoName}) => {
		let text = ''
		if(issue.body) {
			text = issue.body.substring(0,100)
		}
		const issueUrl = `https://github.com/${owner}/${repoName}/issues/${issue.number}`
		const mTitle = encodeURIComponent(issue.milestone.title)
		const milestoneUrl = `https://github.com/${owner}/${repoName}/milestones/${mTitle}`
		let replyMsg = `Issue ${issue.number}: ${issue.title} ${issueUrl}`
		if(issue.asignee){
			replyMsg=`${replyMsg}\nassigned to: ${issue.assignee.login}`
		}
		if(issue.milestone){
			replyMsg =`${replyMsg}\nMilestone: ${issue.milestone.title} ${milestoneUrl}`
		}

		replyMsg=`${replyMsg}\n${text}...`
		bot.reply(context, replyMsg)
	}

	bot.hears([/((\S*|^)?#(\d+)).*/],['direct_message','direct_mention','mention','ambient'], (bot,msg) => {
		let issueNumber = msg.match[3]
		let channelName = msg.channel
		let repoName
		let replyMsg
		// Check if the channel name is related with some repo
		console.log(channelName)
		console.log(configs.reposMap)
		if(configs.reposMap.hasOwnProperty(channelName)) {
			repoName = configs.reposMap[channelName]
			console.log(repoName)
		}else{
			if(msg.match[2]){
				repoName = msg.match[2].replace(/\/$/,'')
			}
		}
		if(!repoName) {
			return replyError(bot, msg)
		}
		//Get username/organization
		let userName = configs.organization
		if(configs.hasOwnProperty('user')) {
			userName = configs.user
		}
		return getIssue({ userName, repoName, issueNumber, token: configs.githubToken },
			(issue) => replyIssue(bot, msg, {issue, owner: userName, repoName}),
			(err) => bot.reply(msg, err)
		)

	})
}
