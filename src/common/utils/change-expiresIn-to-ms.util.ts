export function changeExpireInToMillisecond(expireIn: string): number {
    const unit = expireIn.slice(-1);
    const amount = parseInt(expireIn.slice(0, -1), 10);

    if (isNaN(amount)) {
        throw new Error(`Invalid time amount in "${expireIn}"`);
    }

    switch (unit) {
        case 's':
            return amount * 1000;
        case 'm':
            return amount * 60 * 1000;
        case 'h':
            return amount * 60 * 60 * 1000;
        case 'd':
            return amount * 24 * 60 * 60 * 1000;
        default:
            // If no unit provided, assume the whole string is in seconds
            const fallback = parseInt(expireIn, 10);
            if (isNaN(fallback)) {
                throw new Error(`Invalid duration format: "${expireIn}"`);
            }
            return fallback * 1000;
    }
}
