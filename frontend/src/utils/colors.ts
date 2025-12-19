export const FLASH_DURATION = 0.1;

export function lerpColor(a: string, b: string, t: number): string {
    const parse = (c: string) => {
        if (c.startsWith("#")) c = c.slice(1);
        // Handle short hex codes like #fff
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const bl = parseInt(c.slice(4, 6), 16);
        return [r, g, bl];
    };
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

export function getFlashColor(baseColor: string, flashTimer: number): string {
    if (flashTimer <= 0) return baseColor;
    const t = 1 - flashTimer / FLASH_DURATION;
    return lerpColor("#ffffff", baseColor, t);
}
