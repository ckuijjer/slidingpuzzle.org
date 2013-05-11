/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        // src: ['lib/fastclick.js', 'lib/quantize.js', 'lib/color-tunes.js', 'lib/instagram.js', 'lib/slidingpuzzle.js'],
        src: ['lib/fastclick.js', 'lib/instagram.js', 'lib/slidingpuzzle.js'],
        dest: 'dist/app.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: 'dist/app.js',
        dest: 'dist/app.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true,
          $: true,
          console: true,
          self: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/color-tunes.js', 'lib/instagram.js', 'lib/slidingpuzzle.js', 'test/**/*.js']
      }
    },
    less: {
      all: {
        options: {
          paths: ['dist']
        },
        files: {
          "dist/style.css": "style.less"
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        // tasks: ['jshint:lib_test', 'qunit']
        tasks: ['jshint', 'concat', 'uglify']
      },
      less: {
        files: ['*.less'],
        tasks: ['less:all']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');

  // Default task.
  // grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
