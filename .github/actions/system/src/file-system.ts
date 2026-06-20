import fs from "fs";
import path from "path";

export function* findTgzFiles(directory: string) : Generator<string>
{
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) 
    {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory())
            yield* findTgzFiles(fullPath);

        if (entry.isFile() && entry.name.endsWith(".tgz"))
            yield fullPath;
    }
}
