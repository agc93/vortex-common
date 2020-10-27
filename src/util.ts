import { IExtensionContext, ThunkStore, IExtensionApi, IInstruction, IState, IMod } from "vortex-api/lib/types/api";
import { selectors, util } from "vortex-api";
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