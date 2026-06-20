import * as tar from "tar";
import { PackageJsonSchema } from "./package-json-schema";

export async function readPackageJsonFromTgz(tgzPath: string) 
{
    let packageJsonContent: string | undefined;

    await tar.t
    (
        {
            file: tgzPath,
            onentry: (entry) => 
            {
                // npm tarballs usually contain package/package.json,
                // but this also supports package.json at any nested level.
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

    return PackageJsonSchema.parse(JSON.parse(packageJsonContent));
}
