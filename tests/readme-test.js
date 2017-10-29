import test from 'ava';
import Context from '../src/context';
import Readme from '../src/readme';
import Package from '../src/package';
import { MockProvider } from './repository-mock';

test('readme', async t => {
  const provider = new MockProvider({
    aFile: {
      templateRepo: ``,
      targetRepo: `[![Badge 1](http://domain.net/somewhere1.svg)](http://domain.net/somewhere1)

[![Badge 1](http://domain.net/somewhere1.svg)](http://domain.net/somewhere1)
[![Badge 2](http://domain.net/somewhere2.svg)](http://domain.net/somewhere2)

body
body`
    },
    'package.json': {
      templateRepo: JSON.stringify({
        template: {
          badges: [
            {
              name: 'Badge 1',
              icon: 'http://domain.net/somewhere1.svg',
              url: 'http://domain.net/somewhere1'
            }
          ]
        }
      }),
      targetRepo: '{}'
    }
  });

  const context = new Context(
    await provider.repository('targetRepo'),
    await provider.repository('templateRepo'),
    {}
  );

  context.addFile(new Package('package.json'));

  const readme = new Readme('aFile');
  const merged = await readme.merge(context);

  t.deepEqual(
    merged.content,
    `[![Badge 1](http://domain.net/somewhere1.svg)](http://domain.net/somewhere1)


body
body`
  );
});
