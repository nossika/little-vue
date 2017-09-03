const path = require('path');
const config = {
    entry: {
        main: path.resolve(__dirname, '../src/index.js')
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'little-vue.js'
    },
    module: {
        rules: [
            {
                test: /\.js/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    "presets": ["es2015", "stage-0"],
                    "plugins": ["transform-runtime", "transform-decorators-legacy"]
                }
            }
        ]
    },
    resolve: {
        alias: {
            'util': path.resolve(__dirname, '../src/util')
        }
    }
};

module.exports = config;