import { PreparedContext } from './prepared-context';

export { PreparedContext };

/**
 * @param {RepositoryProvider} provider
 * @param {Object} options
 *
 * @property {RepositoryProvider} provider
 * @property {Object} options
 * @property {string} options.templateBranchName
 */
export class Context {
  static get defaultMapping() {
    return [
      { merger: 'Package', pattern: '**/package.json' },
      { merger: 'Travis', pattern: '.travis.yml' },
      { merger: 'Readme', pattern: '**/README.*' },
      { merger: 'JSDoc', pattern: '**/jsdoc.json' },
      { merger: 'Rollup', pattern: '**/rollup.config.js' },
      { merger: 'License', pattern: 'LICENSE' },
      {
        merger: 'MergeAndRemoveLineSet',
        pattern: '.gitignore',
        options: { message: 'chore(git): update {{name}} from template' }
      },
      {
        merger: 'NpmIgnore',
        pattern: '.npmignore',
        options: { message: 'chore(npm): update {{name}} from template' }
      },
      { merger: 'ReplaceIfEmpty', pattern: '**/*' }
    ];
  }

  constructor(provider, options) {
    options = Object.assign(
      {},
      {
        logger: console,
        dry: false,
        trackUsedByModule: false
      },
      options
    );

    options.properties = Object.assign(
      {
        date: { year: new Date().getFullYear() },
        license: {}
      },
      options.properties
    );

    Object.defineProperties(this, {
      trackUsedByModule: {
        value: options.trackUsedByModule
      },
      dry: {
        value: options.dry
      },
      logger: {
        value: options.logger
      },
      provider: {
        value: provider
      },
      properties: {
        value: options.properties
      },
      templateBranchName: {
        value: options.templateBranchName
      }
    });
  }

  get defaultMapping() {
    return this.constructor.defaultMapping;
  }

  debug(...args) {
    this.logger.debug(...args);
  }

  warn(...args) {
    this.logger.warn(...args);
  }

  info(...args) {
    this.logger.info(...args);
  }

  error(...args) {
    this.logger.error(...args);
  }
}
