const path = require("path")

module.exports = {
	entry: "./index.tsx",
	output: { path: __dirname, filename: "bundle.js" },
	mode: 'production',
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
		alias: {
			// LHS must match webpack `externals` of sarif-web-component.
			'React': path.resolve('node_modules/react'),
			'ReactDOM': path.resolve('node_modules/react-dom'),
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
	performance: {
		maxAssetSize: 1.3 * 1024 * 1024,
		maxEntrypointSize: 1.3 * 1024 * 1024,
	},
	devServer : {
		host: '0.0.0.0', // Neccesary to server outside localhost
		port: 8080,
		stats: 'none',
		https: true,
	}
}
