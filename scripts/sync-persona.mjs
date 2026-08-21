/**
 * Inject src/prompt/taffy-system.md into presets/taffy/agent.cordis.yml persona.text.
 * Single source of truth for the Taffy agent persona.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const prompt = fs.readFileSync(path.join(root, 'src/prompt/taffy-system.md'), 'utf8')
const agentPath = path.join(root, 'presets/taffy/agent.cordis.yml')
const agent = fs.readFileSync(agentPath, 'utf8')

const markerStart = '- id: persona\n  name: \'@deepseek-ai/dsh-persona\'\n  config:\n    text: |\n'
const markerEnd = '\n\n- id: agent-instructions'

const startIdx = agent.indexOf(markerStart)
const endIdx = agent.indexOf(markerEnd)
if (startIdx === -1 || endIdx === -1) {
  throw new Error('persona block markers not found in presets/taffy/agent.cordis.yml')
}

const indented = prompt
  .replace(/\r?\n/g, '\n')
  .split('\n')
  .map((line) => `      ${line}`)
  .join('\n')

const next = agent.slice(0, startIdx + markerStart.length) + indented + agent.slice(endIdx)
fs.writeFileSync(agentPath, next)
console.log('synced persona into presets/taffy/agent.cordis.yml')
