import { z } from "zod";

export const RegistryConfigSchema = z.object
(
    {
        "registry": z.string(),
        "authTokenSource": z.string()
    }
);

export type RegistryConfig = z.infer<typeof RegistryConfigSchema>;
