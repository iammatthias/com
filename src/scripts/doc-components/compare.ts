class FfCompare extends HTMLElement {
    private range: HTMLInputElement | null = null;
    private frame: HTMLElement | null = null;

    connectedCallback() {
        this.range = this.querySelector<HTMLInputElement>(".ff-compare-range");
        this.frame = this.querySelector<HTMLElement>(".ff-compare-frame");
        if (!this.range || !this.frame) return;

        this.range.addEventListener("input", () => this.sync());
        this.frame.addEventListener("pointerdown", this.onPointer);
        this.frame.addEventListener("pointermove", this.onPointer);
        this.classList.add("is-interactive");
        this.sync();
    }

    disconnectedCallback() {
        this.frame?.removeEventListener("pointerdown", this.onPointer);
        this.frame?.removeEventListener("pointermove", this.onPointer);
    }

    private onPointer = (event: PointerEvent) => {
        const isDragging = event.buttons !== 0;
        if (!isDragging) return;
        const frame = this.frame;
        const range = this.range;
        if (!frame || !range) return;
        event.preventDefault();
        if (event.type === "pointerdown") {
            frame.setPointerCapture(event.pointerId);
        }
        const rect = frame.getBoundingClientRect();
        if (rect.width === 0) return;
        const pct = ((event.clientX - rect.left) / rect.width) * 100;
        range.value = String(Math.max(0, Math.min(100, Math.round(pct))));
        this.sync();
    };

    private sync() {
        if (!this.range) return;
        this.style.setProperty("--ff-compare-pos", `${this.range.value}%`);
    }
}

if (!customElements.get("ff-compare")) {
    customElements.define("ff-compare", FfCompare);
}
