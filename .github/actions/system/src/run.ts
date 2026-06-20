import { error, getInput, info, setFailed, setOutput } from "@actions/core";
import z, { ZodType } from "zod";
import { serializeObject } from "./serialization";

const inputs = new Proxy
(
    {} as object, 
    {
        get(_target, key)
        {
            if (typeof key === 'symbol')
                return undefined;

            return getInput(key);
        },
        has(_target, key) 
        {
            if (typeof key === "symbol")
                return false;

            return true;
        }
    }
);

function getInputs<T_Type extends ZodType>(type: T_Type)
{
    return type.parse(inputs);
}


function setOutputs<T_Outputs>(parameters: T_Outputs)
{
    for (const key in parameters)
    {
        info(`Setting output ${key}`);
        
        setOutput(key, parameters[key]);
    }
}

export async function run
<
    T_Inputs extends ZodType,
    T_Outputs = void
>
(
    inputsType: T_Inputs,
    action: (inputs: z.infer<T_Inputs>) => Promise<T_Outputs> | T_Outputs
)
{
    try
    {
        const inputs = getInputs(inputsType);

        const outputs = await action(inputs);

        if (outputs)
            setOutputs(outputs);
    }
    catch (exc)
    {
        const content = serializeObject(exc);

        error(content);
        
        setFailed(content);
    }
}
