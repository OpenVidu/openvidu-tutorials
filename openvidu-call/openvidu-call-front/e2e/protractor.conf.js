// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 30000,
  specs: ['./src/**/*.e2e-spec.ts'],

  multiCapabilities: [
    {
      browserName: 'chrome',
      chromeOptions: {
        args: ['use-fake-ui-for-media-stream', 'use-fake-device-for-media-stream'],
      },
      acceptInsecureCerts : true
    },
    // {
    //   browserName: 'firefox',
    //   'moz:firefoxOptions': {
    //     'prefs': {
    //       'media.navigator.streams.fake': true,
    //       'media.navigator.permission.disabled': true
    //     }
    //   },
    //   acceptInsecureCerts : true
    // }
  ],
  restartBrowserBetweenTests: true,
  directConnect: !process.env.SELENIUM_URL,
  seleniumAddress: process.env.SELENIUM_URL,
  baseUrl: (process.env.APP_URL || 'http://localhost:4200/'),
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {},
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json'),
    }
  );
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  },
};
