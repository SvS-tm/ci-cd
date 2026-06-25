import { info, warning } from "@actions/core";
import { getOctokit } from "@actions/github";

export async function createTag
(
    octokit: ReturnType<typeof getOctokit>,
    owner: string,
    repo: string,
    sha: string,
    tag: string
) 
{
    try 
    {
        await octokit.rest.git.createRef
        (
            {
                owner,
                repo,
                ref: `refs/tags/${tag}`,
                sha,
            }
        );

        info(`Created tag: ${tag}`);

        return true;
    }
    catch (error: any) 
    {
        if (error.status === 422) 
        {
            const existing = await octokit.rest.git.getRef
            (
                {
                    owner,
                    repo,
                    ref: `tags/${tag}`
                }
            );

            if (existing.data.object.sha !== sha)
                throw new Error(`Tag '${tag}' already exists at '${existing.data.object.sha}', expected '${sha}'.`);

            warning(`Tag already exists at the expected commit, reusing: ${tag}`);

            return true;
        }

        throw error;
    }
}
