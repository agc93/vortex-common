import { ILoadOrderGameInfo, IValidationResult, LoadOrder } from "vortex-api/lib/extensions/file_based_loadorder/types/types";
import { IExtensionApi, IMod } from "vortex-api/lib/types/api";
import {deserialize, serialize, validate} from './serialization';
import { LoadOrderFilter } from "./types";
import { toLOPrefix } from "./util";

/**
 * Helper class to simplify setting up UE4 games with Vortex's FBLO API.
 * 
 * @remarks The FBLO API is only available in Vortex 1.4+
 * @remarks This helper is in preview state and may not be 100% stable.
 */
export class LoadOrderHelper {
    private _api: IExtensionApi;
    private _gameId: string;
    private _filter: LoadOrderFilter;
    /**
     * Creates a new instance of the helper for the specified game.
     * 
     * @example `var lo = new LoadOrderHelper(context.api, GAME_ID);`
     * 
     * @param api The extension API.
     * @param gameId The game to manage load order for.
     */
    constructor(api: IExtensionApi, gameId: string) {
        this._api = api
        this._gameId = gameId;
    }

    /**
     * Adds a simple predicate to help control load order deserialization.
     * 
     * @param filter Filter predicate.
     * @returns The helper itself (for method chaining).
     */
    withFilter = (filter: LoadOrderFilter): LoadOrderHelper => {
        this._filter = filter;
        return this;
    }

    /**
     * The serialize function used when serializing the load order to disk.
     * 
     * @example How to register the serialize function
     * ```typescript
     *context.registerLoadOrder({
     *  ...
     *  serializeLoadOrder: lo.serialize,
     *  ...
     *  });
     *```
     * @returns The serialization function.
     */
    serialize: (loadOrder: LoadOrder) => Promise<void> = async (lo) => serialize(this._api, this._gameId, lo);

    /**
     * The deserialize function used when loading the load order from disk into app state.
     * 
     * * @example Registering the deserialize function
     * ```typescript
     *context.registerLoadOrder({
     *  ...
     *  deserializeLoadOrder: lo.deserialize,
     *  ...
     *  });
     *```
     * @returns The deserialization function.
     */
    deserialize: () => Promise<LoadOrder> = () => deserialize(this._api, this._gameId, undefined, this._filter);

    /**
     * The validation function used when validating the "correctness" of the load order before/after serialization.
     * 
     * @returns The validation function
     */
    validate:  (prev: LoadOrder, curr: LoadOrder) => Promise<IValidationResult> = (prev, curr) => {
        return validate(prev, curr);
    }

    /**
     * A simple function that will return a prefix path for merging that enforces the current load order.
     * 
     * @example Registering the function
     * ```typescript
     * mergeMods: lo.createPrefix,
     * ```
     * @param mod The mod to prefix.
     * @returns The string prefix for merging.
     */
    createPrefix: (mod: IMod) => string = (mod) => {
        return toLOPrefix(this._api, mod)
    }
}

/**
 * A simple wrapper function that can create a complete `ILoadOrderGameInfo` object ready for registration with `IExtensionContext.registerLoadOrder`
 * 
 * @experimental
 * @remarks The returned helper will use all the default behaviours where relevant.
 * @param api The extension API.
 * @param gameId The game to manage the order for.
 * @param instructions Optional instructions for the user.
 * @returns A complete `ILoadOrderGameInfo` object.
 */
export function getLoadOrderInfo(api: IExtensionApi, gameId: string, instructions?: string): ILoadOrderGameInfo {
    var helper = new LoadOrderHelper(api, gameId);
    return {
        toggleableEntries: false,
        gameId,
        serializeLoadOrder: helper.serialize,
        deserializeLoadOrder: helper.deserialize,
        validate: helper.validate,
        usageInstructions: instructions
    };
}