# Vortex Extension Helper Library

This library serves as a basic set of common building blocks/patterns for use in building Vortex game extensions.

## Usage

Install the library into your project with `npm install --save-dev vortex-ext-common`, then import the components you want to use.

Please note that we **strongly** recommend using TypeScript for Vortex extensions in general, and especially with this library. Support will only be given for TypeScript usage scenarios.

### All Games

The library provides many components for any game to use, but we strongly recommend relying on the tsdoc since that will be updated in line with any API changes. You can find more detailed docs at [agc93.github.io/vortex-common/](https://agc93.github.io/vortex-common/).

> The docs are not fully complete, but we will be updating the missing components with proper tsdoc in the next couple of patches.

#### Basic Utility Objects

The library includes a handful of basic utility functions to cut down on boilerplate in extensions and simplify some of the more arcane Vortex APIs. Check [the docs](https://agc93.github.io/vortex-common/modules/index.html) for full details.

### Unreal Engine Games

Specifically for Unreal Engine games, we provide some common building blocks that are **usually** common to most Unreal Engine-based games (i.e. using `.pak` files).

> Be *very* sure that the UE game you're building for is just using the usual "`.pak` files in '~mods'" pattern

#### `UnrealGameHelper`

This is the basic helper class for building your game extension. Instantiate it with your game's game ID, then you can use its members to simplify your extension's registration code:

```ts
let unreal = new UnrealGameHelper(GAME_ID);
let relModPath = path.join('Game', 'Content', 'Paks', '~mods');
context.registerGame({
    ...
    setup: (discovery) => unreal.prepareForModding(discovery, relModPath);
    ...
});
context.registerInstaller(
    'my-awesome-installer',
    50,
    unreal.testSupportedContent,
    unreal.installContent
);
```

#### `LoadOrderHelper`

A simple helper class to encapsulate common operations when using the new Vortex 1.4+ FBLO API with UE4 games. As always, [check the docs](https://agc93.github.io/vortex-common/modules/ueloadorder.html) for full details.

#### `AdvancedInstaller`

An experimental new installer that includes interactive file choice during installation and a highly extensible and configurable design to make game-specific functionality easier to integrate. Check [the docs](https://agc93.github.io/vortex-common/modules/install_advanced.html) for more details.

## Changelog

- 0.0.1: Initial release
- 0.0.2: *BREAKING* - Refactor UE helper to fix scoping issues
- 0.0.4: Refactor ProfileClient to fix scoping issues
- 0.0.5: *BREAKING* - Renamed `toInstructions` to `toAttributeInstructions`. Fixes for inconsistent installer logic. (thanks Picky!)
- 0.0.6: Fix bug in `isActiveGame` so overloads should work again
- 0.0.8: Add `getCategoryName` and rework `getModName` to support `IMod` attributes.
- 0.0.9: Add `getModType`, add `mergeStateArray` and rework `getModName` ordering
- ~~0.0.10: Add **experimental** install helper functions and root finder. Fix missing `getModType` export.~~
- 0.0.11: Re-publishing of 0.0.10 to fix import paths
- 0.0.14: Add DetailOverlay component, isGameProfile function and export some missing util functions.
- 0.1.0: Adds new classes for a generic UE4 multi-file installer, 
  - Adds new `AdvancedInstaller`/`AdvancedInstallerBuilder` for a generic UE4 multi-file installer
  - Adds new typed `EventHandler` for easier event registration (experimental and incomplete)
  - Adds new shared `LoadingSpinner` component
- 0.1.1: Fixes some bugs in v0.1.0
  - Supported checks didn't work properly: they would always return true rather than using the returned result's `supported` value.
  - Supported checks can now add files to `requiredFiles` and they will be aggregated in the final supported result
- 0.1.2: Fix more bugs in v0.1.0/v0.1.1
  - Event handler didn't work properly for some events, added new events
  - Added new handler for migrations to simplify boilerplate
  - Updated some other parts of the API, and export some missing types
- 0.2.0: Add some new features and fix up a few things
  - Add some new handlers and types for working with the FBLO API
  - Update to newer vortex-api
  - Update some other dependencies and clean up a few types
- 0.2.1: Fix some bugs in v0.2.0
  - Add missing error object to Promise rejections in UE4 installer
- 0.2.2: Fix some minor bugs in v0.2.1
  - This also adds the first batch of missing tsdoc comments. More doc will be added soon.
- 0.3.0: Minor update
  - This release is a breaking change as some of the advanced installer's extension points have been made async.
  - More parts of the API are likely to move towards async in future releases.
- 0.3.1: Minor bugfix
  - This release fixes a minor bug that affected the first setup of the load order file.
- 0.3.2: Minor API tweak
  - Correctly handle undefined game IDs in migration handler.
- 0.3.3: Minor fixes
  - Load order filters will now be properly applied on deserialization
  - Improve notifications for migrations helpers