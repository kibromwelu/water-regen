export function formatId(id: number, prefix = 'T', width = 6): string {
    if (!Number.isFinite(id) || id < 0) {
        throw new Error(`Invalid ID: ${id}`);
    }
    return prefix + id.toString().padStart(width, '0');
}

export function getRealId(formattedId: string, prefix = 'T'): number {
    if (!formattedId.startsWith(prefix)) {
        throw new Error(`Invalid formatted ID: ${formattedId}`);
    }
    const idPart = formattedId.slice(prefix.length);
    const id = parseInt(idPart, 10);
    if (isNaN(id)) {
        throw new Error(`Invalid formatted ID: ${formattedId}`);
    }
    return id;
}
