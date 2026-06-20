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
            warning(`Tag already exists, skipping: ${tag}`);

            return false;
        }

        throw error;
    }
}
