import type { DocComponent } from "./types";
import { compare } from "./compare";

const COMPONENTS: DocComponent[] = [compare];

const BY_NAME = new Map(COMPONENTS.map((c) => [c.name, c]));

export const DOC_COMPONENT_NAMES = COMPONENTS.map((c) => c.name);

export function getDocComponent(name: string): DocComponent | undefined {
    return BY_NAME.get(name);
}
