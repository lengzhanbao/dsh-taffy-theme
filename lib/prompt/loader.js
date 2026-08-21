import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
export function loadTaffySystemPrompt() {
    return readFileSync(join(here, 'taffy-system.md'), 'utf8');
}
//# sourceMappingURL=loader.js.map