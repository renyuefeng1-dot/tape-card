// 生成名片页面：输入 profile 对象，输出一个完全自包含的 index.html 字符串。
// 输出页面不含任何 <script>、不引用任何外部 CSS / 字体 / 图片（头像以 data URI 内联），
// 只有你自己填的链接是普通 <a href>。这样放进 TapeOut 容器（CSP 禁止外部脚本）也能正常显示。
(function (root) {
  'use strict';
  var SITE = 'https://renyuefeng1-dot.github.io/tape-card/';

  var THEMES = {
    light: { zh: '简白', en: 'Light',
      vars: '--bg:#f5f5f2;--card:#ffffff;--text:#1d1d1f;--muted:#6b7280;--accent:#2563eb;--chip:#eef2ff;--chipText:#3730a3;--border:#e5e7eb;--btn:#f9fafb',
      font: '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif',
      extra: '' },
    dark: { zh: '暗夜', en: 'Dark',
      vars: '--bg:#0b0e13;--card:#151a22;--text:#e6edf3;--muted:#8b949e;--accent:#f0b90b;--chip:#2a2410;--chipText:#f5d061;--border:#2b3240;--btn:#1b212b',
      font: '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
      extra: '' },
    ink: { zh: '水墨禅', en: 'Zen Ink',
      vars: '--bg:#efe9dc;--card:rgba(255,253,247,.86);--text:#1f1d1a;--muted:#6f675c;--accent:#9b1c1c;--chip:transparent;--chipText:#3b352d;--border:#cfc5b3;--btn:rgba(255,255,255,.5)',
      font: '"Songti SC","STSong","Noto Serif SC","Source Han Serif SC","SimSun",Georgia,serif',
      extra: 'body{background:radial-gradient(ellipse at 15% 10%,rgba(0,0,0,.10),transparent 45%),radial-gradient(ellipse at 90% 85%,rgba(0,0,0,.08),transparent 40%),radial-gradient(ellipse at 70% 20%,rgba(0,0,0,.04),transparent 35%),var(--bg)}' +
        '.card{box-shadow:none;border:1px solid var(--border);position:relative}' +
        '.seal{position:absolute;right:18px;top:18px;width:36px;height:36px;border:2px solid var(--accent);color:var(--accent);font-size:20px;line-height:32px;text-align:center;border-radius:4px;transform:rotate(6deg);opacity:.85}' +
        '.tag{border:1px solid var(--border);border-radius:2px}.avatar{filter:grayscale(.35) contrast(1.05)}h1{letter-spacing:.12em}' },
    cyber: { zh: '赛博', en: 'Cyber',
      vars: '--bg:#05010f;--card:rgba(10,6,30,.88);--text:#e8f9ff;--muted:#8aa4c8;--accent:#00f0ff;--chip:rgba(255,43,214,.12);--chipText:#ff7be6;--border:#2d1f5c;--btn:rgba(0,240,255,.06)',
      font: '"SFMono-Regular",Menlo,Consolas,"Liberation Mono","PingFang SC","Microsoft YaHei",monospace',
      extra: 'body{background:linear-gradient(rgba(0,240,255,.06) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,rgba(255,43,214,.06) 1px,transparent 1px) 0 0/28px 28px,var(--bg)}' +
        '.card{border:1px solid var(--accent);box-shadow:0 0 24px rgba(0,240,255,.25),inset 0 0 24px rgba(255,43,214,.08)}' +
        'h1{text-shadow:0 0 10px rgba(0,240,255,.7)}.avatar{border-color:var(--accent);box-shadow:0 0 18px rgba(255,43,214,.6)}.link:hover{box-shadow:0 0 12px rgba(0,240,255,.5)}' },
    gold: { zh: 'BNB 金', en: 'BNB Gold',
      vars: '--bg:#fff8e7;--card:#ffffff;--text:#1e1a12;--muted:#7a6a48;--accent:#c99400;--chip:#fff1c2;--chipText:#7a5800;--border:#f0dfae;--btn:#fffbef',
      font: '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
      extra: 'body{background:linear-gradient(160deg,#fff8e7 0%,#ffe9a8 100%)}.avatar{border-color:#f0b90b}' },
    aurora: { zh: '极光', en: 'Aurora',
      vars: '--bg:#0f172a;--card:rgba(255,255,255,.12);--text:#ffffff;--muted:#d6defa;--accent:#a5f3fc;--chip:rgba(255,255,255,.16);--chipText:#ffffff;--border:rgba(255,255,255,.25);--btn:rgba(255,255,255,.10)',
      font: '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
      extra: 'body{background:linear-gradient(135deg,#1e3a8a 0%,#7c3aed 50%,#0ea5e9 100%) fixed}.card{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}' }
  };

  var L = {
    zh: { links: '链接', wallets: '钱包地址', about: '关于我', select: '长按或点选即可复制', made: 'Made with .tape 名片生成器', onchain: '这个页面存放在 TapeOut 链上容器里' },
    en: { links: 'Links', wallets: 'Wallets', about: 'About', select: 'Tap to select & copy', made: 'Made with .tape card generator', onchain: 'This page lives in a TapeOut on-chain container' }
  };

  var ICONS = {
    x: '<path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/>',
    telegram: '<path d="M21.9 4.3 18.8 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.9 13 2.3 11.6c-1-.3-1-1 .2-1.5L20.5 3.2c.8-.3 1.6.2 1.4 1.1z"/>',
    github: '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.6.4-1.1.7-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>',
    website: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4z"/>',
    link: '<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 1 1 4.2 4.2l-2.1 2.1a1 1 0 1 1-1.4-1.4l2.1-2.1a1 1 0 1 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 1 1-4.2-4.2l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a1 1 0 1 0 1.4 1.4L12 10.6a1 1 0 0 1 1.4 0z"/>',
    wallet: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H18a1 1 0 0 1 0 2H5.5a.5.5 0 0 0 0 1H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11zM16.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(k) { return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">' + (ICONS[k] || ICONS.link) + '</svg>'; }

  // 只接受 http(s) 链接；不带协议的自动补 https://
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    if (!/^https?:\/\/[^\s"'<>]+$/i.test(u)) return '';
    return u;
  }
  function handleUrl(kind, v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v) || /\.(com|org|me|io)\//i.test(v)) return safeUrl(v);
    v = v.replace(/^@/, '');
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(v)) return '';
    if (kind === 'x') return 'https://x.com/' + v;
    if (kind === 'telegram') return 'https://t.me/' + v;
    if (kind === 'github') return 'https://github.com/' + v;
    return '';
  }
  function linkText(kind, v, url) {
    v = String(v || '').trim();
    if (kind === 'website') return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (/^https?:\/\//i.test(v)) return url.replace(/^https?:\/\/(www\.)?/i, '');
    return '@' + v.replace(/^@/, '');
  }
  function isEvm(a) { return /^0x[0-9a-fA-F]{40}$/.test(String(a || '').trim()); }
  function isDataImage(s) { return /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(String(s || '')); }
  function initials(name) {
    var n = String(name || '?').trim();
    if (!n) return '?';
    var ch = Array.from(n)[0];
    return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
  }
  function para(text) {
    return String(text || '').trim().split(/\n{2,}/).filter(Boolean).map(function (p) {
      return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function collectLinks(p) {
    var out = [];
    var L0 = p.links || {};
    [['x', 'X'], ['telegram', 'Telegram'], ['github', 'GitHub']].forEach(function (k) {
      var url = handleUrl(k[0], L0[k[0]]);
      if (url) out.push({ kind: k[0], label: k[1], text: linkText(k[0], L0[k[0]], url), url: url });
    });
    var w = safeUrl(L0.website);
    if (w) out.push({ kind: 'website', label: p.lang === 'en' ? 'Website' : '网站', text: linkText('website', L0.website, w), url: w });
    (p.custom || []).forEach(function (c) {
      var u = safeUrl(c && c.url);
      if (u) out.push({ kind: 'link', label: String(c.label || '').trim() || u.replace(/^https?:\/\//, ''), text: u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), url: u });
    });
    return out;
  }

  function render(p) {
    p = p || {};
    var theme = THEMES[p.theme] || THEMES.light;
    var lang = p.lang === 'en' ? 'en' : 'zh';
    var t = L[lang];
    var name = String(p.name || '').trim() || (lang === 'en' ? 'Your name' : '你的名字');
    var links = collectLinks(p);
    var wallets = (p.wallets || []).filter(function (w) { return w && String(w.addr || '').trim(); });
    var tags = (p.tags || []).map(function (s) { return String(s).trim(); }).filter(Boolean).slice(0, 8);
    var avatar = isDataImage(p.avatar)
      ? '<img class="avatar" src="' + p.avatar + '" alt="' + esc(name) + '" width="112" height="112">'
      : '<div class="avatar avatar-txt" aria-hidden="true">' + esc(initials(name)) + '</div>';
    var desc = String(p.bio || '').trim() || name;

    var css = [
      ':root{' + theme.vars + '}',
      '*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}',
      'body{margin:0;min-height:100vh;background:var(--bg);color:var(--text);font-family:' + theme.font + ';line-height:1.65;display:flex;justify-content:center;padding:28px 14px 40px}',
      '.wrap{width:100%;max-width:520px}',
      '.card{background:var(--card);border-radius:22px;padding:32px 22px 26px;box-shadow:0 10px 40px rgba(0,0,0,.08);text-align:center}',
      '.avatar{width:112px;height:112px;border-radius:50%;object-fit:cover;border:3px solid var(--border);display:block;margin:0 auto 14px}',
      '.avatar-txt{display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:700;background:var(--chip);color:var(--chipText)}',
      'h1{font-size:26px;margin:4px 0 6px;line-height:1.3;word-break:break-word}',
      '.bio{color:var(--muted);margin:0 0 14px;font-size:15px;word-break:break-word}',
      '.tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 18px;padding:0;list-style:none}',
      '.tag{background:var(--chip);color:var(--chipText);font-size:13px;padding:3px 12px;border-radius:999px}',
      'h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:22px 0 10px;text-align:left;font-weight:600}',
      '.intro{text-align:left;font-size:15px;word-break:break-word}.intro p{margin:0 0 10px}',
      '.links{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}',
      '.link{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:var(--btn);color:var(--text);text-decoration:none;text-align:left;transition:transform .15s}',
      '.link:hover{transform:translateY(-1px);border-color:var(--accent)}',
      '.link svg{flex:none;color:var(--accent)}.link b{font-weight:600;display:block;font-size:15px}.link small{display:block;color:var(--muted);font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
      '.link span{min-width:0;flex:1}',
      '.wallet{padding:12px 14px;border:1px dashed var(--border);border-radius:14px;text-align:left;margin-bottom:10px;background:var(--btn)}',
      '.wallet b{display:flex;align-items:center;gap:8px;font-size:14px}.wallet b svg{color:var(--accent)}',
      '.wallet code{display:block;margin-top:6px;font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:13px;word-break:break-all;user-select:all;-webkit-user-select:all;cursor:text}',
      '.wallet a{font-size:12px;color:var(--accent)}.hint{font-size:12px;color:var(--muted);margin:-4px 0 6px;text-align:left}',
      'footer{margin-top:18px;text-align:center;font-size:12px;color:var(--muted)}footer a{color:var(--muted)}',
      theme.extra
    ].join('\n');

    var h = [];
    h.push('<!doctype html>');
    h.push('<html lang="' + (lang === 'en' ? 'en' : 'zh-CN') + '">');
    h.push('<head>');
    h.push('<meta charset="utf-8">');
    h.push('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">');
    h.push('<title>' + esc(name) + ' · .tape</title>');
    h.push('<meta name="description" content="' + esc(desc) + '">');
    h.push('<meta name="generator" content=".tape 名片生成器 / tape-card v1">');
    h.push('<style>\n' + css + '\n</style>');
    h.push('</head>');
    h.push('<body>');
    h.push('<main class="wrap"><article class="card">');
    if (p.theme === 'ink') h.push('<span class="seal" aria-hidden="true">' + esc(initials(name)) + '</span>');
    h.push(avatar);
    h.push('<h1>' + esc(name) + '</h1>');
    if (p.bio && String(p.bio).trim()) h.push('<p class="bio">' + esc(String(p.bio).trim()) + '</p>');
    if (tags.length) h.push('<ul class="tags">' + tags.map(function (s) { return '<li class="tag">' + esc(s) + '</li>'; }).join('') + '</ul>');
    if (links.length) {
      h.push('<h2>' + t.links + '</h2><ul class="links">');
      links.forEach(function (l) {
        h.push('<li><a class="link" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + icon(l.kind) +
          '<span><b>' + esc(l.label) + '</b><small>' + esc(l.text) + '</small></span></a></li>');
      });
      h.push('</ul>');
    }
    if (p.intro && String(p.intro).trim()) h.push('<h2>' + t.about + '</h2><div class="intro">' + para(p.intro) + '</div>');
    if (wallets.length) {
      h.push('<h2>' + t.wallets + '</h2><p class="hint">' + t.select + '</p>');
      wallets.forEach(function (w) {
        var a = String(w.addr).trim();
        var lbl = String(w.label || '').trim() || (isEvm(a) ? 'EVM' : (lang === 'en' ? 'Address' : '地址'));
        h.push('<div class="wallet"><b>' + icon('wallet') + esc(lbl) + '</b><code>' + esc(a) + '</code>' +
          (isEvm(a) ? '<a href="https://bscscan.com/address/' + a + '" target="_blank" rel="noopener noreferrer">BscScan ↗</a>' : '') + '</div>');
      });
    }
    h.push('</article>');
    h.push('<footer><div>' + t.onchain + '</div><a href="' + SITE + '" target="_blank" rel="noopener noreferrer">' + t.made + '</a></footer>');
    h.push('</main>');
    h.push('</body>');
    h.push('</html>');
    return h.join('\n') + '\n';
  }

  // 校验输出：不允许任何 <script>、外部样式表、外部图片/字体/iframe 等资源
  function audit(html) {
    var problems = [];
    if (/<script\b/i.test(html)) problems.push('contains <script>');
    if (/<link\b[^>]*rel=["']?stylesheet/i.test(html)) problems.push('external stylesheet');
    if (/<(img|iframe|embed|object|source|video|audio)\b[^>]*\ssrc\s*=\s*(?:"(?!data:)|'(?!data:)|(?!["']|data:))/i.test(html)) problems.push('external media src');
    var css = (html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n') + '\n' +
      (html.match(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi) || []).join('\n');
    if (/@import/i.test(css)) problems.push('@import');
    if (/url\(\s*["']?(?!data:)[^)"'\s]/i.test(css)) problems.push('external url() in CSS');
    if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(html)) problems.push('inline event handler');
    return problems;
  }

  root.TapeCardRender = { render: render, audit: audit, THEMES: THEMES, safeUrl: safeUrl, isEvm: isEvm, esc: esc };
  if (typeof module !== 'undefined') module.exports = root.TapeCardRender;
})(typeof window !== 'undefined' ? window : globalThis);
