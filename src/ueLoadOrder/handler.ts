import { ILoadOrderGameInfo, IValidationResult, LoadOrder } from "vortex-api/lib/extensions/file_based_loadorder/types/types";
import { IExtensionApi, IMod } from "vortex-api/lib/types/api";
import {deserialize, serialize, validate} from './serialization';
import { LoadOrderFilter } from "./types";
import { toLOPrefix } from "./util";


export class LoadOrderHelper {
    private _api: IExtensionApi;
    private _gameId: string;
    private _filter: LoadOrderFilter;
    /**
     *
     */
    constructor(api: IExtensionApi, gameId: string) {
        this._api = api
        this._gameId = gameId;
    }

    withFilter = (filter: LoadOrderFilter): LoadOrderHelper => {
        this._filter = filter;
        return this;
    }

    serialize: (loadOrder: LoadOrder) => Promise<void> = async (lo) => serialize(this._api, this._gameId, lo);

    deserialize: () => Promise<LoadOrder> = () => deserialize(this._api, this._gameId, undefined, this._filter);

    validate:  (prev: LoadOrder, curr: LoadOrder) => Promise<IValidationResult> = (prev, curr) => {
        return validate(prev, curr);
    }

    createPrefix: (mod: IMod) => string = (mod) => {
        return toLOPrefix(this._api, mod)
    }
}

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