export type ComponentProps = Record<string, string>;

export type Renderer<T> = (source: string) => T;

export interface DocComponent {
    name: string;
    render(
        props: ComponentProps,
        children: string,
        html: Renderer<Promise<string>>,
    ): Promise<string> | string;
    feed?(
        props: ComponentProps,
        children: string,
        html: Renderer<Promise<string>>,
    ): Promise<string> | string;
    markdown?(
        props: ComponentProps,
        children: string,
        markdown: Renderer<string>,
    ): string;
    text?(props: ComponentProps, children: string, text: Renderer<string>): string;
}
