const baseConfig = require('./webpack.base.config');
const webpack = require('webpack');

baseConfig.output.library = 'Vue';
baseConfig.output.libraryTarget = 'umd';

module.exports = Object.assign(baseConfig, {
    devtool: '#source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ]
});