import type { DocComponent } from "./types";
import { reveal } from "./reveal";
import { tuner } from "./tuner";

const COMPONENTS: DocComponent[] = [reveal, tuner];

const BY_NAME = new Map(COMPONENTS.map((c) => [c.name, c]));

export const DOC_COMPONENT_NAMES = COMPONENTS.map((c) => c.name);

export function getDocComponent(name: string): DocComponent | undefined {
    return BY_NAME.get(name);
}
