import test from 'ava';
import { Context } from '../src/context';
import Rollup from '../src/rollup';
import Package from '../src/package';

import { MockProvider } from 'mock-repository-provider';

const ROLLUP_FILE_CONTENT = `import babel from 'rollup-plugin-babel';

export default {
  plugins: [],
  input: 'file.js',
  output: {
    format: 'cjs',
    file: 'main.js'
  }
};`;

const PACKAGE_FILE_CONTENT = `{
  "release": {
    "verifyRelease": "cracks"
  }
}`;

test('context used dev modules', async t => {
  const provider = new MockProvider({
    templateRepo: {
      master: {
        'rollup.config.js': ROLLUP_FILE_CONTENT,
        'package.json': PACKAGE_FILE_CONTENT
      }
    },
    targetRepo: {
      master: {
        'rollup.config.js': ROLLUP_FILE_CONTENT,
        'package.json': PACKAGE_FILE_CONTENT
      }
    }
  });

  const context = new Context(
    await provider.branch('targetRepo'),
    await provider.branch('templateRepo')
  );

  context.addFile(new Rollup('rollup.config.js'));
  context.addFile(new Package('package.json'));

  t.deepEqual(
    await context.usedDevModules(),
    new Set(['rollup-plugin-babel', 'cracks'])
  );
});

test('context optional dev modules', async t => {
  const provider = new MockProvider({
    templateRepo: { master: { 'rollup.config.js': ROLLUP_FILE_CONTENT } },
    targetRepo: {
      master: {
        'rollup.config.js': ROLLUP_FILE_CONTENT
      }
    }
  });

  const context = new Context(
    await provider.branch('targetRepo'),
    await provider.branch('templateRepo')
  );

  context.addFile(new Rollup('rollup.config.js'));

  t.deepEqual(
    context.optionalDevModules(new Set(['rollup-plugin-babel'])),
    new Set(['rollup-plugin-babel'])
  );
});
