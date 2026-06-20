import { z } from "zod";

export const RegistryConfigSchema = z.object
(
    {
        "registry": z.string(),
        "token": z.string()
    }
);

export type RegistryConfig = z.infer<typeof RegistryConfigSchema>;
