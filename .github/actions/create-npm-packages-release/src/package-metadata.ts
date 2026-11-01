import type { z } from "zod";
import type { PackageMetadataSchema } from "./package-metadata-schema";

export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;
