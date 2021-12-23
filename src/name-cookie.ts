export function readCookies(): any {
    const pairs = document.cookie.split('; ');
    const cookies : any = {};
    pairs.forEach((pair: string) => {
        if(pair.length > 0) {
            const [k, v] = pair.split('=');
            cookies[k] = v;
        }
    });
    return cookies;
}

export function readNameCookie(): string | null {
    const cookies = readCookies();
    return cookies.name || null;
}

export function setNameCookie(name: string): void {
    document.cookie = `name=${name}`;
}