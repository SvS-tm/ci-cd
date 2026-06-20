import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig
(
    [
        {
            input: "src/index.ts",
            output: [
                { file: "dist/index.mjs", format: "esm", sourcemap: true }
            ],
            context: "globalThis",
            plugins: [
                nodeResolve({ preferBuiltins: true }),
                commonjs(),
                typescript({ outputToFilesystem: true })
            ],
            external: [],
            onwarn(warning, warn) 
            {
                if (warning.code === "CIRCULAR_DEPENDENCY")
                    return;

                warn(warning);
            }
        }
    ]
);
