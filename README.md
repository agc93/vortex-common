# Vortex Extension Helper Library

This library serves as a basic set of common building blocks/patterns for use in building Vortex game extensions.

## Usage

### All Games

The library provides the following components for any game to use:

#### `ProfileClient`

The `ProfileClient` class serves as a lightweight wrapper over Vortex's profile features system. This class makes it easier to set or retrieve the value of a given profile feature for your game.

> If you are not familiar with how Vortex handles profile features, be *very careful*. This can be a minefield.

You will still need to register profile features using the usual `context.registerProfileFeature` syntax, but you can then easily set/get that feature with a `ProfileClient` instance:

```ts
var client = new ProfileClient(context.api.store);
var feature = client.getProfileSetting('some_profile_feature', 'default value');
client.setProfileSetting('some_profile_feature', 'new value');
```

#### Basic Utility Objects

We also provide a handful of basic utility functions to cut down on boilerplate:

- `toAttributeInstructions`: a simple function to convert a set of mod attributes into the appropriate `IInstruction` objects
- `isActiveGame` (**PREVIEW**): this preview function is intended to simplify guard clauses to only when your game is the active game.
- `getModName`: Multiple overloads for different purposes 
  - `getModName(destinationPath: string)`: useful for custom installers, this function will return the original mod name from the installer `destinationPath` parameter.
  - `getModName(mod: IMod)`: wrapper function to return the first valid name attribute from the usual suspects (`customFileName`>`modName`>`logicalFileName`>`name`)
- `getCategoryName`: returns the actual _name_ of a given category since sometimes the category is just an index.


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