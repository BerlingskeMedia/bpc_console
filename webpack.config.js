var path = require('path');

module.exports = {
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
  plugins: [],
  watch: false,
  watchOptions: {
    poll: (process.env.SITE_ENVIRONMENT == 'docker') ? true : false // for Dockerized local development environment files sync
  }
};
