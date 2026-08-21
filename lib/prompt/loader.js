import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
let cachedPrompt;
export function loadTaffySystemPrompt() {
    if (cachedPrompt !== undefined)
        return cachedPrompt;
    try {
        cachedPrompt = readFileSync(join(here, 'taffy-system.md'), 'utf8');
        return cachedPrompt;
    }
    catch (error) {
        throw new Error('Failed to load Taffy system prompt', { cause: error });
    }
}
//# sourceMappingURL=loader.js.map