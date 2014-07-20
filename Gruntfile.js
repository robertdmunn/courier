'use strict';
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*\n *  <%= pkg.name %> v<%= pkg.version %>\n' +
        '<%= pkg.homepage ? " *  " + pkg.homepage + "\\n" : "" %>' +
        ' *  \n' +
        ' *  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */'
    },
    release: {},
    concat: {
      dist: {
        src: [
          'bower_components/es6-module-loader/dist/es6-module-loader.js',
          'bower_components/systemjs/dist/system.js',
          'src/start.js',
          'src/normalize.js',
          'src/core.js',     	// starts makeCourier
          'src/system-extension-ext.js',
          'src/system-extension-forward-slash.js',
          'src/config.js',
          'src/startup.js',
          'src/make-courier-end.js', // ends makeCourier
          'src/system-format-courier.js',
          'src/end.js'
        ],
        dest: '<%= pkg.name %>.js'
      },
      systemFormat: {
        src: [
          'src/system-format-start.js',
          'src/normalize.js',
          'src/system-format-courier.js',
          'src/system-format-end.js'
        ],
        dest: 'system-format-courier.js'
      },
      nodeMain: {
		src: [
          'src/start.js',
          'src/normalize.js',
          'src/core.js',     	// starts makeCourier
          'src/system-extension-ext.js',
          'src/system-extension-forward-slash.js',
          'src/config.js',
          'src/startup.js',
          'src/make-courier-end.js', // ends makeCourier
          'src/system-format-courier.js',
          'src/end.js'
        ],
        dest: 'main.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>\n',
        compress: {
          drop_console: true
        }
      },
      dist: {
        options: {
          banner: '<%= meta.banner %>\n'
            + '/*\n *  ES6 Promises shim from when.js, Copyright (c) 2010-2014 Brian Cavalier, John Hann, MIT License\n */\n'
        },
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.production.js'
      }
    },
    copy: {
      toTest: {
        files: [
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/courier/', filter: 'isFile'},
          {expand: true, src: ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'dev.js'], dest: 'test/bower_components/courier/', filter: 'isFile'},
          {expand: true, cwd: 'bower_components/traceur/', src: ['*'], dest: 'test/bower_components/traceur/', filter: 'isFile'}
        ]
      }
    },
    watch: {
      files: [ "src/*.js", "bower_components/systemjs/dist/**"],
      tasks: "default"
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: ['src/**/*.js']
    },
    testee: {
      tests: {
        options: {
          browsers: ['firefox'],
          urls: ['test/test.html']
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('testee');

  grunt.registerTask('test', [ 'build', 'testee' ]);
  grunt.registerTask('build', [ /*'jshint', */'concat', 'uglify', 'copy:toTest' ]);
  grunt.registerTask('default', [ 'build' ]);
};
