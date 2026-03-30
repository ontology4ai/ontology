const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');

const { merge } = require('webpack-merge');
const common = require('./webpack.base');
const DefaultSetting = require('./setting');

const prodConfig = {
	mode: 'production',

	output: {
		path: common.output.path + '/_resource_/',
		publicPath: '/_resource_/',
		filename: 'js/[name].min.js?hash=[hash]',
		chunkFilename: 'chunks/[name].min.js?hash=[hash]',
		cssFilename: 'css/[name].min.css?hash=[hash]'
	},

	optimization: {
		// minimize: false,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					warnings: false,
					compress: {
						comparisons: false,
					},
					parse: {},
					mangle: true,
					output: {
						comments: false,
						ascii_only: true,
					},
				},
				exclude: /(tape-mx-designer|dp-mx-designer)/
			})
		],
		nodeEnv: 'production',
		moduleIds: 'named',
		chunkIds: 'named',
		sideEffects: true,
		concatenateModules: true,
		runtimeChunk: 'single',
		splitChunks: {
			chunks: 'all',
			minSize: 30000,
            minChunks: 1,
            maxAsyncRequests: 12,
            maxInitialRequests: 12,
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name(module) {
						const { context } = module;
						const matches = context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
						const packageName = matches && matches.length > 2 ? matches[1] : 'other';
						return `${packageName.replace('@', '')}`;
					}
				}
			},
		},
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: 'public/index.html',
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				// minifyJS: true,
				minifyCSS: true,
				minifyURLs: true,
			},
			inject: true,
		}),

		new MiniCssExtractPlugin({
			filename: 'css/[name].min.css?hash=[hash]',
			chunkFilename: 'chunks/[name].min.css?hash=[hash]',
		    ignoreOrder: false
		}),

		/* DefaultSetting.Gzip &&
			new CompressionPlugin({
				algorithm: 'gzip',
				test: /\.js$|\.css$|\.html$/,
				threshold: 10240,
				minRatio: 0.8,
			}), */

		DefaultSetting.Analyzer &&
			new BundleAnalyzerPlugin({
				analyzerPort: 9999,
			}),
	].filter(Boolean),

	performance: {
		assetFilter: assetFilename => !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename),
	},
};
module.exports = merge(common, prodConfig);
