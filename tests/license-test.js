import test from 'ava';
import { Context } from '../src/context';
import { PreparedContext } from '../src/prepared-context';
import { License } from '../src/license';
import { MockProvider } from 'mock-repository-provider';

test('modify one year', async t => {
  const provider = new MockProvider({
    templateRepo: {
      master: { aFile: 'Copyright (c) {{date.year}} by {{owner}}' }
    },
    targetRepo: { master: { aFile: 'Copyright (c) 1999 by xyz' } }
  });

  const context = await PreparedContext.from(
    new Context(provider, {
      templateBranchName: 'templateRepo',
      properties: {
        date: { year: 2099 },
        license: { owner: 'xyz' }
      }
    }),
    'targetRepo'
  );

  const license = new License('aFile');
  const merged = await license.merge(context);
  t.deepEqual(merged.messages, ['chore(license): add current year 2099']);
  t.deepEqual(merged.content, 'Copyright (c) 1999,2099 by xyz');
});

test('modify year list', async t => {
  const provider = new MockProvider({
    templateRepo: {
      master: { aFile: 'Copyright (c) {{date.year}} by {{owner}}' }
    },
    targetRepo: {
      master: { aFile: 'Copyright (c) 2001,1999,2000,2001,2007 by xyz' }
    }
  });

  const context = await PreparedContext.from(
    new Context(provider, {
      templateBranchName: 'templateRepo',
      properties: {
        date: { year: 2099 },
        license: { owner: 'xyz' }
      }
    }),
    'targetRepo'
  );

  const license = new License('aFile');
  const merged = await license.merge(context);
  t.deepEqual(merged.messages, ['chore(license): add current year 2099']);
  t.deepEqual(merged.content, 'Copyright (c) 1999,2000,2001,2007,2099 by xyz');
});

test('license empty target', async t => {
  const provider = new MockProvider({
    templateRepo: {
      master: { aFile: 'Copyright (c) {{date.year}} by {{license.owner}}' }
    },
    targetRepo: {
      master: {}
    }
  });

  const context = await PreparedContext.from(
    new Context(provider, {
      templateBranchName: 'templateRepo',
      properties: {
        date: { year: 2099 },
        license: { owner: 'xyz' }
      }
    }),
    'targetRepo'
  );

  const license = new License('aFile');
  const merged = await license.merge(context);
  t.deepEqual(merged.messages, ['chore(license): add LICENSE']);
  t.deepEqual(merged.content, 'Copyright (c) 2099 by xyz');
});
