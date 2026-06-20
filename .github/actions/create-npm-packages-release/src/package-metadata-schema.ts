import { z } from "zod";
import { PackageJsonSchema } from "./package-json-schema";

export const PackageMetadataSchema = PackageJsonSchema.extend
(
    {
        path: z.string()
    }
);
