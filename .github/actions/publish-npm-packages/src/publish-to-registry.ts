import { info } from "@actions/core";
import { exec } from "@actions/exec";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import type { RegistryConfig } from "./registry-config";
import { getNpmAuthLine } from "./get-npm-auth-line";
import { readPackageVersionFromTgz } from "./read-package-version-from-tgz";

export async function publishToRegistry(assetPath: string, config: RegistryConfig)
{
    const version = await readPackageVersionFromTgz(assetPath);
    const tag = config.tag ?? getPrereleaseTag(version);
    const args = getPublishArgs(resolve(assetPath), config, tag);

    const tempDir = await mkdtemp(join(tmpdir(), "npm-publish-"));

    try
    {
        // npm checks devEngines in its working project, even when publishing a tarball.
        if (config.mode === "TrustedPublishing")
        {
            info(`Publishing '${assetPath}' to '${config.registry}' using trusted publishing${tag ? ` with tag '${tag}'` : ""}`);

            await exec("npm", args, { cwd: tempDir });

            return;
        }

        const npmrcPath = join(tempDir, ".npmrc");

        await writeFile
        (
            npmrcPath,
            [
                `registry=${config.registry}`,
                getNpmAuthLine(config.registry, config.token),
                "always-auth=true",
                "",
            ]
                .join("\n"),
            { encoding: "utf-8" }
        );

        info(`Publishing '${assetPath}' to '${config.registry}'${tag ? ` with tag '${tag}'` : ""}`);

        await exec("npm", [...args, "--userconfig", npmrcPath], { cwd: tempDir });
    }
    finally
    {
        await rm(tempDir, { recursive: true, force: true });
    }
}

function getPublishArgs(assetPath: string, config: RegistryConfig, tag?: string)
{
    const args =
    [
        "publish",
        assetPath,
        "--registry",
        config.registry
    ];

    if (config.access)
        args.push("--access", config.access);

    if (tag)
        args.push("--tag", tag);

    if (typeof config.provenance === "boolean")
        args.push(`--provenance=${config.provenance}`);

    return args;
}

function getPrereleaseTag(version: string)
{
    const prerelease = version.match(/^[0-9]+\.[0-9]+\.[0-9]+-([0-9A-Za-z-]+)/)?.[1];

    if (!prerelease)
        return undefined;

    return /^[0-9]+$/.test(prerelease)
        ? "next"
        : prerelease;
}
