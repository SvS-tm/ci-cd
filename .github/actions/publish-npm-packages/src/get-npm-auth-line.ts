export function getNpmAuthLine(registry: string, token: string) 
{
    const url = new URL(registry);

    const path = url.pathname.endsWith("/")
        ? url.pathname
        : `${url.pathname}/`;

    return `//${url.host}${path}:_authToken=${token}`;
}
