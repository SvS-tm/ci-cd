import { info } from "@actions/core";
import { run, ZodHelpers } from "@svs-tm/github-actions.system";
import { Dirent, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import z from "zod";

const excludedDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const imageExtensions = "svg|gif|png|jpg|jpeg|webp|avif";
const documentTarget = `(?:LICENSE(?:\\.md|\\.txt)?|[^"'#)]+\\.(?:md|markdown))(?:#[^"')]+)?`;
const relativePathPrefix = `(?:\\.\\.?\\/)`;
const htmlRelativeAssetPattern = new RegExp(`(src=["'])\\.\\/([^"']+\\.(${imageExtensions}))(["'])`, "gi");
const markdownRelativeAssetPattern = new RegExp(`(!\\[[^\\]]*\\]\\()\\.\\/([^\\)]+\\.(${imageExtensions}))(\\))`, "gi");
const htmlRelativeDocumentLinkPattern = new RegExp(`(href=["'])(${relativePathPrefix}${documentTarget})(["'])`, "gi");
const markdownRelativeDocumentLinkPattern = new RegExp(`(^|[^!])(\\[[^\\]]+\\]\\()(${relativePathPrefix}${documentTarget})(\\))`, "gim");

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
        .replace
        (
            htmlRelativeAssetPattern,
            (_match, prefix: string, target: string, _extension: string, suffix: string) =>
                replaceUrl(packageJson, `./${target}`, `${rawBaseUrl}/${target}`, prefix, suffix)
        )
        .replace
        (
            markdownRelativeAssetPattern,
            (_match, prefix: string, target: string, _extension: string, suffix: string) =>
                replaceUrl(packageJson, `./${target}`, `${rawBaseUrl}/${target}`, prefix, suffix)
        )
        .replace
        (
            htmlRelativeDocumentLinkPattern,
            (_match, prefix: string, target: string, suffix: string) =>
                replaceDocumentUrl(packageJson, commit, target, prefix, suffix)
        )
        .replace
        (
            markdownRelativeDocumentLinkPattern,
            (_match, leading: string, prefix: string, target: string, suffix: string) =>
                `${leading}${replaceDocumentUrl(packageJson, commit, target, prefix, suffix)}`
        );

    if (nextReadme === readme)
        return;

    writeFileSync(readmePath, nextReadme, "utf-8");
    info(`Rewrote README image assets and document links for ${packageJson.name}`);
}

function replaceUrl(packageJson: PackageJson, from: string, to: string, prefix: string, suffix: string)
{
    info(`Rewriting ${packageJson.name}: ${from} -> ${to}`);

    return `${prefix}${to}${suffix}`;
}

function replaceDocumentUrl(packageJson: PackageJson, commit: string, target: string, prefix: string, suffix: string)
{
    const to = getBlobUrl(packageJson, commit, target);

    if (!to)
        return `${prefix}${target}${suffix}`;

    return replaceUrl(packageJson, target, to, prefix, suffix);
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

function getBlobUrl(packageJson: PackageJson, commit: string, target: string)
{
    const repository = getRepository(packageJson);

    if (!repository)
        return undefined;

    const [targetPath, anchor] = splitAnchor(target);
    const directory = typeof packageJson.repository === "object"
        ? packageJson.repository.directory
        : undefined;
    const basePath = directory
        ? trimSlashes(directory)
        : "";
    const normalizedPath = path.posix.normalize(`${basePath}/${targetPath}`);

    if (normalizedPath.startsWith("../"))
    {
        info(`Skipping ${packageJson.name}: relative document link '${target}' escapes repository root.`);

        return undefined;
    }

    return `https://github.com/${repository.owner}/${repository.name}/blob/${commit}/${normalizedPath}${anchor}`;
}

function splitAnchor(target: string): [string, string]
{
    const index = target.indexOf("#");

    if (index < 0)
        return [target, ""];

    return [target.slice(0, index), target.slice(index)];
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
