[![npm](https://img.shields.io/npm/v/npm-template-sync.svg)](https://www.npmjs.com/package/npm-template-sync)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/npm-template-sync)](https://bundlephobia.com/result?p=npm-template-sync)
[![downloads](http://img.shields.io/npm/dm/npm-template-sync.svg?style=flat-square)](https://npmjs.org/package/npm-template-sync)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## npm-template-sync

Keep repository in sync with its template.

Generates pull requests to bring a repository back in sync with its template.

So by making changes to the template and applying npm-template-sync the target project will be updated accoring to the template.

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

npm-template-sync --template aTemplateGithubUser/aRepo myGithubUser/myRepo
```

define (initial) properties to be used in the template

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

npm-template-sync --define "description=a very new fantastic module" -t myUser/myTemplate myUser/newModule#aBranch
```

create new repository and bind it to aTemplateGithubUser/aRepo

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

npm-template-sync --track --create --template aTemplateGithubUser/aRepo myGithubUser/myRepo
```

switch from [arlac77/template-github](https://github.com/arlac77/template-github) to [arlac77/template-arlac77-github](https://github.com/arlac77/template-arlac77-github) template for [arlac77/url-cmd](https://github.com/arlac77/url-cmd), [arlac77/uti](https://github.com/arlac77/uti), [arlac77/content-entry](https://github.com/arlac77/content-entry) and [arlac77/repository-provider](https://github.com/arlac77/repository-provider)

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

npm-template-sync --track --template arlac77/template-arlac77-github --template -arlac77/template-github arlac77/url-cmd arlac77/uti arlac77/content-entry arlac77/repository-provider
```

Merges contents from template branch into destination branch handling some special cases for:

-   Licenses - rewriting license years
-   line set files like .npmignore and .gitignore - by merging both sets together
-   package.json - merge (.\*)[Dd]ependencies, engines and scripts
-   rollup.conf.\*js - copy / rewrite + detect dev dependencies
-   [\*.yaml - merge](doc/yaml/README.md)
-   [.travis.yml - merge with hints](doc/travis/README.md)
-   [\*.toml - merge](doc/toml/README.md)
-   [\*.ini - merge](doc/ini/README.md)
-   [\*.json - merge](doc/json/README.md)
-   README.md - merge badges

![generated pull request](doc/pr_sample.png)

## Some templates

-   [arlac77/template-cli-app](https://github.com/arlac77/template-cli-app) _rollup_ _ava_ _travis_
-   [arlac77/template-esm-only](https://github.com/arlac77/template-esm-only) _ava_ _travis_
-   [arlac77/template-svelte-component](https://github.com/arlac77/template-svelte-component) _svelte_ _rollup_ _testcafe_ _travis_
-   [arlac77/template-svelte-app](https://github.com/arlac77/template-svelte-app) _svelte_ _rollup_ _pkgbuild_ _travis_
-   [arlac77/template-kronos-component](https://github.com/arlac77/template-kronos-component) template-esm-only with node 14
-   [arlac77/template-kronos-app](https://github.com/arlac77/template-kronos-app) node 14 + systemd

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Context](#context)
    -   [Parameters](#parameters)
    -   [Properties](#properties)
    -   [execute](#execute)
    -   [commits](#commits)
    -   [executeBranch](#executebranch)
-   [sortedKeys](#sortedkeys)
-   [Package](#package)
    -   [properties](#properties-1)
        -   [Parameters](#parameters-1)
-   [Merger](#merger)
    -   [properties](#properties-2)
        -   [Parameters](#parameters-2)
    -   [commits](#commits-1)
        -   [Parameters](#parameters-3)
-   [Merger](#merger-1)
    -   [Properties](#properties-3)
    -   [properties](#properties-4)
        -   [Parameters](#parameters-4)
    -   [commits](#commits-2)
        -   [Parameters](#parameters-5)
-   [EntryMerger](#entrymerger)
    -   [Properties](#properties-5)
-   [Template](#template)
    -   [Parameters](#parameters-6)
    -   [Properties](#properties-6)
    -   [entryMerger](#entrymerger-1)
        -   [Parameters](#parameters-7)
    -   [mergerFor](#mergerfor)
        -   [Parameters](#parameters-8)
    -   [\_templateFrom](#_templatefrom)
        -   [Parameters](#parameters-9)
    -   [updateUsedBy](#updateusedby)
        -   [Parameters](#parameters-10)
    -   [templateFor](#templatefor)
        -   [Parameters](#parameters-11)
-   [ReplaceIfEmpty](#replaceifempty)
-   [Readme](#readme)
-   [MergeLineSet](#mergelineset)
-   [Replace](#replace)
-   [Skip](#skip)
-   [Delete](#delete)
-   [normalizeTemplateSources](#normalizetemplatesources)
    -   [Parameters](#parameters-12)
-   [jspath](#jspath)
    -   [Parameters](#parameters-13)

## Context

**Extends LogLevelMixin(class \_Context {})**

Context prepared to execute one branch

### Parameters

-   `provider`  
-   `targetBranchName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options`   (optional, default `{}`)

### Properties

-   `ctx` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `files` **[Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>** 

### execute

Generate Pull Requests

Returns **AsyncIterator&lt;PullRequest>** 

### commits

Generate all commits from the template entry merges.

Returns **Commit&lt;AsyncIterator>** 

### executeBranch

Generate Pull Requests

Returns **AsyncIterator&lt;PullRequest>** 

## sortedKeys

order in which json keys are written

## Package

**Extends Merger**

Merger for package.json

### properties

Deliver some key properties

#### Parameters

-   `entry` **ContentEntry** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## Merger

Mergable content

### properties

Deliver some key properties.

#### Parameters

-   `entry` **ContentEntry** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** extracted properties

### commits

Generate commits as result of merging two entries.

#### Parameters

-   `context`  
-   `destinationEntry`  
-   `sourceEntry`  
-   `options`  

## Merger

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

### Properties

-   `type` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `pattern` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `factory` **Class** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### properties

Deliver some key properties.

#### Parameters

-   `entry` **ContentEntry** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** extracted properties

### commits

Generate commits as result of merging two entries.

#### Parameters

-   `context`  
-   `destinationEntry`  
-   `sourceEntry`  
-   `options`  

## EntryMerger

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

### Properties

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `factory` **Class** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## Template

**Extends LogLevelMixin(class {})**

### Parameters

-   `context` **Conext** 
-   `sources` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

### Properties

-   `context` **Conext** 
-   `sources` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 
-   `toBeRemovedSources` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 
-   `mergers` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Merger](#merger)>** 
-   `branches` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;Branch>** all used branches direct and inherited
-   `keyBranches` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;Branch>** branches used to define the template

### entryMerger

Find a suitable merger for each entry

#### Parameters

-   `entries` **Iterator&lt;ContentEntry>** 

Returns **Iterator&lt;\[ContentEntry, [Merger](#merger)]>** 

### mergerFor

Find a suitable merger

#### Parameters

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** of the entry

Returns **[Merger](#merger)** 

### \_templateFrom

Load all templates and collects the entries.

#### Parameters

-   `sources` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** branch names
-   `inheritencePath` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;Branch>** who was requesting us (optional, default `[]`)

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** package as merged from sources

### updateUsedBy

Updates usedBy section of the template branch.

#### Parameters

-   `targetBranch` **Branch** template to be updated
-   `templateSources` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** original branch identifiers (even with deletion hints)
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** as passed to commitIntoPullRequest

Returns **AsyncIterator&lt;PullRequest>** 

### templateFor

Load a template

#### Parameters

-   `context` **[Context](#context)** 
-   `sources` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## ReplaceIfEmpty

**Extends Merger**

Overwrites none existing entries from template

## Readme

**Extends Merger**

injects badges into README.md

## MergeLineSet

**Extends Merger**

## Replace

**Extends Merger**

Replace file from template (always)

## Skip

**Extends Merger**

Does not generate destination entry

## Delete

**Extends Merger**

Delete entry.

## normalizeTemplateSources

Remove duplicate sources.
Sources staring with '-' will be removed

### Parameters

-   `sources` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 
-   `remove` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**  (optional, default `[]`)

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** normalized sources

## jspath

### Parameters

-   `object`  
-   `path`  
-   `cb`  

# install

With [npm](http://npmjs.org) do:

```shell
npm install -g npm-template-sync

# npm-template-sync --help
```

# license

BSD-2-Clause
