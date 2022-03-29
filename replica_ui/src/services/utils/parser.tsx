
export function parseIntSafe(value: string) {
    const parsed = parseInt(value);

    if (isNaN(parsed)) return 0;

    return parsed;
}
