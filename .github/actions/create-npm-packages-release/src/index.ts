import { info, warning } from "@actions/core";
import { getOctokit } from "@actions/github";
import { isSuccessStatusCode, run, serializeObject, findTgzFiles, ZodHelpers } from "@svs-tm/github-actions.system";
import { readFile } from "fs/promises";
import path from "path";
import z from "zod";
import { createTag } from "./create-tag";
import { formatReleaseDate } from "./format-release-date";
import { getReleaseBody } from "./get-release-body";
import { PackageMetadata } from "./package-metadata";
import { readPackageJsonFromTgz } from "./read-package-json-from-tgz";

await run
(
    z.object
    (
        {
            owner: z.string(),
            repository: z.coerce.string(),
            token: z.coerce.string(),
            target_commitish: z.coerce.string(),
            draft: z.coerce.boolean().optional().transform(ZodHelpers.githubInput()),
            prerelease: z.coerce.boolean().optional().transform(ZodHelpers.githubInput()),
            discussion_category_name: z.coerce.string().optional().transform(ZodHelpers.githubInput()),
            path: z.string()
        }
    ),
    async (inputs) =>
    {
        const octokit = getOctokit(inputs.token);

        const packagesToPublish: PackageMetadata[] = []; 

        for (const tgz of findTgzFiles(inputs.path))
        {
            const packageJson = await readPackageJsonFromTgz(tgz);

            info(`Creating tag ${packageJson.name}-${packageJson.version} ...`);

            const created = await createTag
            (
                octokit, 
                inputs.owner, 
                inputs.repository, 
                inputs.target_commitish,
                `${packageJson.name}-${packageJson.version}`,
            );

            if (created)
            {
                info(`Tag was created ${packageJson.name}-${packageJson.version}`);

                packagesToPublish.push({ ...packageJson, path: tgz });
            }
            else
                warning(`Could not create tag ${packageJson.name}-${packageJson.version}, skipping this package`);
        }

        if (!packagesToPublish.length)
        {
            warning(`No packages found to publish, skipping release creation...`);

            return;
        }

        info(`Creating release for ${packagesToPublish.length} package(s)...`);

        const createReleaseResponse = await octokit.rest.repos.createRelease
        (
            {
                owner: inputs.owner,
                repo: inputs.repository,
                target_commitish: inputs.target_commitish,
                name: `Release ${formatReleaseDate()}`,
                tag_name: `r${formatReleaseDate()}`,
                body: getReleaseBody(),
                draft: inputs.draft,
                discussion_category_name: inputs.discussion_category_name,
                generate_release_notes: false,
                make_latest: "true",
                prerelease: inputs.prerelease
            }
        );

        if (!isSuccessStatusCode(createReleaseResponse.status))
            throw new Error("Unexpected API response for release creatinon", { cause: createReleaseResponse });

        info(`Release created ${serializeObject(createReleaseResponse.data)}`);

        for (const packageMeta of packagesToPublish)
        {
            info(`Uploading release asset ${serializeObject(packageMeta)}`);

            const buffer = await readFile(packageMeta.path);

            const uploadReleaseAssetResponse = await octokit.rest.repos.uploadReleaseAsset
            (
                {
                    owner: inputs.owner,
                    repo: inputs.repository,
                    data: buffer as unknown as string, //https://github.com/octokit/octokit.js/discussions/2087
                    release_id: createReleaseResponse.data.id,
                    name: path.basename(packageMeta.path),
                    label: `${packageMeta.name}-${packageMeta.version}`
                }
            );

            if (!isSuccessStatusCode(uploadReleaseAssetResponse.status))
                throw new Error("Unexpected API response for release asset upload", { cause: uploadReleaseAssetResponse });

            info(`Asset uploaded ${serializeObject(uploadReleaseAssetResponse.data)}`);
        }
        
        return {
            id: String(createReleaseResponse.data.id),
            url: createReleaseResponse.data.url,
            upload_url: createReleaseResponse.data.upload_url,
            packages: packagesToPublish.map(({ path }) => path)
        };
    }
);
