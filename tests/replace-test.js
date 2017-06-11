import test from 'ava';
import Context from '../src/Context';
import Replace from '../src/Replace';
import Client from './Client';

test('replace', async t => {
  const context = new Context(new Client({
    aFile: {
      templateRepo: `Line 1x
        Line 2x`,
      targetRepo: `Line 1
        Line 2`
    }
  }), 'targetRepo', 'templateRepo', {});

  const replace = new Replace(context, 'aFile');
  const merged = await replace.merge;
  t.deepEqual(merged.content, `Line 1x
        Line 2x`);
});
