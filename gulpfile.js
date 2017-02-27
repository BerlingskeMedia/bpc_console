const gulp = require('gulp');
const spawn = require('child_process').spawn;

var server;
var webpack;

gulp.task('default', ['start_console', 'watch', 'webpack_watch']);

gulp.task('start_console', function (){
  if (server) {
    server.kill();
  }
  server = spawn('node', ['./console/index.js'], {stdio: 'inherit'});
});

gulp.task('watch', function(){
  gulp.watch(['./console/*.js'], ['start_console']);
});

gulp.task('webpack_watch', function() {
  if (webpack) {
    webpack.kill();
  }
  webpack = spawn('webpack', ['--watch'], {stdio: 'inherit'});
});
