import axios from 'axios'
const jenkinsBuild = ({ branch, recipe, token }) => {
	// let url = 'http://jenkins.mozio.com/job/mozio.com/job/StgDeploymentFELegacy/buildWithParameters'
	// url = `${url}?branch=${branch}&recipe=${recipe}&cause=OnDemand`
	let url = `http://mozio:${token}@`
	url = `${url}jenkins.mozio.com/job/mozio.com/job/StgDeploymentFELegacy/buildWithParameters`
	url = `${url}?branch=${branch}&recipe=${recipe}&cause=OnDemand`
	url = `${url}?token=h4jDvfESiGz2GSh6W0niHWEMB7q55c1I`
	return axios.post(url, {
		token: token,
		user: 'mozio:moziorocks'
	})
}

export const hear = (controller, configs) => {
	controller.hears(['deploy ([\\w\\S]*) ([\\w\\S]*)'], 'direct_message,direct_mention,mention', (bot, msg) => {
		const branch = msg.match[1]
		const recipe = msg.match[2]
		const token = configs.jenkinsToken
		jenkinsBuild({branch, recipe, token}).then((response) => {
			if(response.status==201){
				bot.reply(msg, {
					text:' ',
					attachments:[{
						title: `Mozio legacy deploy from ${branch} to ${recipe}`,
						title_link: 'http://jenkins.mozio.com/job/mozio.com/job/StgDeploymentFELegacy/',
						fallback: `Mozio legacy deploy from ${branch} to ${recipe}`,
						text: `Deploying mozio legacy project from branch ${branch} using recipe ${recipe}`,
						color: '#36a64f'
					}],
					unfurl_links: false
				})
			}else{
				bot.replyPrivate(msg,response.statusText)
			}

		}, (error) => {
			console.log(error)
			bot.replyPrivate(msg, error)
		})
	})
}
