/** Pre-paint veil bootstrap — mirrors ui-theme/boot-theme.ts. */
export function injectBootTaffy(html) {
    const script = `<script>(() => { try { document.documentElement.setAttribute('data-dsh-taffy-theme',''); document.body?.setAttribute('data-dsh-taffy-theme',''); } catch {} })()</script>`;
    const body = /<body(?:\s[^>]*)?>/i.exec(html);
    if (body === null)
        return `${html}${script}`;
    const at = body.index + body[0].length;
    return `${html.slice(0, at)}${script}${html.slice(at)}`;
}
//# sourceMappingURL=boot-taffy.js.map