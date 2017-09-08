const gulp = require('gulp');
const concat = require('gulp-concat');

gulp.task('concat', function() {
  return gulp.src('./src/*.js')
    .pipe(concat('angular-error-stack.js'))
    .pipe(gulp.dest('./dist/'));
});