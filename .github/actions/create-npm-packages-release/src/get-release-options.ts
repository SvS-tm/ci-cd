import type { PackageMetadata } from "./package-metadata";

export function getReleaseOptions(packages: readonly PackageMetadata[], override?: boolean)
{
    const prerelease = override ?? packages.some
    (
        ({ version }) => /^[0-9]+\.[0-9]+\.[0-9]+-/.test(version)
    );

    return { prerelease, make_latest: prerelease ? "false" as const : "true" as const };
}
