const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const { webpack, DefinePlugin } = require('webpack');

const { merge } = require('webpack-merge');
const common = require('./webpack.base');
const DefaultSetting = require('./setting');

const paths = require('./paths');
const { argv } = require('yargs');
const isDev = argv.mode === 'development';
const APP_NAME = require('../package.json').name;

module.exports = {
    mode: 'production',
    entry: {
        // index: ['./src/pages/test/index.tsx'],
        index: ['./src/inter.tsx']
    },
    output: {
        path: common.output.path + '/_resource_/',
        publicPath: `/${APP_NAME}/_file/ext/${APP_NAME}/dist/_resource_/`,
        filename: 'js/[name].min.js?hash=[hash]',
        chunkFilename: 'chunks/[name].min.js?hash=[hash]',
        cssFilename: 'css/[name].min.css?hash=[hash]',
        libraryTarget: 'umd',
        library: `${APP_NAME}-plugin`,
        globalObject: 'this',
    },
    externals: {
        'react': {
            root: 'React',
            commonjs2: 'react',
            commonjs: 'react',
            amd: 'react',
        },
        'react-dom': {
            root: 'ReactDOM',
            commonjs2: 'react-dom',
            commonjs: 'react-dom',
            amd: 'react-dom'
        },
        'react-router': {
            root: 'ReactRouter',
            commonjs2: 'react-router',
            commonjs: 'react-router',
            amd: 'react-router',
        },
        'react-router-dom': {
            root: 'ReactRouterDom',
            commonjs2: 'react-router-dom',
            commonjs: 'react-router-dom',
            amd: 'react-router-dom',
        },
        'redux': {
            root: 'Redux',
            commonjs2: 'redux',
            commonjs: 'redux',
            amd: 'redux'
        },
        'react-redux': {
            root: 'ReactRedux',
            commonjs2: 'react-redux',
            commonjs: 'react-redux',
            amd: 'react-redux'
        },
        'prop-types': {
            root: 'PropTypes',
            commonjs: 'prop-types',
            commonjs2: 'prop-types',
            amd: 'prop-types',
        },
        '@arco-design': {
            root: '@arcoDesign',
            commonjs: '@arco-design',
            commonjs2: '@arco-design',
            amd: '@arco-design',
        },
        deployFront: 'deployFront',
        appLoading: 'appLoading',
        global: 'window'
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
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true,
                },
            }),
        ],
        /*splitChunks: {
            chunks: 'all',
            minSize: 600000,
            maxSize: 1200000,
            minChunks: 1,
            maxAsyncRequests: 12,
            maxInitialRequests: 12,
            cacheGroups: {
                vendor: {
                    //name: 'vendor',
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        const { context } = module;
                        const matches = context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                        const packageName = matches && matches.length > 2 ? matches[1] : 'other';
                        return `${packageName.replace('@', '')}`;
                    },
                    priority: 10
                }
            }
        }*/
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].min.css?hash=[hash]',
            chunkFilename: 'chunks/[name].min.css?hash=[hash]',
            ignoreOrder: false
        }),
        new DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(argv.mode),
                npm_config_context_path: JSON.stringify(process.env.npm_config_context_path || ''),
                APP_NAME: JSON.stringify(require('../package.json').name)
            },
        })
    ]
};
