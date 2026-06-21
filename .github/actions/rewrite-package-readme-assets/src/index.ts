import { info } from "@actions/core";
import { run, ZodHelpers } from "@svs-tm/github-actions.system";
import { Dirent, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import z from "zod";

const excludedDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const imageExtensions = "svg|gif|png|jpg|jpeg|webp|avif";
const htmlRelativeAssetPattern = new RegExp(`(src=["'])\\.\\/([^"']+\\.(${imageExtensions}))(["'])`, "gi");
const markdownRelativeAssetPattern = new RegExp(`(!\\[[^\\]]*\\]\\()\\.\\/([^\\)]+\\.(${imageExtensions}))(\\))`, "gi");

await run
(
    z.object
    (
        {
            path: z.string().optional().transform(ZodHelpers.githubInput()),
            commit: z.string().min(1)
        }
    ),
    async (inputs) =>
    {
        const root = inputs.path
            ? path.resolve(inputs.path)
            : process.env.GITHUB_WORKSPACE;

        if (!root)
            throw new Error("Could not resolve workspace path.");

        for (const packageJsonPath of findPackageJsonFiles(root))
            rewritePackageReadme(packageJsonPath, inputs.commit);
    }
);

function rewritePackageReadme(packageJsonPath: string, commit: string)
{
    const packageDirectory = path.dirname(packageJsonPath);
    const readmePath = path.join(packageDirectory, "README.md");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as PackageJson;

    if (!hasReadme(readmePath) || !packageJson.repository)
        return;

    const readme = readFileSync(readmePath, "utf-8");
    const rawBaseUrl = getRawBaseUrl(packageJson, commit);

    if (!rawBaseUrl)
        return;

    const nextReadme = readme
        .replace(htmlRelativeAssetPattern, `$1${rawBaseUrl}/$2$4`)
        .replace(markdownRelativeAssetPattern, `$1${rawBaseUrl}/$2$4`);

    if (nextReadme === readme)
        return;

    writeFileSync(readmePath, nextReadme, "utf-8");
    info(`Rewrote README image assets for ${packageJson.name} to ${rawBaseUrl}`);
}

function* findPackageJsonFiles(directory: string): Generator<string>
{
    for (const entry of readdirSync(directory, { withFileTypes: true }))
    {
        if (shouldSkipEntry(entry))
            continue;

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory())
            yield* findPackageJsonFiles(fullPath);

        if (entry.isFile() && entry.name === "package.json")
            yield fullPath;
    }
}

function shouldSkipEntry(entry: Dirent)
{
    return entry.isDirectory() && excludedDirectories.has(entry.name);
}

function hasReadme(readmePath: string)
{
    try
    {
        readFileSync(readmePath);

        return true;
    }
    catch
    {
        return false;
    }
}

function getRawBaseUrl(packageJson: PackageJson, commit: string)
{
    const repository = getRepository(packageJson);

    if (!repository)
        return undefined;

    const directory = typeof packageJson.repository === "object"
        ? packageJson.repository.directory
        : undefined;

    const basePath = directory
        ? `/${trimSlashes(directory)}`
        : "";

    return `https://raw.githubusercontent.com/${repository.owner}/${repository.name}/${commit}${basePath}`;
}

function getRepository(packageJson: PackageJson)
{
    const repositoryUrl = typeof packageJson.repository === "string"
        ? packageJson.repository
        : packageJson.repository?.url;

    if (!repositoryUrl)
    {
        info(`Skipping ${packageJson.name}: repository.url is not defined.`);

        return undefined;
    }

    const match = repositoryUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/i);

    if (!match)
    {
        info(`Skipping ${packageJson.name}: repository.url is not a GitHub URL.`);

        return undefined;
    }

    return {
        owner: match[1],
        name: match[2]
    };
}

function trimSlashes(value: string)
{
    return value.replace(/^\/+|\/+$/g, "");
}

type PackageJson = {
    name?: string;
    repository?: string | {
        url?: string;
        directory?: string;
    };
};
