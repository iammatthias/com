import type { DocComponent } from "./types";
import { reveal } from "./reveal";
import { tuner } from "./tuner";
import { nothing } from "./nothing";

const COMPONENTS: DocComponent[] = [reveal, tuner, nothing];

const BY_NAME = new Map(COMPONENTS.map((c) => [c.name, c]));

export function getDocComponent(name: string): DocComponent | undefined {
    return BY_NAME.get(name);
}
