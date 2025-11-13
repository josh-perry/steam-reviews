const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	entry: './src/index.ts',
	mode: isProduction ? 'production' : 'development',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
		charset: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
			filename: 'index.html',
			inject: 'body',
			scriptLoading: 'defer',
			meta: {
				charset: 'UTF-8'
			}
		})
	],
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		compress: true,
		port: 3000,
		hot: true,
		open: true,
		proxy: [
			{
				context: ['/api'],
				target: 'http://localhost:5000',
				changeOrigin: true,
			}
		]
	},
	optimization: {
		usedExports: false,
		sideEffects: false
	}
};