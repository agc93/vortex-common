import { IExtensionContext, ThunkStore, IExtensionApi, IInstruction, IState, IMod, IGame, IProfile } from "vortex-api/lib/types/api";
import { fs, selectors, util } from "vortex-api";
import path = require("path");

export function isActiveGame(api: IExtensionApi, gameId: string): boolean;
export function isActiveGame(context: IExtensionContext, gameId: string): boolean;
export function isActiveGame(store: ThunkStore<any>, gameId: string): boolean;
export function isActiveGame(context : IExtensionContext | IExtensionApi | ThunkStore<any>, gameId: string) : boolean {
    return selectors.activeGameId(
        (context as any).api 
            ? (context as IExtensionContext).api.store.getState()
            : (context as any).store
                ? (context as IExtensionApi).store.getState()
                : (context as ThunkStore<any>)) === gameId;
}

export function toAttributeInstructions(attributes: { [key: string]: any }) : IInstruction[] {
    return Object.keys(attributes).map((key: string) => {
        return {
            type: "attribute",
            key: key,
            value: attributes[key]
        } as IInstruction
    });
}

/* export function getModName(destinationPath: string) : string {
    var modName = path.basename(destinationPath).split('.').slice(0, -1).join('.');
    return modName;
} */

export function getCategoryName(category: string, state: IState) : string | undefined {
    if (!category) {
        return undefined;
    }
    var gameId = selectors.activeGameId(state);
    return util.getSafe(state.persistent, ['categories', gameId, category, 'name'], undefined);
}

export function getModName(destinationPath: string): string;
export function getModName(mod: IMod, nameFallback?: string): string;
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

export function getGamePath(game: IGame, state?: IState, preferExecutablePath?: boolean): string {
    const discovery = state && state.settings.gameMode.discovered[game.id];
    if (discovery !== undefined) {
        var execPath = typeof game.executable === 'string' ? game.executable : game.executable();
        return preferExecutablePath ? path.dirname(path.join(discovery.path, execPath)) : discovery.path;
    } else {
        return undefined;
    }
}

export function isGameProfile(api: IExtensionApi, profileId: string, gameId: string): boolean;
export function isGameProfile(context: IExtensionContext, profileId: string, gameId: string): boolean;
export function isGameProfile(store: ThunkStore<any>, profileId: string, gameId: string): boolean;
export function isGameProfile(state: IState, profileId: string, gameId: string): boolean;
export function isGameProfile(context: IExtensionContext | IExtensionApi | ThunkStore<any> | IState, profileId: string, gameId: string): boolean {
    var state: IState = (context as any).api
        ? (context as IExtensionContext).api.store.getState()
        : (context as any).store
            ? (context as IExtensionApi).store.getState()
            : (context as ThunkStore<any>);
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