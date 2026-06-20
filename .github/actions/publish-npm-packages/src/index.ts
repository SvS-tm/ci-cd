import { run } from "@svs-tm/github-actions.system";
import { InputsSchema } from "./inputs";
import { publishToRegistry } from "./publish-to-registry";
import { info } from "console";
import { RegistriesConfigSchema } from "./registries-config";

await run
(
    InputsSchema,
    async (inputs) =>
    {
        const registries = RegistriesConfigSchema.parse(process.env.NPM_REGISTRIES_CONFIG);

        for (const path of inputs.paths)
        {
            for (const registry of registries)
                await publishToRegistry(path, registry);
        }

        info(`Success, published ${inputs.paths.length} package(s) to ${registries.length} registry/ies`);
    }
);
