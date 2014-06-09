/*global module:false*/

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    files: {
      vendor: [
        'src/lib/quantize.js',
        'src/lib/color-tunes.js',
        'bower_components/fastclick/lib/fastclick.js',
        'bower_components/chroma-js/chroma.min.js' 
      ],
      javascript: [
        'src/lib/framework.js', 
        'src/lib/instagram.js', 
        'src/lib/slidingpuzzle.js'
      ],
      less: ['src/style.less']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      release: {
        src: ['src/lib/release.js', '<%= files.vendor %>', '<%= files.javascript %>'],
        dest: 'release/app.js'
      },
      debug: {
        src: ['src/lib/debug.js', '<%= files.vendor %>', '<%= files.javascript %>'],
        dest: 'debug/app.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      release: {
        src: 'release/app.js',
        dest: 'release/app.min.js'
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
          require: true,
          jQuery: true,
          $: true,
          console: true,
          self: true,
          Events: true,
          StateMachine: true,
          InstagramUser: true,
          InstagramPopular: true,
          InstagramLibrary: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: '<%= files.javascript %>'
      }
    },
    less: {
      release: {
        options: {
          paths: ['src']
        },
        files: {
          "release/style.css": "src/style.less"
        },
        cleancss: true
      },
      debug: {
        options: {
          paths: ['src']
        },
        files: {
          "debug/style.css": "src/style.less"
        }
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      },
      debug: {
        options: {
          diff: true,
          map: true
        },
        src: 'debug/style.css'
      }, 
      release: {
        options: {
          map: true
        },
        src: 'release/style.css'
      }
    },
    clean: {
      release: 'release/*',
      debug: 'debug/*'
    },
    copy: {
      release: {
        files: [
          { src: 'src/assisi.jpeg', dest: 'release/assisi.jpeg' },
          { src: 'src/favicon.ico', dest: 'release/favicon.ico' }
        ]
      },
      debug: {
        files: [
          { src: 'src/assisi.jpeg', dest: 'debug/assisi.jpeg' },
          { src: 'src/favicon.ico', dest: 'debug/favicon.ico' },
          { src: 'src/lib/jquery-1.11.1.js', dest: 'debug/jquery-1.11.1.js' }
        ]
      }
    },
    replace: {
      release: {
        files: [ { src: 'src/index.html', dest: 'release/index.html' } ],
        options: {
          patterns: [
            { match: 'app', replacement: 'app.min.js' },
            { match: 'jquery', replacement: '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js' }
          ]
        }
      },
      debug: {
        files: [ { src: 'src/index.html', dest: 'debug/index.html' } ],
        options: {
          patterns: [
            { match: 'app', replacement: 'app.js' },
            { match: 'jquery', replacement: 'jquery-1.11.1.js' }
          ]
        }
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      html: {
        files: 'src/index.html',
        tasks: 'debug',
        options: {
          livereload: true
        }
      },
      lib: {
        files: '<%= files.javascript %>',
        tasks: 'debug',
        options: {
            livereload: true
        }
      },
      less: {
        files: '<%= files.less %>',
        tasks: 'debug',
        options: {
            livereload: true
        }
      }
    },
    connect: {
      server: {
        options: {
          base: 'debug/',
          debug: true,
          hostname: '*',
          port: '9000',
          open: true,
          livereload: true,
          keepalive: true
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('debug', ['clean:debug', 'less:debug', 'autoprefixer:debug', 'jshint', 'concat:debug', 'replace:debug', 'copy:debug']);
  grunt.registerTask('release', ['clean:release', 'less:release', 'autoprefixer:release', 'jshint', 'concat:release', 'uglify:release', 'replace:release', 'copy:release']);
  grunt.registerTask('default', 'debug');
};
