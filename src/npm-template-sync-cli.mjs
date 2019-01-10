import { Context } from "./context";
import { PreparedContext } from "./prepared-context";
import {
  setPassword,
  getPassword,
  setProperty,
  removeSensibleValues
} from "./util";
import { version, engines } from "../package.json";
import { GithubProvider } from "github-repository-provider";
import { LocalProvider } from "local-repository-provider";
import { AggregationProvider } from "aggregation-repository-provider";
import { satisfies } from "semver";
import program from "caporal";
import Enquirer from "enquirer";
import { readFileSync } from "fs";

Enquirer
process.on("uncaughtException", e => console.error(e));
process.on("unhandledRejection", reason => console.error(reason));

const properties = {};

program
  .description("Keep npm package in sync with its template")
  .version(version)
  .option("--dry", "do not create branch/pull request")
  .option("--debug", "log level debug")
  .option(
    "-k, --keystore <account/service>",
    "keystore",
    /^[\w\-]+\/.*/,
    "arlac77/GitHub for Mac SSH key passphrase — github.com"
  )
  .option("-s, --save", "save keystore")
  .option("-d --define <key=value>", "set provider option", values => {
    if (!Array.isArray(values)) {
      values = [values];
    }

    values.forEach(value => {
      const [k, v] = value.split(/=/);
      setProperty(properties, k, v);
    });
  })
  .option("--list-providers", "list providers with options and exit")
  .option(
    "--list-properties",
    "list all properties (if given of the first repo) and exit"
  )
  .option(
    "-t, --template <identifier>",
    "template repository",
    /^([\w\-]+\/[\w\-]+)|((git|ssh|https?):\/\/.*)$/
  )
  .option("--usage", "track packages using template in package.json")
  .argument("[repos...]", "repos to merge")
  .action(async (args, options, logger) => {
    if (options.save) {
      const response = await Enquirer.prompt({
        type: "password",
        name: "password",
        message: "What is your password?"
      });
      await setPassword(response.password, options);
    }

    const logLevel = options.debug ? "trace" : "info";

    try {
      const pass = await getPassword(options);

      if (pass !== null && pass !== undefined) {
        if (properties.GithubProvider === undefined) {
          properties.GithubProvider = {};
        }
        properties.GithubProvider.authentication.password = pass;
      }

      const providers = [];

      const logOptions = {
        logger: (...args) => {
          console.log(...args);
        },
        logLevel
      };

      [GithubProvider, LocalProvider].forEach(provider => {
        let options = provider.optionsFromEnvironment(process.env);

        //if (options !== undefined || properties[provider.name] !== undefined) {
        options = Object.assign(
          {},
          logOptions,
          properties[provider.name],
          options
        );
        providers.push(new provider(options));
        //}
      });

      if (options.listProviders) {
        logger.info(
          Array.from(
            aggregationProvider.providers.map(
              p => `${p.name}: ${JSON.stringify(removeSensibleValues(p))}`
            )
          ).join("\n")
        );

        return;
      }

      const context = new Context(
        new AggregationProvider(providers, logOptions),
        {
          templateBranchName: options.template,
          dry: options.dry,
          trackUsedByModule: options.usage,
          logger,
          properties
        }
      );

      if (args.repos.length === 0 && options.listProperties) {
        logger.info(
          JSON.stringify(removeSensibleValues(context.properties), undefined, 2)
        );
        return;
      }

      if (args.repos.length === 0 || args.repos[0] === ".") {
        const pkg = JSON.parse(
          readFileSync("package.json", { encoding: "utf-8" })
        );
        args.repos.push(pkg.repository.url);
      }

      for (const repo of args.repos) {
        const pc = new PreparedContext(context, repo);
        pc.logLevel = logLevel;
        await pc.initialize();

        if (options.listProperties) {
          logger.info(
            JSON.stringify(removeSensibleValues(pc.properties), undefined, 2)
          );
          return;
        }

        await pc.execute();
      }
    } catch (err) {
      console.error(err);
      process.exit(-1);
    }
  });

if (!satisfies(process.versions.node, engines.node)) {
  console.error(
    `require node ${engines.node} (running with ${process.versions.node})`
  );
  process.exit(-1);
}

program.parse(process.argv);
