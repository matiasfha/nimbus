import promisify from 'es6-promisify'
import fs from 'fs'
import R from 'ramda'

export const getTeam = (bot) =>promisify(bot.api.team.info)({})

export const getPublicChannels = (bot) => promisify(bot.api.channels.list)({exclude_archived:1})

export const getPrivateChannels = (bot) => promisify(bot.api.groups.list)({exclude_archived:1})

export const getAllChannels = (bot) => {
	const props = R.props(['id','name'])
	const map = R.map(props)
	const result = R.compose(map, R.flatten)
	return Promise.resolve(
		Promise.all([getPublicChannels(bot), getPrivateChannels(bot)]).then((response) => {
			const channels = R.compose(map, R.prop('channels'))(response[0])
			const groups = R.compose(map, R.prop('groups'))
			const all = R.concat(channels)
			const object = R.map((item) => ({id: item[0], name: item[1]}))
			const result = R.compose(object, all, groups)
			return result(response[1])
		})
	)
}

export const readFile = (file, encoding) => promisify(fs.readFile)(file, encoding)

export const readDir = (dir) => promisify(fs.readdir)(dir)

export const fileExists = (path) => promisify(fs.access)(path, fs.F_OK)

export const importPlugins = (bot, configs) => {
	const plugins = require.context('./plugins', true,/\.js$/)
	const modules = plugins.keys().map(plugins)
	const functions = R.map((plugin) => plugin.hear)
	const run = R.forEach((f) => f(bot, configs))
	R.compose(run, functions)(modules)
}
