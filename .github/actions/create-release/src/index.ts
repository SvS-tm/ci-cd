import { Endpoints } from "@octokit/types";
import { run, isSuccessStatusCode, serializeObject } from "@github/system";
import z from "zod";
import { getOctokit } from "@actions/github";
import { info } from "@actions/core";

type MakeLatest = Endpoints['POST /repos/{owner}/{repo}/releases']['parameters']['make_latest'];

await run
(
    z.object
    (
        {
            owner: z.coerce.string(),
            repository: z.coerce.string(),
            token: z.coerce.string(),
            tag_name: z.coerce.string(),
            target_commitish: z.coerce.string(),
            name: z.coerce.string(),
            body: z.coerce.string(),
            draft: z.coerce.boolean(),
            prerelease: z.coerce.boolean(),
            discussion_category_name: z.coerce.string(),
            generate_release_notes: z.coerce.boolean(),
            make_latest: z.literal([ "true", "false", "legacy" ] satisfies MakeLatest[])
        }
    ),
    async (inputs) =>
    {
        const octokit = getOctokit(inputs.token);

        const response = await octokit.rest.repos.createRelease
        (
            {
                owner: inputs.owner,
                repo: inputs.repository,
                tag_name: inputs.tag_name,
                body: inputs.body,
                draft: inputs.draft,
                discussion_category_name: inputs.discussion_category_name,
                generate_release_notes: inputs.generate_release_notes,
                make_latest: inputs.make_latest,
                name: inputs.name,
                prerelease: inputs.prerelease,
                target_commitish: inputs.target_commitish
            }
        );

        if (!isSuccessStatusCode(response.status))
        {
            throw new Error("Unexpected API response", { cause: response });
        }

        info(`Success ${serializeObject(response.data)}`);

        return {
            id: String(response.data.id),
            url: response.data.url,
            upload_url: response.data.upload_url
        };
    }
);
