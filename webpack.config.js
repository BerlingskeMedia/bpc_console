var path = require('path');
var webpack = require('webpack');

module.exports = {
  target: 'web',
  mode: 'production',
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
        use: ['babel-loader']
      },
    ]
  },
  plugins: [],
  watch: false,
  watchOptions: {
    poll: (process.env.SITE_ENVIRONMENT == 'docker') ? true : false // for Dockerized local development environment files sync
  }
};
