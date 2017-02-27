var path = require('path');
var webpack = require('webpack');

module.exports = {
  target: 'web',
  // entry: path.join(__dirname, 'admin/app/main.js'),
  entry: {
    // "server/build": path.join(__dirname, 'server/app/main.js'),
    'server/client/build': path.join(__dirname, 'server/client/app/main.js')
  },
  output: {
    path: path.join(__dirname, '.'),
    filename: "[name]/bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      // { test: /\.json$/, loader: 'json-loader' },
      // { test: path.join(__dirname, 'server/client'), loader: 'babel-loader', query: { presets: ['react', 'es2015'] } },
      { test: path.join(__dirname, 'server/client/app'), loader: 'babel-loader', query: { presets: ['react', 'es2015'] } },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': Object.keys(process.env).reduce(function(o, k) {
        o[k] = JSON.stringify(process.env[k]);
        return o;
      }, {})
    })
  ]
};
