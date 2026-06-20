import { z } from "zod";

export const PackageJsonSchema = z.object
(
    {
        name: z.string().min(1),
        version: z.string().min(1)
    }
);
