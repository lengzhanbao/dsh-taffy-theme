import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
export declare function resolveAssetPath(relativePath: string, assetsRoot?: string): string;
export declare function servePluginAsset(req: IncomingMessage, res: ServerResponse, pathname: string, assetsRoot?: string, routePrefix?: string): Promise<void>;
export declare function registerAssetRoute(ctx: Context, assetsRoot?: string): () => void;
