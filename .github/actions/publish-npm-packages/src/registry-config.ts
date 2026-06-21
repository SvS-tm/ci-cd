import { z } from "zod";

const PublishOptionsSchema = z.object
(
    {
        "registry": z.string(),
        "access": z.enum(["public", "restricted"]).optional(),
        "tag": z.string().optional(),
        "provenance": z.boolean().optional()
    }
);

export const RegistryConfigSchema = z.discriminatedUnion
(
    "mode",
    [
        PublishOptionsSchema.extend
        (
            {
                "mode": z.literal("AuthToken"),
                "token": z.string()
            }
        ),
        PublishOptionsSchema.extend
        (
            {
                "mode": z.literal("TrustedPublishing")
            }
        )
    ]
);

export type RegistryConfig = z.infer<typeof RegistryConfigSchema>;
