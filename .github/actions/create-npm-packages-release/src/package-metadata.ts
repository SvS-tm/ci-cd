import { z } from "zod";
import { PackageMetadataSchema } from "./package-metadata-schema";

export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;
