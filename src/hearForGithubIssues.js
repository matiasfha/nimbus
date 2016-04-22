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

	const replyIssue = (bot, context, issue) => {
		let text = ''
		if(issue.body) {
			text = issue.body.substring(0,100)
		}
		let replyMsg = `Issue ${issue.number}: ${issue.title} ${issue.url}`
		if(issue.asignee){
			replyMsg=`${replyMsg}\nassigned to: ${issue.assignee.login}`
		}
		if(issue.milestone){
			replyMsg =`${replyMsg}\nMilestone: ${issue.milestone.title} ${issue.milestone.url}`
		}
		if(issue.pull_request){
			replyMsg= `${replyMsg}\nPull Request ${issue.pull_request.url}`
		}
		replyMsg=`${replyMsg}\n${text}...`
		bot.reply(context, replyMsg)
	}

	bot.hears([/((\S*|^)?#(\d+)).*/],['direct_message','direct_mention','mention','ambient'], (bot,msg) => {
		let issueNumber = msg.match[3]
		let channelName = msg.channel
		let repoName = msg.match[2].replace(/\/$/,'')
		let replyMsg
		// Check if the channel name is related with some repo
		if(configs.reposMap.hasOwnProperty(channelName)) {
			repoName = configs.reposMap[channelName]
		}
		if(!repoName) {
			return replyError(bot, msg)
		}
		//Get username/organization
		let userName = configs.organization
		if(configs.hasOwnProperty('user')) {
			userName = configs.user
		}
		console.log(userName, repoName, issueNumber)
		return getIssue({ userName, repoName, issueNumber, token: configs.githubToken },
			(issue) => replyIssue(bot, msg, issue),
			(err) => bot.reply(msg, err)
		)

	})
}
