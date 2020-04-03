/**
 * all used dev modules
 * @param mergers
 * @param {Branch} branch
 * @return {Set<string>}
 */
export async function usedDevDependencies(mergers, branch) {
  const all = [];

  for (const [merger, pattern] of mergers) {
    for await (const entry of branch.entries(pattern)) {
      all.push(await merger.usedDevDependencies(entry));
    }
  }

  return oneSet(all);
}

export async function optionalDevDependencies(mergers, dependencies) {
  const all = [];

  for (const [merger] of mergers) {
    all.push(await merger.optionalDevDependencies(dependencies));
  }

  return oneSet(all);
}

function oneSet(all)
{
  const combined = new Set();
  all.forEach(element => element.forEach(e => combined.add(e)));
  return combined;

  //return all.reduce((sum, current) => new Set([...sum, ...current]), new Set());
}