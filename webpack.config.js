var path = require('path');
var webpack = require('webpack');

module.exports = {
  target: 'web',
  // entry: path.join(__dirname, 'admin/src/main.js'),
  entry: {
    // "build": path.join(__dirname, 'src/main.js'),
    'client/build': path.join(__dirname, 'client/src/main.js')
  },
  output: {
    path: path.join(__dirname, '.'),
    filename: "[name]/bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      // { test: /\.json$/, loader: 'json-loader' },
      // { test: path.join(__dirname, 'client'), loader: 'babel-loader', query: { presets: ['react', 'es2015'] } },
      { test: path.join(__dirname, 'client/src'), loader: 'babel-loader', query: { presets: ['react', 'es2015'] } },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': Object.keys(process.env).reduce(function(o, k) {
        o[k] = JSON.stringify(process.env[k]);
        return o;
      }, {})
    })
  ],
  watch: false,
  watchOptions: {
    poll: (process.env.SITE_ENVIRONMENT == 'docker') ? true : false // for Dockerized local development environment files sync
  }
};
