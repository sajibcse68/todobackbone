/* eslint-disable func-names */

/* REQUIRES */
const gulp = require('gulp');

// Helper libraries
const _ = require('lodash');
const del = require('del');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');

// Linting
const eslint = require('gulp-eslint');
const sassLint = require('gulp-sass-lint');

// Browser sync
const browserSync = require('browser-sync').create();

// File I/O
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
// const replace = require('gulp-replace');
const htmlreplace = require('gulp-html-replace');

// Browserify
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const babelify = require('babelify');
const watchify = require('watchify');
const streamify = require('gulp-streamify');
const browserify = require('browserify');
const aliasify = require('aliasify');
const sourcemaps = require('gulp-sourcemaps');
const nunjucks = require('gulp-nunjucks');
const concat = require('gulp-concat');

/* FILE PATHS */
const paths = {
  html: {
    files: ['index.html'],
    srcDir: '.',
    destDir: 'dist'
  },

  js: {
    files: ['js/**/*.js'],
    srcDir: 'js',
    destDir: 'dist/js'
  },

  templates: {
    files: ['templates/**/*.html'],
    srcDir: 'templates',
    destDir: 'dist/templates'
  },

  scss: {
    files: ['scss/**/*.scss'],
    srcDir: 'scss',
    destDir: 'dist/css'
  },

  images: {
    files: ['images/**/*'],
    srcDir: 'images',
    destDir: 'dist/images'
  },

  fonts: {
    files: ['fonts/**/*'],
    srcDir: 'fonts',
    destDir: 'dist/fonts'
  }
};


/* TASKS */
/* Lints the CSS files */
gulp.task('lint:css', function() {
  gulp.src(paths.scss.files)
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

/* Compiles SCSS files into CSS files and copies them to the distribution directory */
gulp.task('scss', function() {
  return gulp.src(paths.scss.files)
    .pipe(sass({
      'outputStyle': 'compressed',
      'errLogToConsole': true
    }))
    .pipe(gulp.dest(paths.scss.destDir));
});

/* Development css task */
gulp.task('css:dev', function() {
  runSequence('lint:css', 'scss');
});

/* Production css task */
gulp.task('css:prod', function(done) {
  runSequence('lint:css', 'scss', function(error) {
    done(error && error.err);
  });
});

/* Copies files to the distribution directory */
['images', 'fonts'].forEach(function(fileType) {
  gulp.task(fileType, function() {
    return gulp.src(paths[fileType].files)
      .pipe(gulp.dest(paths[fileType].destDir));
  });
});


/* Deletes the distribution directory */
gulp.task('clean', function() {
  return del('dist');
});

/* Copies the HTML file to the distribution directory (dev) */
gulp.task('html:dev', function() {
  return gulp.src(paths.html.files)
    .pipe(htmlreplace({
      'js': '/js/build.js'
    }))
    .pipe(gulp.dest(paths.html.destDir));
});


/* Copies the HTML file to the distribution directory (prod) */
gulp.task('html:prod', function() {
  return gulp.src(paths.html.files)
    .pipe(htmlreplace({
      'js': '/js/build.min.js'
    }))
    // .pipe(replace(/href="\//g, 'href="/zippo/'))
    // .pipe(replace(/src="\//g, 'src="/zippo/'))
    .pipe(gulp.dest(paths.html.destDir));
});

gulp.task('templates', function () {
  return gulp.src(paths.templates.files)
    .pipe(nunjucks())
    .pipe(concat('templates.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(paths.templates.destDir));
});

/* Lints the JS files */
gulp.task('lint:js', function() {
  return gulp.src(paths.js.files)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


/* Helper which bundles the JS files and copies the bundle into the distribution file (dev) */
function bundle(b) {
  return b
    .bundle()
    .pipe(source('build.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .on('error', function(error) {
      gutil.log(gutil.colors.red('Error bundling distribution files:'), error.message);
    })
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.js.destDir));
}


/* Browserifies the JS files and copies the bundle into the distribution file (dev) */
gulp.task('js:dev', function() {
  const b = browserify({
    plugin: [watchify],
    cache: {},
    debug: true,
    fullPaths: true,
    packageCache: {}
  })
  .transform(aliasify, {
    aliases: {
      'underscore': 'lodash'
    },
    verbose: true,
    global: true
  })
  .add('js/app.js')
  .transform(babelify, {
    presets: ['es2015']
  });

  // Re-bundle the distribution file every time a source JS file changes
  b.on('update', function() {
    gutil.log('Re-bundling distribution files');
    bundle(b);
  });

  // Log a message and reload the browser once the bundling is complete
  b.on('log', function(message) {
    gutil.log('Distribution files re-bundled:', message);
    runSequence('lint:js', 'reload');
  });

  return bundle(b);
});


/* Browserifies the JS files and copies the bundle into the distribution file (prod) */
gulp.task('js:prod', function(done) {
  runSequence('lint:js', 'copy:js', 'browserify:js', function(error) {
    done(error && error.err);
  });
});


/* Replaces image and link absolute paths with the correct production path */
gulp.task('copy:js', function() {
  return gulp.src(paths.js.files)
    // .pipe(replace(/href=\'\//g, 'href=\'/zippo/'))
    // .pipe(replace(/src=\'\//g, 'src=\'/zippo/'))
    .pipe(gulp.dest(paths.js.destDir));
});

/* Removes all script files in the distribution directory except the Browserify bundle */
gulp.task('removeTempScriptFiles', function() {
  return del('dist/js/!(*.min.js)');
});

/* Browserifies the JS files into a single bundle file */
gulp.task('browserify:js', function() {
  return browserify()
    .transform(aliasify, {
      aliases: {
        'underscore': 'lodash'
      },
      verbose: true,
      global: true
    })
    .transform(babelify, {
      presets: ['es2015']
    })
    .add('dist/js/app.js')
    .bundle()
    .on('error', function(error) {
      gutil.log(gutil.colors.red('Error bundling distribution files:'), error.message);
      process.exit(1);
    })
    .pipe(source('build.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(paths.js.destDir));
});

/* Watches for file changes (JS file changes are watched elsewhere via watchify) */
gulp.task('watch', function() {
  const fileTypesToWatch = {
    scss: 'css:dev',
    html: 'html:dev',
    fonts: 'fonts',
    images: 'images',
    templates: 'templates'
  };

  _.forEach(fileTypesToWatch, function(taskToRun, fileType) {
    gulp.watch(paths[fileType].files, function() {
      runSequence(taskToRun, 'reload');
    });
  });
});


/* Reloads the browser */
gulp.task('reload', function() {
  browserSync.reload();
});


/* Static server which rewrites all non static file requests back to index.html */
gulp.task('serve', function() {
  browserSync.init({
    port: 14500,
    open: false,
    server: {
      baseDir: 'dist/'
      // middleware: [
      // Middleware which redirects unknown paths to index.html so that router can handle them
      //  require('./server/rewriteToIndex.js')
      // ]
    }
  });
});


/* Builds the distribution directory */
gulp.task('build:dev', ['html:dev', 'templates', 'js:dev', 'css:dev', 'images', 'fonts']);
gulp.task('build:prod', ['html:prod', 'templates', 'js:prod', 'css:prod', 'images', 'fonts']);


/* Production deployment task */
gulp.task('prod', function(done) {
  runSequence('clean', 'build:prod', function(error) {
    done(error && error.err);
  });
});


/* Default task for local development */
gulp.task('default', function(done) {
  runSequence('clean', 'build:dev', 'watch', 'serve', function(error) {
    done(error && error.err);
  });
});
