'use strict';
module.exports = function (grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    chmod: {
      options: { mode: '+x' },
      bin:     { src: ['./dist/bin/index.js'] }
    },
    babel : {
      options : {
        sourceMap : false,
        presets: ['es2015']
      },
      dist : {
        files : [{
          expand: true,
          cwd: 'src/',
          src: ['**/*.js'],
          dest: 'dist/',
          ext: ".js"
        }]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: ['Gruntfile.js']
      },
      js: {
        src: ['src/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    mochacli: {
      options: {
        reporter: 'spec',
        grep: grunt.option('grep'),
        bail: true
      },
      all: ['test/*.js']
    },
    watch: {
      playground: {
        options: { atBegin: true },
        files: ['package.json'],
        tasks: ['startPlayground', 'jshint:js', 'jshint:test', 'mochacli']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      js: {
        files: '<%= jshint.js.src %>',
        tasks: ['jshint:js', 'mochacli']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'mochacli']
      }
    }
  });
  
  grunt.registerTask('startPlayground', function() {
    var done = this.async();
    var pg = require('./dist/lib/playground');
    pg.status(function(err) {
      if(err) { return pg.start(done); }

      pg.reset(done);
    });
  });

  grunt.registerTask('default', ['jshint', 'startPlayground', 'mochacli']);
  grunt.registerTask('build', ['babel','chmod']);
};
