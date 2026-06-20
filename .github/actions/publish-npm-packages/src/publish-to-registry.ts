import { info } from "@actions/core";
import { exec } from "@actions/exec";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path/posix";
import { RegistryConfig } from "./registry-config";
import { getNpmAuthLine } from "./get-npm-auth-line";

export async function publishToRegistry(assetPath: string, config: RegistryConfig) 
{
    const tempDir = await mkdtemp(join(tmpdir(), "npm-publish-"));
    const npmrcPath = join(tempDir, ".npmrc");

    try 
    {
        await writeFile
        (
            npmrcPath,
            [
                `registry=${config.registry}`,
                getNpmAuthLine(config.registry, config.authTokenSource),
                "always-auth=true",
                "",
            ]
                .join("\n"),
            { encoding: "utf-8" }
        );

        info(`Publishing '${assetPath}' to '${config.registry}'`);

        await exec
        (
            "npm",
            [
                "publish",
                assetPath,
                "--registry",
                config.registry,
                "--userconfig",
                npmrcPath,
            ]
        );
    }
    finally 
    {
        await rm(tempDir, { recursive: true, force: true });
    }
}
