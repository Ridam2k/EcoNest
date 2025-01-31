import { atomWithStorage } from "jotai/utils";

export const userAuthAtom = atomWithStorage("userAuth", { token: null, userId: null });
