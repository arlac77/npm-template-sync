import { npmTemplateSync } from './npm-template-sync';
import { setPassword, getPassword } from './util';
import { version } from '../package.json';
import { GithubProvider } from 'github-repository-provider';
import { BitbucketProvider } from 'bitbucket-repository-provider';
import { LocalProvider } from 'local-repository-provider';
import { AggregationProvider } from 'aggregation-repository-provider';
import { directory } from 'tempy';

const program = require('caporal'),
  prompt = require('prompt'),
  ora = require('ora'),
  PQueue = require('p-queue');

const spinner = ora('args');

process.on('uncaughtException', err => spinner.fail(err));
process.on('unhandledRejection', reason => spinner.fail(reason));

program
  .description('Keep npm package in sync with its template')
  .version(version)
  .option('--dry', 'do not create branch/pull request', program.BOOL)
  .option(
    '-k, --keystore <account/service>',
    'keystore',
    /^[\w\-]+\/.*/,
    'arlac77/GitHub for Mac SSH key passphrase — github.com'
  )
  .option('-s, --save', 'save keystore')
  .option(
    '-t, --template <identifier>',
    'template repository',
    /^([\w\-]+\/[\w\-]+)|((git|ssh|https?):\/\/.*)$/
  )
  .option(
    '--concurrency <number>',
    'number of concurrent repository request',
    program.INT,
    1
  )
  .argument('[repos...]', 'repos to merge')
  .action(async (args, options, logger) => {
    spinner.start();

    if (options.save) {
      prompt.start();
      const schema = {
        properties: {
          password: {
            required: true,
            hidden: true
          }
        }
      };
      prompt.get(schema, async (err, result) => {
        if (err) {
          spinner.fail(err);
          return;
        }

        try {
          await setPassword(result.password, options);
        } catch (e) {
          spinner.fail(err);
          return;
        }
        spinner.succeed('password set');
      });
    }

    try {
      const pass = await getPassword(options);
      const queue = new PQueue({ concurrency: options.concurrency });
      const provider = new AggregationProvider();

      [BitbucketProvider, GithubProvider].forEach(p => {
        let options = p.optionsFromEnvironment(process.env);

        if (p === GithubProvider && pass !== undefined) {
          options = Object.assign(
            {
              auth: pass
            },
            options
          );
        }

        if (options !== undefined) {
          logger.debug(`add ${p.name} with options ${Object.keys(options)}`);
          provider.providers.push(new p(options));
        }
      });

      provider.providers.push(new LocalProvider({ workspace: directory() }));

      logger.debug(
        `providers: ${Array.from(provider.providers.map(p => p.name)).join(
          ' '
        )}`
      );

      const templateBranch = options.template
        ? await provider.branch(options.template)
        : undefined;

      await queue.addAll(
        args.repos.map(repo => {
          return async () =>
            npmTemplateSync(
              provider,
              await provider.branch(repo),
              templateBranch,
              spinner,
              logger,
              options.dry
            );
        })
      );
    } catch (err) {
      spinner.fail(err);
    }
  });

program.parse(process.argv);
