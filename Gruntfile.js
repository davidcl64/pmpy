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
    
    mocha_istanbul: {
      cover: {
        src: ['test/test.js'],
        options: {
          mask: '*.js',
          timeout: '15000',
          ui: 'bdd',
          reporter: 'spec'
        }
      },
      coveralls: {
        src: 'test',
        options: {
          coverage: true
        }
      }
    },

    clean: {
      cover: {
        src: [ 'coverage' ]
      },
      build: {
        src: [ 'dist', 'coverage' ]
      },
      all: {
        src: [ 'dist', 'coverage', 'node_modules/' ]
      }
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
  
  grunt.registerTask('travisInit', function() {
    var done = this.async();
    var pg = require('./dist/lib/playground');
    console.log("PMPY_TARGET: %s", process.env.PMPY_TARGET);
    pg.awaitLeader(done);
  });

  grunt.registerTask('cover', [
    'clean:cover',
    'mocha_istanbul:cover'
  ]);
  
  grunt.registerTask('default', ['jshint', 'startPlayground', 'mochacli']);
  grunt.registerTask('travis', ['jshint', 'travisInit', 'mochacli']);
  grunt.registerTask('build', ['babel','chmod']);
};
