import test from 'ava';
import Context from '../src/context';
import Travis from '../src/travis';
import { MockProvider } from 'mock-repository-provider';

async function mockYmlVersions(templateVersions, targetVersions) {
  const provider = new MockProvider({
    aFile: {
      templateRepo: `node_js:
${templateVersions
        .map(
          v => `  - ${v}
`
        )
        .join('')}
`,
      targetRepo: `node_js:
${targetVersions
        .map(
          v => `  - ${v}
`
        )
        .join('')}
`
    }
  });

  const context = new Context(
    await provider.repository('targetRepo'),
    await provider.repository('templateRepo'),
    {}
  );

  const merger = new Travis('aFile');
  return merger.merge(context);
}

test('travis node versions merge', async t => {
  const merged = await mockYmlVersions(['8.9.3', '9'], ['8.9.3']);

  t.deepEqual(
    merged.content,
    `node_js:
  - 8.9.3
  - 9
`
  );
});

test('travis node versions none numeric', async t => {
  const merged = await mockYmlVersions(['7.7.2', '-iojs'], ['7.7.1', 'iojs']);

  t.deepEqual(
    merged.content,
    `node_js:
  - 7.7.2
`
  );
});

test('travis node versions simple', async t => {
  const merged = await mockYmlVersions(['7.7.2'], ['7.7.1']);

  t.deepEqual(
    merged.content,
    `node_js:
  - 7.7.1
  - 7.7.2
`
  );
});

test('travis node versions complex', async t => {
  const merged = await mockYmlVersions(['7.7.2'], ['6.10.1', '7.7.1']);

  t.deepEqual(
    merged.content,
    `node_js:
  - 6.10.1
  - 7.7.1
  - 7.7.2
`
  );
});

test('travis node semver mayor only', async t => {
  const merged = await mockYmlVersions(['7.7.2'], ['5', '6.2']);

  t.deepEqual(
    merged.content,
    `node_js:
  - 5
  - 6.2
  - 7.7.2
`
  );
});

test.only('travis node semver remove', async t => {
  const merged = await mockYmlVersions(
    ['-4', '-5', '-7', '7.7.2'],
    ['4.2', '4.2.3', '5.1', '7.7.0', '7.7.1', '9.3']
  );
  console.log(merged.content);

  t.deepEqual(
    merged.content,
    `node_js:
  - 7.7.2
  - 9.3
`
  );
});

test('travis remove before_script', async t => {
  const provider = new MockProvider({
    aFile: {
      templateRepo: `before_script:
  - npm prune
  - -npm install -g codecov
`,
      targetRepo: `before_script:
  - npm prune
  - npm install -g codecov
`
    }
  });
  const context = new Context(
    await provider.repository('targetRepo'),
    await provider.repository('templateRepo'),
    {}
  );

  const merger = new Travis('aFile');
  const merged = await merger.merge(context);
  t.deepEqual(
    merged.content,
    `before_script:
  - npm prune
`
  );
});

test('start fresh', async t => {
  const provider = new MockProvider({
    aFile: {
      templateRepo: `node_js:
  - 7.7.2
before_script:
  - npm prune
  - -npm install -g codecov
`,
      targetRepo: ''
    }
  });

  const context = new Context(
    await provider.repository('targetRepo'),
    await provider.repository('templateRepo'),
    {}
  );

  const merger = new Travis('aFile');
  const merged = await merger.merge(context);

  t.deepEqual(
    merged.content,
    `node_js:
  - 7.7.2
before_script:
  - npm prune
`
  );
});
