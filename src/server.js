import express from 'express'
import bodyParser from 'body-parser'


export const setupServer = (configs) => {
	const app = express()
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded())
	app.use(bodyParser.text())
	app.get('/', (req, res) => {
		res.send('Hello World!.. I\'m Nimbus')
	})


	app.set('port', (configs.get('PORT') || 8000))

	app.listen(app.get('port'), () => {
		console.log(`Listening on port ${app.get('port')}`)
	})
	return app
}
