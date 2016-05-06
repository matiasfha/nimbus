var webpack = require('webpack')
var path = require('path')
var fs = require('fs')

var nodeModules = {}
fs.readdirSync('node_modules')
	.filter(function(x) {
		return ['.bin'].indexOf(x) === -1
	})
	.forEach(function(mod) {
		nodeModules[mod] = 'commonjs ' + mod
	})

module.exports = {
	entry: './src/main.js',
	target: 'node',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'index.js'
	},
	externals: nodeModules,
	plugins: [
		new webpack.BannerPlugin('require("source-map-support").install();',
                           { raw: true, entryOnly: false }),
		new webpack.optimize.OccurenceOrderPlugin(true),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			output: {
				comments: false
			},
			compress: {
				warnings: false,
				screw_ie8: true
			}
		}),
		new webpack.NoErrorsPlugin(),
	],
	module: {
		loaders: [
			{
				test: /\.js?$/,
				exclude: /node_modules/,
				loaders: ['babel-loader','eslint']
			}
		]
	},
	devtool: 'source-map'
}
