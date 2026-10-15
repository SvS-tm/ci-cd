import z, { ZodType } from "zod";

export namespace ZodHelpers
{
    export function json<T_Type extends ZodType>(type: T_Type)
    {
        return z
            .string()
            .transform
            (
                (value, ctx) => 
                {
                    try 
                    {
                        return JSON.parse(value);
                    } 
                    catch 
                    {
                        ctx.addIssue
                        (
                            {
                                code: "custom",
                                message: "Expected a JSON array string"
                            }
                        );

                        return z.NEVER;
                    }
                }
            )
            .pipe(type);
    }

    // getInput returns an empty string for both omitted and explicitly empty inputs.
    // Normalize before parsing so optional/default schemas see undefined.
    export function githubInput<T_Type extends ZodType>(type: T_Type)
    {
        return z.preprocess(value => value === "" ? undefined : value, type);
    }
}
