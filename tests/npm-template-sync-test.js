import test from 'ava';
import { npmTemplateSync } from '../src/npm-template-sync';
import { GithubProvider } from 'github-repository-provider';

const ora = require('ora');

const REPOSITORY_NAME = 'arlac77/sync-test-repository';
const TEMPLATE_REPO = 'Kronos-Tools/npm-package-template';

/*
test('npmTemplateSync files', async t => {
  const provider = new GithubProvider(process.env.GH_TOKEN);
  const branch = await provider.branch(TEMPLATE_REPO);

  const files = await createFiles(branch);

  t.is(files.find(f => f.path === 'package.json').path, 'package.json');
  t.is(files.find(f => f.path === 'package.json').constructor.name, 'Package');
});
*/

test('npmTemplateSync', async t => {
  const spinner = ora('args');
  const provider = new GithubProvider({ auth: process.env.GH_TOKEN });

  const pullRequest = await npmTemplateSync(
    provider,
    await provider.branch(REPOSITORY_NAME),
    await provider.branch(TEMPLATE_REPO),
    {
      spinner,
      console
    }
  );

  //console.log(pullRequest.name);
  t.truthy(pullRequest.name);

  //await pullRequest.delete();

  //t.pass('worker done');
});
