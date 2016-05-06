import R from 'ramda'
import fs from 'fs'

class Config {
	constructor(){
		this._CONFIG = {}
		this.load()
	}

	load() {
		const _parse = (src) => {
			const lines = R.split('\n')
			const match = R.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
			const matches = R.map(match)
			const getMatchs = R.compose(matches, lines)
			const replaceQuotes = R.replace(/(^['"]|['"]$)/g, '')
			const trim = R.trim()
			const getValue = (item) => {
				const v = item[2] ? item[2] : ''
				const value = R.compose(trim, replaceQuotes)(v)
				const object = {}
				object[item[1]] = value
				return object
			}
			const filter = R.filter(n => n.length > 0)
			const map = R.compose(R.map(getValue), filter, getMatchs)
			let result = {}
			const each = R.forEach((item) => {
				const key = R.keys(item)[0]
				result[key] = item[key]
			})
			R.compose(each, map)(src)
			return result
		}
		try {
			fs.accessSync('.env', fs.F_OK)
			const data = fs.readFileSync('.env',{ encoding: 'utf8'})
			this._CONFIG = _parse(data)
		}catch(e){
			this._CONFIG = process.env
		}
		return this
	}

	get(name) {
		if(name){
			return R.prop(name, this._CONFIG)
		}
		return this._CONFIG
	}

	set({key, value}) {
		this._CONFIG[key] = value
		return this
	}

	has(name){
		return R.has(name, this._CONFIG)
	}
}

export default Config
