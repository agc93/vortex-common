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
- `getModName`: useful for custom installers, this function will return the original mod name from the installer `destinationPath` parameter.

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