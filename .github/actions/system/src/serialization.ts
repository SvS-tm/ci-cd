import util from "util";

export function serializeObject(argument: any, depth?: number)
{
    return util.inspect(argument, false, depth ?? 3, true);
}
