import { run } from "@svs-tm/github-actions.system";
import { InputsSchema } from "./inputs";
import { publishToRegistry } from "./publish-to-registry";
import { info } from "console";
import { RegistriesConfigSchema } from "./registries-config";
import { setSecret } from "@actions/core";

await run
(
    InputsSchema,
    async (inputs) =>
    {
        const registriesConfig = RegistriesConfigSchema.parse(process.env.NPM_REGISTRIES_CONFIG);

        for (const path of inputs.paths)
        {
            for (const config of registriesConfig)
            {
                if (config.mode === "AuthToken")
                    setSecret(config.token);
                
                await publishToRegistry(path, config);
            }
        }

        info(`Success, published ${inputs.paths.length} package(s) to ${registriesConfig.length} registry/ies`);
    }
);
