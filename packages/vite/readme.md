# @alexaegis/vite

Opinionated vite config for different scenarios

## Features

- Split automatic entrypoints from files directly in `src/`
- Automatically copy and fill out `package.json`

## A note about using a vite package to build itself

During the `prebuild` step where the vite package builds itself to create the
local plugin/configuration, it can't consume other local packages for 2 reason:
One, they are not built yet, since the thing that would build them is not built.
And two: even if you try to import a non-buildable internal package vite would
try to process them as ESModules with `esbuild` and you'll get an `esbuild`
error saying `.ts` is an unknown file extension.

So the solution is to only use remote packages from `node_modules` to create
your shared `vite` configuration.
