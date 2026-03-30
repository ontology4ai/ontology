const { HotModuleReplacementPlugin } = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.base');

const devConfig = {
    mode: 'development',

    entry: [
        './src/index.tsx'
    ],

    output: {
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
        publicPath: '/',
    },

    optimization: {
    },

    devServer: {
        port: 3040,
        liveReload: false,
        compress: false,
        host: '0.0.0.0',
        devMiddleware: {
            publicPath: '/'
        },
        static: {
            directory:'./public'
        },
        open: false,
        hot: false,
        allowedHosts: "all",
        historyApiFallback: {
            disableDotRule: true
        },
        proxy: [
            {
                context: [
                    '/__modo',
                    '/_api',
                    '/_file',
                    '/resources',
                    '/datago/_file',
                    '/datago/_api',
                    '/datago/api',
                    '/_common_/_file',
                    '/_common_/_api',
                    '/_common_/api',
                    '/dataps/_file',
                    '/dataps/_api',
                    '/dataps/api',
                    '/dataflow/_file',
                    '/dataflow/_api',
                    '/dataflow/api',
                    '/dataex/_file',
                    '/dataex/_api',
                    '/dataex/api',
                    '/dataos_requirement/_file',
                    '/dataos_requirement/_api',
                    '/dataos_requirement/api',
                    '/mlops/_file',
                    '/mlops/_api',
                    '/mlops/api',
                    '/modo_dev_test/_file',
                    '/modo_dev_test/_api',
                    '/modo_dev_test/api',
                    '/dmg_copilot/_file',
                    '/dmg_copilot/_api',
                    '/dmg_copilot/api',
                    '/dataos_datastash/_file',
                    '/dataos_datastash/_api',
                    '/dataos_datastash/api',
                    '/data_security/_file',
                    '/data_security/_api',
                    '/data_security/api',
                    '/dataintegration/_file',
                    '/dataintegration/_api',
                    '/dataintegration/api',
                    '/dataos-metrics/_file',
                    '/dataos-metrics/_api',
                    '/dataos-metrics/api',
                    '/ontology/_file',
                    '/ontology/_api',
                    '/ontology/api',
                ],
                target: 'http://10.19.29.140:9080',
                ws: true,
                changeOrigin: true,
                pathRewrite: function(path, req) {
                    var replacedPath = path;
                    replacedPath = replacedPath.replaceAll('/__modo', '');
                    return replacedPath;
                },
                onError(err) {
                    console.log('Suppressing WDS proxy upgrade error:', err);
                },
                cookiePathRewrite: {
                    '/': '/'
                }
            }
        ]
    },
    target: 'web',
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.ejs',
            templateParameters: {
                rootPath: '/'
            },
            inject: true,
        }),
        new HotModuleReplacementPlugin(),
        new ReactRefreshWebpackPlugin({
            overlay: false
        })
    ],
    devtool: 'cheap-module-source-map',

    performance: {
        hints: false,
    },
};

module.exports = merge(common, devConfig);
