import { IExtensionContext, ThunkStore, IExtensionApi, IInstruction } from "vortex-api/lib/types/api";
import { selectors } from "vortex-api";

export function isActiveGame(api: IExtensionApi, gameId: string): boolean;
export function isActiveGame(context: IExtensionContext, gameId: string): boolean;
export function isActiveGame(store: ThunkStore<any>, gameId: string): boolean;
export function isActiveGame(context : IExtensionContext | IExtensionApi | ThunkStore<any>, gameId: string) : boolean {
    return selectors.activeGameId(
        (context as IExtensionContext) 
            ? (context as IExtensionContext).api.store.getState()
            : (context as IExtensionApi)
                ? (context as IExtensionApi).store.getState()
                : (context as ThunkStore<any>)) === gameId;
}

export function toInstructions(attributes: { [key: string]: any }) : IInstruction[] {
    return Object.keys(attributes).map((key: string) => {
        return {
            type: "attribute",
            key: key,
            value: attributes[key]
        } as IInstruction
    });
}