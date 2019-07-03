const path = require("path")
const webpack = require('webpack')

module.exports = {
	entry: "./index.tsx",
	output: { path: __dirname, filename: "bundle.js" },
	mode: 'production',
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
		alias: {
			'react': path.resolve('node_modules/react'),
			'react-dom': path.resolve('node_modules/react-dom'),
		},
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.s?css$/,
				use: ['style-loader', 'css-loader', 'sass-loader']
			},
			{ test: /\.png$/, use: 'url-loader' },
			{ test: /\.woff$/, use: 'url-loader' },
		]
	},
	devServer : {
		host: '0.0.0.0', // Neccesary to server outside localhost
		port: 8080,
		stats: 'none',
		https: true,
	}
}
