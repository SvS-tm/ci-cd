import { context } from "@actions/github";

export function getReleaseBody()
{
    return context.payload.pull_request?.body ?? "";
}
