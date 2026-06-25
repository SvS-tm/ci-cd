import * as tar from "tar";

export async function readPackageVersionFromTgz(tgzPath: string)
{
    let packageJsonContent: string | undefined;

    await tar.t
    (
        {
            file: tgzPath,
            onentry: (entry) =>
            {
                const normalizedPath = entry.path.replace(/\\/g, "/");

                if
                (
                    normalizedPath === "package/package.json"
                        ||
                    normalizedPath.endsWith("/package.json")
                )
                {
                    const chunks: Buffer[] = [];

                    entry.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
                    entry.on("end", () => (packageJsonContent = Buffer.concat(chunks).toString("utf8")));
                }
                else
                    entry.resume();
            }
        }
    );

    if (!packageJsonContent)
        throw new Error(`No package.json found inside ${tgzPath}`);

    const packageJson = JSON.parse(packageJsonContent) as { version?: unknown };

    if (typeof packageJson.version !== "string" || !packageJson.version.length)
        throw new Error(`No valid package version found inside ${tgzPath}`);

    return packageJson.version;
}
