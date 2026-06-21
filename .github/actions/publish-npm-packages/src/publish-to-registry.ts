import { info } from "@actions/core";
import { exec } from "@actions/exec";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path/posix";
import { RegistryConfig } from "./registry-config";
import { getNpmAuthLine } from "./get-npm-auth-line";

export async function publishToRegistry(assetPath: string, config: RegistryConfig) 
{
    const args = getPublishArgs(assetPath, config);

    if (config.mode === "TrustedPublishing")
    {
        info(`Publishing '${assetPath}' to '${config.registry}' using trusted publishing`);

        await exec("npm", args);

        return;
    }

    const tempDir = await mkdtemp(join(tmpdir(), "npm-publish-"));
    const npmrcPath = join(tempDir, ".npmrc");

    try 
    {
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

        info(`Publishing '${assetPath}' to '${config.registry}'`);

        await exec("npm", [...args, "--userconfig", npmrcPath]);
    }
    finally 
    {
        await rm(tempDir, { recursive: true, force: true });
    }
}

function getPublishArgs(assetPath: string, config: RegistryConfig)
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

    if (config.tag)
        args.push("--tag", config.tag);

    if (typeof config.provenance === "boolean")
        args.push(`--provenance=${config.provenance}`);

    return args;
}
