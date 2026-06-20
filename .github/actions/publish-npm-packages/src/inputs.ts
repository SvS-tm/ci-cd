import { ZodHelpers } from "@svs-tm/github-actions.system";
import z from "zod";

export const InputsSchema = z.object
(
    {
        paths: ZodHelpers.json
        (
            z.array(z.string())
                .min(1)
        )
    }
);


export type Inputs = z.infer<typeof InputsSchema>;
