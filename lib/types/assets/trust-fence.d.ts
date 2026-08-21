import type { IncomingHttpHeaders } from 'node:http';
export declare function isLoopbackHostname(hostname: string): boolean;
/** Local browser-trust fence for plugin static assets (loopback Host only). */
export declare function isTrustedLocalRequest(headers: IncomingHttpHeaders): boolean;
