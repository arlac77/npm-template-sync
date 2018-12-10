[![npm](https://img.shields.io/npm/v/npm-template-sync.svg)](https://www.npmjs.com/package/npm-template-sync)
[![Greenkeeper](https://badges.greenkeeper.io/arlac77/npm-template-sync.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/arlac77/npm-template-sync)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://secure.travis-ci.org/arlac77/npm-template-sync.png)](http://travis-ci.org/arlac77/npm-template-sync)
[![codecov.io](http://codecov.io/github/arlac77/npm-template-sync/coverage.svg?branch=master)](http://codecov.io/github/arlac77/npm-template-sync?branch=master)
[![Coverage Status](https://coveralls.io/repos/arlac77/npm-template-sync/badge.svg)](https://coveralls.io/r/arlac77/npm-template-sync)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/npm-template-sync/badge.svg)](https://snyk.io/test/github/arlac77/npm-template-sync)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/npm-template-sync.svg?style=flat-square)](https://github.com/arlac77/npm-template-sync/issues)
[![Stories in Ready](https://badge.waffle.io/arlac77/npm-template-sync.svg?label=ready&title=Ready)](http://waffle.io/arlac77/npm-template-sync)
[![Dependency Status](https://david-dm.org/arlac77/npm-template-sync.svg)](https://david-dm.org/arlac77/npm-template-sync)
[![devDependency Status](https://david-dm.org/arlac77/npm-template-sync/dev-status.svg)](https://david-dm.org/arlac77/npm-template-sync#info=devDependencies)
[![docs](http://inch-ci.org/github/arlac77/npm-template-sync.svg?branch=master)](http://inch-ci.org/github/arlac77/npm-template-sync)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![downloads](http://img.shields.io/npm/dm/npm-template-sync.svg?style=flat-square)](https://npmjs.org/package/npm-template-sync)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## npm-template-sync

Keep npm package in sync with its template

```shell
npm-template-sync --template aTemplateGithubUser/aRepo myGithubUser/myRepo
```

define (initial) properties to be used in the template

```shell
npm-template-sync --define "description=a very new fantastic module" -t myUser/myTemplate myUser/newModule
```

merges contents from template repo into destination repo handling some special cases for:

-   Licenses - rewriting license years
-   line set files like .npmignore and .gitignore - by merging both sets together
-   package.json - merge devDependencies, engines and scripts
-   rollup.conf.js - copy / rewrite

![generated pull request](doc/pr_sample.png)

## Some templates

-   [list by _npm-package-template_ keyword](https://www.npmjs.com/browse/keyword/npm-package-template)
-   [arlac77 npm-package-template](https://github.com/arlac77/npm-package-template) _rollup_ _ava_
-   [Kronos-Tools npm-package-template](https://github.com/Kronos-Tools/npm-package-template) _mocha_
-   [Kronos-Tools npm-package-template-minimal](https://github.com/Kronos-Tools/npm-package-template-minimal)

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Context](#context)
    -   [Parameters](#parameters)
    -   [Properties](#properties)
-   [PreparedContext](#preparedcontext)
    -   [Parameters](#parameters-1)
    -   [Properties](#properties-1)
-   [Readme](#readme)
-   [sortedKeys](#sortedkeys)
-   [Package](#package)
    -   [properties](#properties-2)
        -   [Parameters](#parameters-2)
-   [defaultMerge](#defaultmerge)
    -   [Parameters](#parameters-3)
-   [normalizePackage](#normalizepackage)
    -   [Parameters](#parameters-4)
-   [File](#file)
    -   [Parameters](#parameters-5)
    -   [Properties](#properties-3)
    -   [properties](#properties-4)
        -   [Parameters](#parameters-6)
    -   [merge](#merge)
        -   [Parameters](#parameters-7)
-   [templateOptions](#templateoptions)
    -   [Parameters](#parameters-8)
-   [compareVersion](#compareversion)
    -   [Parameters](#parameters-9)
-   [MergeAndRemoveLineSet](#mergeandremovelineset)
-   [MergeLineSet](#mergelineset)
    -   [defaultIgnoreSet](#defaultignoreset)
-   [NpmIgnore](#npmignore)
    -   [defaultIgnoreSet](#defaultignoreset-1)
-   [ReplaceIfEmpty](#replaceifempty)
-   [Replace](#replace)

## Context

### Parameters

-   `provider` **RepositoryProvider** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### Properties

-   `provider` **RepositoryProvider** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `options.templateBranchName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## PreparedContext

context prepared to execute one package

### Parameters

-   `context` **[Context](#context)** 
-   `targetBranchName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### Properties

-   `ctx` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `files` **[Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>** 

## Readme

**Extends File**

injects badges into README.md

## sortedKeys

order in which json keys are written

## Package

**Extends File**

Merger for package.json

### properties

Deliver some key properties

#### Parameters

-   `branch` **Branch** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## defaultMerge

### Parameters

-   `destination`  
-   `target`  
-   `template`  
-   `dp`  
-   `name`  
-   `messages`  

## normalizePackage

bring package into nomalized (sorted) form

### Parameters

-   `source` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** normalized source

## File

Mergable File

### Parameters

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** location in the repository
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** mergin options (optional, default `{}`)

### Properties

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### properties

Deliver some key properties

#### Parameters

-   `branch` **Branch** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### merge

#### Parameters

-   `context` **PreparedContect** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** merged content

## templateOptions

find merger options in the template section of a package.json

### Parameters

-   `json` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## compareVersion

compare two versions

### Parameters

-   `a` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** 
-   `b` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** 

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** \-1 if a &lt; b, 0 if a == b and 1 if a > b

## MergeAndRemoveLineSet

**Extends MergeLineSet**

## MergeLineSet

**Extends File**

File where every line is a key

### defaultIgnoreSet

entries to be skipped from result

Returns **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

## NpmIgnore

**Extends MergeAndRemoveLineSet**

### defaultIgnoreSet

-   **See: <https://docs.npmjs.com/misc/developers>**

entries to be skipped from result

Returns **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

## ReplaceIfEmpty

**Extends File**

Overwrites none existing file from template

## Replace

**Extends File**

Replace file from template (always)

# install

With [npm](http://npmjs.org) do:

```shell
npm install -g npm-template-sync

# npm-template-sync --help
```

# license

BSD-2-Clause
