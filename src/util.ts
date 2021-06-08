import { IExtensionContext, ThunkStore, IExtensionApi, IInstruction, IState, IMod, IGame, IProfile } from "vortex-api/lib/types/api";
import { fs, selectors, util } from "vortex-api";
import path = require("path");

/**
 * Checks whether a given game is the currently managed game.
 * 
 * @param api The extension API object.
 * @param gameId The game ID to check.
 */
export function isActiveGame(api: IExtensionApi, gameId: string): boolean;
export function isActiveGame(context: IExtensionContext, gameId: string): boolean;
export function isActiveGame(store: ThunkStore<any>, gameId: string): boolean;
export function isActiveGame(context : IExtensionContext | IExtensionApi | ThunkStore<any>, gameId: string) : boolean {
    return selectors.activeGameId(getState(context)) === gameId;
}

/**
 * Convenience function to convert an object of attributes (i.e. `{"attributeName": "value"}`) into install instructions.
 * 
 * @param attributes Dictionary of mod attributes to map.
 * @returns Set of install instructions to set the required attributes.
 */
export function toAttributeInstructions(attributes: { [key: string]: any }) : IInstruction[] {
    return Object.keys(attributes).map((key: string) => {
        return {
            type: "attribute",
            key: key,
            value: attributes[key]
        } as IInstruction
    });
}

/**
 * Returns the actual name of a category with a given ID (such as from a mod's attributes).
 * 
 * @param category The category ID/attribute.
 * @param state Application state.
 * @returns The name of the given category, or undefined if not found.
 */
export function getCategoryName(category: string, state: IState) : string | undefined {
    if (!category) {
        return undefined;
    }
    var gameId = selectors.activeGameId(state);
    return util.getSafe(state.persistent, ['categories', gameId, category, 'name'], undefined);
}

/**
 * Gets a user-friendly name for a given mod object, or installation path.
 * @param mod The mod object to retrieve the name of.
 * @param destinationPath The destiantion path from an installer function.
 */
export function getModName(mod: IMod, nameFallback?: string): string;
/**
 * Gets the mod name from an installation path.
 * @param destinationPath The destination path from an installer function
 */
export function getModName(destinationPath: string): string;
export function getModName(modOrPath: IMod|string, nameFallback?: string): string {
    if (typeof modOrPath == "string") {
        var modName = path.basename(modOrPath).split('.').slice(0, -1).join('.');
        return modName;
    } else {
        var mod: IMod = modOrPath;
        return util.getSafe(mod.attributes, ['customFileName'], util.getSafe(mod.attributes, ['logicalFileName'], util.getSafe(mod.attributes, ['modName'], util.getSafe(mod.attributes, ['name'], undefined)))) ?? nameFallback;
    }
}

/**
 * Returns the mod type for the given mod (name if available, otherwise id)
 * 
 * @param mod The mod
 * @returns The mod type's name if available, otherwise the mod type's ID, otherwise 'default'.
 */
export function getModType(mod: IMod): string {
    var modType = util.getModType(mod.type);
    return toTitleCase(modType?.options?.name ?? modType?.typeId ?? 'default');
}

export function mergeStateArray<T>(state: IState, statePath: string[], payload: T[]) {
    var existing = util.getSafe<T[]>(state, [...statePath], []);
    var mergedHashes = [...new Set(existing.concat(payload))]
    return util.merge(state, [...statePath], mergedHashes);
}

/**
 * Title cases the given string
 * 
 * @param str The input string
 * @internal
 */
function toTitleCase(str: string) {
    return str.replace(
        /\w\S*/g,
        function(txt: string) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

/**
 * Returns the current installation path for a given game.
 * 
 * @remarks This returns the actual game installation folder, not the staging folder.
 * @param game The game object to retrieve the path for.
 * @param state The app state
 * @param preferExecutablePath Whether to prefer the path to the game executable, or just the game directory.
 * @returns The requested game (or executable) path if available, or undefined.
 */
export function getGamePath(game: IGame, state?: IState, preferExecutablePath?: boolean): string {
    const discovery = state && state.settings.gameMode.discovered[game.id];
    if (discovery !== undefined) {
        var execPath = typeof game.executable === 'string' ? game.executable : game.executable();
        return preferExecutablePath ? path.dirname(path.join(discovery.path, execPath)) : discovery.path;
    } else {
        return undefined;
    }
}

/**
 * Returns the current discoverd location for a given game.
 * 
 * @remarks This returns the actual game installation folder, not the staging folder.
 * @param game The game ID to retrieve the path for.
 * @param state The app state
 * @param extraRelPath An additional *relative* path to append to the discovered path.
 * @returns The requested game (or executable) path if available, or undefined.
 */
export function getDiscoveryPath(gameId: string, state: IState, extraRelPath?: string): string {
    const discovery = state && state.settings.gameMode.discovered[gameId];
    if (discovery !== undefined) {
        return path.join(discovery.path, extraRelPath || '');
    } else {
        return undefined;
    }
}

/**
 * Checks if the given profile is a profile for the given game ID.
 * @param api The extension API.
 * @param profileId The ID of the profile to check.
 * @param gameId The game ID to check against.
 */
export function isGameProfile(api: IExtensionApi, profileId: string, gameId: string): boolean;
export function isGameProfile(store: ThunkStore<any>, profileId: string, gameId: string): boolean;
export function isGameProfile(state: IState, profileId: string, gameId: string): boolean;
export function isGameProfile(context: IExtensionContext | IExtensionApi | ThunkStore<any> | IState, profileId: string, gameId: string): boolean {
    var state: IState = getState(context);
    var profile: IProfile = selectors.profileById(state, profileId);
    return profile.gameId == gameId;
}

export function loadLanguageContent(api: IExtensionApi, ns: string, language?: string, fileName?: string) {
    language ||= 'en';
    fileName ||= 'language.json';
    try {
        var langContent = fs.readFileSync(path.join(__dirname, fileName), {encoding: 'utf-8'});
        api.getI18n().addResources(language, ns, JSON.parse(langContent));
    } catch {  }
}

/**
 * Checks if the given mod ID corresponds to a Nexus Mods-sourced mod.
 * 
 * @param api The extension API.
 * @param modId The mod ID.
 * @returns 'true' if the mod is a Nexus-sourced mod, otherwise false.
 */
export function isNexusMod(api: IExtensionApi, modId: string): boolean {
    const state: IState = api.store.getState();
    const gameMode = selectors.activeGameId(state);

    let modSource = util.getSafe(state.persistent.mods,
                            [gameMode, modId, 'attributes', 'source'],
                            undefined);
    if (modSource === undefined) {
      modSource = util.getSafe(state.persistent.downloads,
                          ['files', modId, 'modInfo', 'source'],
                          undefined);
    }

    return modSource === 'nexus';
}

/**
 * Checks whether a given game ID has been managed with Vortex regardless of any mods being installed for it.
 * 
 * @param api The extension API.
 * @param gameId The game ID.
 * @returns Whether the given game is managed.
 */
export function isGameManaged(api: IExtensionApi, gameId: string): boolean {
    var profiles: {[profileId: string]: IProfile} = {};
    profiles = util.getSafe(api.getState().persistent, ['profiles'], {});
    const gameProfiles: string[] = Object.keys(profiles)
      .filter((id: string) => profiles[id].gameId === gameId);
    return gameProfiles && gameProfiles.length > 0;
}


function getState(obj: IExtensionContext | IExtensionApi | IState | ThunkStore<any>): IState {
    var state: IState = (obj as any).api
        ? (obj as IExtensionContext).api.store.getState()
        : (obj as any).store
            ? (obj as IExtensionApi).store.getState()
            : (obj as ThunkStore<any>);
    return state;
}