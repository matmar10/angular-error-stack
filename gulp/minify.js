const gulp = require('gulp');
const minify = require('gulp-minify');

gulp.task('minify', function() {
  gulp.src('dist/*.js')
    .pipe(minify({
      ignoreFiles: ['.min.js']
    }))
    .pipe(gulp.dest('./dist/'))
});