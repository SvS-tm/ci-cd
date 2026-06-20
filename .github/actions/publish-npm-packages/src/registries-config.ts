import { z } from "zod";
import { ZodHelpers } from "@svs-tm/github-actions.system";
import { RegistryConfigSchema } from "./registry-config";

export const RegistriesConfigSchema = ZodHelpers.json
(
    z.array(RegistryConfigSchema)
        .min(1)
);

export type RegistryConfig = z.infer<typeof RegistriesConfigSchema>;
 