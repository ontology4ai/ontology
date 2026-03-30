const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MonacoLocalesPlugin = require('monaco-editor-locales-plugin');

const paths = require('./paths');
const { argv } = require('yargs');
const { webpack, DefinePlugin } = require('webpack');
const path = require('path');
const isDev = argv.mode === 'development';

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: paths.build,
        filename: '[name].[contenthash].js',
        publicPath: '',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: 'babel-loader',
                exclude: /node_modules\/(?!modo-plugin-common)/,
            },
            {
                test: /\.css$/,
                use: [isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.less$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'scoped-css-loader'
                    },
                    {
                        loader: 'less-loader',
                        options: {},
                    },
                ],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: '@svgr/webpack',
                        options: {
                            // limit: 10 * 1024,
                            noquotes: true,
                            // name: 'fonts/[name].[ext]?hash=[hash]'
                        },
                    },
                    {
                        loader: 'file-loader',
                        options: {
                            // limit: 10 * 1024,
                            // name: 'fonts/[name].[ext]?hash=[hash]'
                        }
                    }
                ],
            },
            {
                test: /\.(jpg|png|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            esModule: false,
                            limit: 5 * 1024,
                            name: 'images/[name].[ext]?hash=[hash]'
                        },
                    },
                ],
            },
            {
                test: /\.html$/,
                use: 'html-loader',
            },
            {
                test: /\.js$/,
                exclude: /((node_modules\/(?!((sql-formatter\/lib)|(devlop\/lib))))|tape-mx-designer|public|mxClient|mxGraph|mxGraphEditor)/,
                include: [
                    path.resolve('node_modules/sql-formatter/lib'),
                    path.resolve('node_modules/devlop/lib'),
                    path.resolve('src/components/Editor/modules/sql-formatter/lib')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        cacheDirectory: true
                    },

                }
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.jsx'],
        alias: {
            '@': paths.src,
            packages: paths.packages,
            static: paths.static,
            'monaco-editor': path.resolve(__dirname, '../node_modules/monaco-editor-zh'),
            '@dtinsight/molecule': path.resolve(__dirname, '../molecule'),
            '@arco-design/web-react-origin': path.resolve(__dirname, '../node_modules/@arco-design/web-react'),
            '@arco-design/web-react/icon': path.resolve(__dirname, '../node_modules/@arco-design/web-react/icon'),
            '@arco-design/web-react/dist': path.resolve(__dirname, '../node_modules/@arco-design/web-react/dist'),
            '@arco-design/web-react/lib': path.resolve(__dirname, '../node_modules/@arco-design/web-react/lib'),
            '@arco-design/web-react/es': path.resolve(__dirname, '../node_modules/@arco-design/web-react/es'),
            '@arco-design/web-react/node_modules': path.resolve(__dirname, '../node_modules/@arco-design/web-react/node_modules'),
            '@arco-design/web-react': path.resolve(__dirname, '../src/arco')
        },
    },
    externals: {
        deployFront: 'deployFront',
        appLoading: 'appLoading',
        global: 'window'
    },
    plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(argv.mode),
                npm_config_context_path: JSON.stringify(process.env.npm_config_context_path || ''),
                APP_NAME: JSON.stringify(require('../package.json').name)
            },
        }),
        new MonacoWebpackPlugin([ 'javascript','typescript','css','html','json', 'sql'])
    ],
};
