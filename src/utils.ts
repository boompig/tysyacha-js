/**
 * Generate a random number in the half-open interval [a, b)
 * Both a and b are assumed to be integers
 */
export function randInt(a: number, b: number): number {
    return Math.floor(Math.random() * (b - a)) + a;
}
