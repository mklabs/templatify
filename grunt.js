config.init({

  watch: {
    files: ['assets/js/**'],
    tasks: 'default'
  },

  // package js assets for web content for happy people
  browserify: {
    'assets/js/app.browser.js': ['assets/js/application.js']
  },

  templatify: {
    dir: './pages',
    files: ['**/*.html']
  }
});

task.registerTask('default', 'browserify');

