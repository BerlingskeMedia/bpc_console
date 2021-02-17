const path = require('path');
const webpack = require('webpack');

const bundle = {
  target: 'web',
  mode: process.env.WEBPACK_MODE || 'production', // 'development' || 'production'
  entry: {
    main: './client/src/main.js'
  },
  output: {
    path: path.resolve(__dirname, 'client/build'),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: path.resolve(__dirname, 'client/src'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ]
          }
        }
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV || ''),
        'BPP_URL': JSON.stringify(process.env.BPP_URL || ''),
        'BPC_URL': JSON.stringify(process.env.BPC_URL || ''),
        'PM_URL': JSON.stringify(process.env.PM_URL || ''),
      }
    }),
  ],
  watch: false,
  watchOptions: {
    poll: (process.env.SITE_ENVIRONMENT == 'docker') ? true : false // for Dockerized local development environment files sync
  }
};

module.exports = [bundle];
