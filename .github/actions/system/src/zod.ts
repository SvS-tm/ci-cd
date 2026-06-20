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
}
