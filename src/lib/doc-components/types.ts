export type ComponentProps = Record<string, string>;

export interface DocComponent {
    name: string;
    render(props: ComponentProps, children: string): Promise<string> | string;
    text?(props: ComponentProps, children: string): string;
}
