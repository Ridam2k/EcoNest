import { atomWithStorage } from "jotai/utils";

export const userAuthAtom = atomWithStorage("userAuth", { token: null, userId: "8da1ac78-1aac-469f-9e0d-285139ff77f5" });
