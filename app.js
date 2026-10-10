// .tape 名片生成器 —— 前端逻辑（无框架、无 CDN）
(function () {
  'use strict';
  var CFG = window.TAPECARD_CONFIG;
  var NET = CFG.networks[CFG.active];
  var R = window.TapeCardRender;
  var $ = function (s) { return document.querySelector(s); };
  var MAX_ZIP = 10 * 1024 * 1024;

  // ---------- 文案 ----------
  var I = {
    zh: {
      title: '名片生成器', tagline: '填几项信息，生成一个放进 TapeOut 链上容器的个人主页。',
      tabEdit: '编辑', tabPreview: '预览', tabExport: '导出',
      secBasic: '基本信息', avatarPick: '上传头像', avatarClear: '移除', avatarHint: '会自动裁成 240×240 并压缩，内联进页面。',
      fName: '名字 / 昵称', fBio: '一句话简介', fIntro: '详细介绍（可选）', phName: '例：小明', phBio: '例：TapeOut 矿工，白天写代码，晚上坐禅', phIntro: '空一行分段',
      secLinks: '链接', fWebsite: '网站', addCustom: '＋ 自定义链接', customLabel: '名称', customUrl: 'https://…',
      secWallets: '展示的钱包地址', walletHint: '只展示，页面不会连接钱包。不要填私钥或助记词！', addWallet: '＋ 添加地址', walletLabel: '备注（如 BSC 主钱包）', walletAddr: '0x…',
      secTags: '标签（可选）', phTag: '自定义标签，回车添加', add: '添加',
      secStyle: '风格', fLang: '名片语言',
      loadSample: '填入示例', importJson: '导入 tape-card.json', reset: '清空', confirmReset: '确定清空所有内容？',
      livePreview: '实时预览', exportTitle: '导出',
      connect: '连接钱包', connected: '已连接', mint: '领取 100 测试 BEM',
      dlZip: '下载 ZIP', copyHtml: '复制 HTML', dlHtml: '只下载 index.html',
      guideTitle: '怎么发布到 TapeOut', guideMore: '卡住了？看排错手册：', aboutTitle: '关于付费',
      footNote: '社区工具 · 非 TapeOut 官方 · 开源',
      bannerTest: '测试网演示：付款用的是 BSC 测试网的测试 BEM，没有价值；合约未审计。',
      bannerFree: '推广期免费：现在导出不用付费。',
      feeLine: function (f, b) { return '导出费 <b>' + f + ' BEM</b>，其中 ' + b + '% 直接销毁（转入 0x…dEaD），其余进项目金库。每个钱包付一次，之后可以随时修改、反复导出。'; },
      feeFree: '推广期免费导出，不用连钱包。', feeLoading: '正在读取链上费用…', feeErr: '读取链上费用失败，稍后刷新再试。',
      payBtn: function (f) { return '支付 ' + f + ' BEM 解锁导出'; },
      unlocked: '已解锁：这个钱包已付过费，可以随时导出。',
      needPay: '先连接钱包并支付导出费，才能下载或复制。', noWallet: '没检测到钱包。请用 MetaMask / OKX / Binance Web3 等钱包的内置浏览器打开本页。',
      wrongChain: '正在切换到 ', approving: '第 1 步：授权本次费用（只授权 ', approving2: ' BEM）…', paying: '第 2 步：支付并上链登记…',
      paid: '支付成功！导出已解锁。', rejected: '你在钱包里取消了。', lowBal: '测试 BEM 不够，先点「领取 100 测试 BEM」。', lowGas: '钱包里没有 tBNB 付 gas，去水龙头领一点：',
      minting: '正在领取测试 BEM…', minted: '已领取 100 测试 BEM。', balance: '余额', txApprove: '授权交易', txPay: '支付交易', txMint: '领取交易',
      copied: '已复制 HTML，可以直接粘贴使用。', copyFail: '复制失败，请改用「只下载 index.html」。', downloaded: '已生成：',
      chkTop: 'ZIP 根目录就是 index.html', chkSize: '大小 ', chkFiles: '文件数 ', chkNoScript: '没有 <script>、外部样式、外部图片（CSP 安全）', chkBad: '发现问题：',
      imported: '已导入。', importErr: '导入失败：不是有效的 tape-card.json', avatarErr: '读取图片失败', saved: '草稿已自动保存在本机浏览器',
      tagPresets: ['矿工', '开发者', '内容创作者', '投资者', '设计师', '社区志愿者', '禅修者'],
      guide: [
        '支付后点「下载 ZIP」。ZIP 第一层就是 <code>index.html</code>，不要解压后再套一层文件夹。',
        '打开 TapeNow（<a href="https://app.tapenow.dev" target="_blank" rel="noopener">https://app.tapenow.dev</a>），登录 → 新建项目 → 导入这个 ZIP 作为构建包 → 私有预览看一眼（这几步免费）。',
        '<b>项目设置 → 链上发布目标</b>：选你芯片所在的链（BSC / X Layer / Base），填 <b>CPU Index</b>（处理器编号）和 <b>Token ID</b>（芯片编号），点「保存目标」。',
        '回到部署详情：「发布检查」→ 勾选确认 →「确认本次发布」→ 展开「链上发布」→「生成发布计划」→ 钱包逐步签名。预算显示 OKB 说明链选成了 X Layer。',
        '读回核验、激活访问入口后，打开 <code>https://tapeout.link/芯片编号.处理器编号.tape</code> 看看效果。',
        '需要先有一颗 TapeOut 芯片和开通的电路容器；钱包里留一点对应链的原生币付 gas。'
      ],
      about: [
        '付款走链上合约 ProfileFee：导出费的 50% 转入 0x…dEaD 永久销毁，其余转入部署时写死的金库地址。',
        '合约不保管任何代币，每次只划走当时的费用（不超过你确认的金额），我们只授权这一笔的额度。',
        '合约会记录「谁为哪个名片付了费」（名片内容的哈希），名片内容本身不上链。',
        '名片页面里没有任何脚本，也不会连接访客的钱包。',
        '这是开源的网页工具，付费是对工具的支持，不是安全保证；现在是测试网演示，合约未审计。'
      ],
      contract: '合约', token: '代币'
    },
    en: {
      title: 'Card Generator', tagline: 'Fill in a few fields and get a personal homepage ready for a TapeOut on-chain container.',
      tabEdit: 'Edit', tabPreview: 'Preview', tabExport: 'Export',
      secBasic: 'Basics', avatarPick: 'Upload avatar', avatarClear: 'Remove', avatarHint: 'Auto-cropped to 240×240, compressed and inlined.',
      fName: 'Name / nickname', fBio: 'One-line bio', fIntro: 'Longer intro (optional)', phName: 'e.g. Alex', phBio: 'e.g. TapeOut miner. Code by day, zen by night.', phIntro: 'Blank line = new paragraph',
      secLinks: 'Links', fWebsite: 'Website', addCustom: '+ Custom link', customLabel: 'Label', customUrl: 'https://…',
      secWallets: 'Wallet addresses to show', walletHint: 'Display only — the page never connects a wallet. Never enter a private key or seed phrase!', addWallet: '+ Add address', walletLabel: 'Label (e.g. BSC main)', walletAddr: '0x…',
      secTags: 'Tags (optional)', phTag: 'Custom tag, press Enter', add: 'Add',
      secStyle: 'Style', fLang: 'Card language',
      loadSample: 'Load sample', importJson: 'Import tape-card.json', reset: 'Clear', confirmReset: 'Clear everything?',
      livePreview: 'Live preview', exportTitle: 'Export',
      connect: 'Connect wallet', connected: 'Connected', mint: 'Get 100 test BEM',
      dlZip: 'Download ZIP', copyHtml: 'Copy HTML', dlHtml: 'Download index.html only',
      guideTitle: 'How to publish on TapeOut', guideMore: 'Stuck? Troubleshooting guide (Chinese):', aboutTitle: 'About the fee',
      footNote: 'Community tool · not official TapeOut · open source',
      bannerTest: 'TESTNET DEMO: payments use worthless test BEM on BSC testnet; contract unaudited.',
      bannerFree: 'Free during promotion: export costs nothing right now.',
      feeLine: function (f, b) { return 'Export fee <b>' + f + ' BEM</b>; ' + b + '% is burned (sent to 0x…dEaD), the rest goes to the project treasury. Pay once per wallet, then edit and export any time.'; },
      feeFree: 'Free export during promotion — no wallet needed.', feeLoading: 'Reading fee from chain…', feeErr: 'Could not read the fee from chain. Refresh and try again.',
      payBtn: function (f) { return 'Pay ' + f + ' BEM to unlock export'; },
      unlocked: 'Unlocked: this wallet has paid, export any time.',
      needPay: 'Connect a wallet and pay the export fee to download or copy.', noWallet: 'No wallet found. Open this page in the in-app browser of MetaMask / OKX / Binance Web3 etc.',
      wrongChain: 'Switching to ', approving: 'Step 1: approving this fee only (', approving2: ' BEM)…', paying: 'Step 2: paying and recording on-chain…',
      paid: 'Paid! Export unlocked.', rejected: 'You cancelled in the wallet.', lowBal: 'Not enough test BEM — tap “Get 100 test BEM” first.', lowGas: 'No tBNB for gas. Get some from the faucet:',
      minting: 'Minting test BEM…', minted: 'Got 100 test BEM.', balance: 'Balance', txApprove: 'Approve tx', txPay: 'Pay tx', txMint: 'Mint tx',
      copied: 'HTML copied.', copyFail: 'Copy failed — use “Download index.html only”.', downloaded: 'Generated: ',
      chkTop: 'index.html sits at the ZIP root', chkSize: 'Size ', chkFiles: 'Files ', chkNoScript: 'No <script>, external CSS or external images (CSP-safe)', chkBad: 'Problems: ',
      imported: 'Imported.', importErr: 'Import failed: not a valid tape-card.json', avatarErr: 'Could not read the image', saved: 'Draft auto-saved in this browser',
      tagPresets: ['Miner', 'Developer', 'Creator', 'Investor', 'Designer', 'Community', 'Zen'],
      guide: [
        'After paying, tap “Download ZIP”. The ZIP root is <code>index.html</code> — do not re-zip it inside another folder.',
        'Open TapeNow (<a href="https://app.tapenow.dev" target="_blank" rel="noopener">https://app.tapenow.dev</a>), sign in → new project → import this ZIP as the build → check the private preview (all free).',
        '<b>Project settings → On-chain publish target</b>: pick the chain your chip is on (BSC / X Layer / Base), fill <b>CPU Index</b> and <b>Token ID</b>, then “Save target”.',
        'Back in deployment details: “Release check” → tick confirm → “Confirm release” → “On-chain publish” → “Generate publish plan” → sign each step. A budget in OKB means you picked X Layer.',
        'After read-back verification and activating the access entry, open <code>https://tapeout.link/TOKENID.CPUINDEX.tape</code>.',
        'You need a TapeOut chip with an opened circuit container, plus a little native coin for gas.'
      ],
      about: [
        'Payment goes through the ProfileFee contract: 50% of the fee is sent to 0x…dEaD and burned forever, the rest to a treasury fixed at deploy.',
        'The contract never holds tokens and only pulls the current fee (never more than the amount you confirm); we only approve that one fee.',
        'The contract records who paid for which card (a hash of the page). Your card content itself is not stored on-chain.',
        'Generated pages contain no scripts and never connect a visitor’s wallet.',
        'This is an open-source web tool; the fee supports the tool, it is not a security guarantee. Testnet demo, contract unaudited.'
      ],
      contract: 'Contract', token: 'Token'
    }
  };
  var lang = localStorage.getItem('tapecard.lang') || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 || !navigator.language ? 'zh' : 'en');
  function T(k) { return I[lang][k]; }

  // ---------- 状态 ----------
  var EMPTY = { v: 1, name: '', bio: '', intro: '', avatar: '', links: { x: '', telegram: '', github: '', website: '' }, custom: [], wallets: [], tags: [], theme: 'ink', lang: 'zh' };
  var SAMPLE = {
    v: 1, name: '山间矿工 Lin', bio: 'TapeOut 矿工 · 白天写合约，晚上坐禅',
    intro: '2026 年开始玩 TapeOut，手上两台矿机，正在学 Solidity。\n\n喜欢把链上的东西讲成大白话。这个页面本身就放在 TapeOut 的链上容器里——链在，页面就在。\n\n（示例数据，不是真人）',
    avatar: '', links: { x: '@tape_lin_demo', telegram: '@tape_lin_demo', github: 'tape-lin-demo', website: 'https://tapeout.link' },
    custom: [{ label: 'TapeNow 排错手册', url: 'https://renyuefeng1-dot.github.io/tapenow-guide/' }],
    wallets: [{ label: 'BSC（示例地址）', addr: '0x000000000000000000000000000000000000dEaD' }],
    tags: ['矿工', '开发者', '禅修者'], theme: 'ink', lang: 'zh'
  };
  var profile = load();
  var acct = null, signer = null, bp = null, fee = null, burnBps = null, unlocked = !CFG.paymentRequired;
  var readProv = new ethers.JsonRpcProvider(NET.rpcUrl, NET.chainId, { staticNetwork: true });
  var ABI_PF = ['function fee() view returns (uint256)', 'function burnBps() view returns (uint16)', 'function paymentsOf(address) view returns (uint256)', 'function pay(bytes32 profileHash, uint256 maxFee)', 'function paid(address,bytes32) view returns (bool)'];
  var ABI_T = ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)', 'function mint(address,uint256)'];

  function load() {
    try { var p = JSON.parse(localStorage.getItem('tapecard.draft')); if (p && p.v === 1) return normalize(p); } catch (e) {}
    return normalize(JSON.parse(JSON.stringify(EMPTY)));
  }
  function normalize(p) {
    var o = JSON.parse(JSON.stringify(EMPTY));
    ['name', 'bio', 'intro', 'avatar', 'theme', 'lang'].forEach(function (k) { if (typeof p[k] === 'string') o[k] = p[k]; });
    if (p.links) Object.keys(o.links).forEach(function (k) { if (typeof p.links[k] === 'string') o.links[k] = p.links[k]; });
    if (Array.isArray(p.custom)) o.custom = p.custom.slice(0, 3).map(function (c) { return { label: String(c.label || ''), url: String(c.url || '') }; });
    if (Array.isArray(p.wallets)) o.wallets = p.wallets.slice(0, 3).map(function (w) { return { label: String(w.label || ''), addr: String(w.addr || '') }; });
    if (Array.isArray(p.tags)) o.tags = p.tags.slice(0, 8).map(String);
    if (!R.THEMES[o.theme]) o.theme = 'ink';
    if (o.lang !== 'en') o.lang = 'zh';
    if (o.avatar && !/^data:image\/(png|jpeg|webp|gif);base64,/.test(o.avatar)) o.avatar = '';
    return o;
  }
  function save() { try { localStorage.setItem('tapecard.draft', JSON.stringify(profile)); } catch (e) {} }

  // ---------- 小工具 ----------
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600); }
  function status(el, html, cls) { el.innerHTML = html; el.className = 'status' + (cls ? ' ' + cls : ''); }
  function txLink(label, h) { return label + ': <a href="' + NET.explorer + '/tx/' + h + '" target="_blank" rel="noopener">' + NET.explorer + '/tx/' + h + '</a>'; }
  function fmt(v) { return ethers.formatUnits(v, NET.decimals).replace(/\.0$/, ''); }
  function errMsg(e) {
    if (!e) return 'error';
    if (e.code === 'ACTION_REJECTED' || e.code === 4001 || (e.info && e.info.error && e.info.error.code === 4001)) return T('rejected');
    var m = (e.shortMessage || e.reason || e.message || String(e));
    if (/insufficient funds/i.test(m)) return T('lowGas') + ' <a href="' + NET.faucet + '" target="_blank" rel="noopener">' + NET.faucet + '</a>';
    return R.esc(m.slice(0, 200));
  }

  // ---------- 渲染表单 ----------
  function applyI18n() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-i]').forEach(function (el) { var v = T(el.getAttribute('data-i')); if (typeof v === 'string') el.textContent = v; });
    document.querySelectorAll('[data-ph]').forEach(function (el) { el.placeholder = T(el.getAttribute('data-ph')); });
    $('#guideList').innerHTML = T('guide').map(function (s) { return '<li>' + s + '</li>'; }).join('');
    $('#aboutList').innerHTML = T('about').map(function (s) { return '<li>' + s + '</li>'; }).join('');
    $('#guideLink').href = CFG.guideUrl; $('#guideLink').textContent = CFG.guideUrl;
    $('#contractLine').innerHTML = NET.contract ? (T('contract') + ' ProfileFee: <a href="' + NET.explorer + '/address/' + NET.contract + '" target="_blank" rel="noopener">' + NET.contract + '</a><br>' + T('token') + ' BEM: ' + NET.token) : '';
    var b = $('#testBanner');
    if (!CFG.paymentRequired) { b.hidden = false; b.className = 'banner free'; b.textContent = T('bannerFree') + (NET.testnet ? ' · ' + T('bannerTest') : ''); }
    else if (NET.testnet) { b.hidden = false; b.className = 'banner'; b.textContent = T('bannerTest'); }
    else b.hidden = true;
    renderLists(); renderTags(); renderThemes(); renderFee(); renderWallet();
  }

  function fillForm() {
    var f = $('#form');
    f.name.value = profile.name; f.bio.value = profile.bio; f.intro.value = profile.intro; f.lang.value = profile.lang;
    ['x', 'telegram', 'github', 'website'].forEach(function (k) { f['link_' + k].value = profile.links[k] || ''; });
    renderAvatar(); renderLists(); renderTags(); renderThemes();
  }

  function renderAvatar() {
    var box = $('#avatarBox');
    if (profile.avatar) { box.style.backgroundImage = 'url("' + profile.avatar + '")'; box.textContent = ''; $('#avatarClear').hidden = false; }
    else { box.style.backgroundImage = ''; box.textContent = (Array.from(profile.name.trim())[0] || '?').toUpperCase(); $('#avatarClear').hidden = true; }
  }

  function subRow(list, i, a, b, pa, pb, onDel) {
    var d = document.createElement('div'); d.className = 'sub';
    var x = document.createElement('input'); x.value = list[i][a]; x.placeholder = pa; x.maxLength = 40;
    var y = document.createElement('input'); y.value = list[i][b]; y.placeholder = pb; y.maxLength = 200;
    var z = document.createElement('button'); z.type = 'button'; z.className = 'ghost'; z.textContent = '✕'; z.setAttribute('aria-label', 'remove');
    x.oninput = function () { list[i][a] = x.value; changed(); };
    y.oninput = function () { list[i][b] = y.value; changed(); };
    z.onclick = function () { list.splice(i, 1); onDel(); changed(); };
    d.appendChild(x); d.appendChild(y); d.appendChild(z);
    return d;
  }
  function renderLists() {
    var c = $('#customList'); c.innerHTML = '';
    profile.custom.forEach(function (_, i) { c.appendChild(subRow(profile.custom, i, 'label', 'url', T('customLabel'), T('customUrl'), renderLists)); });
    $('#addCustom').disabled = profile.custom.length >= 3;
    var w = $('#walletList'); w.innerHTML = '';
    profile.wallets.forEach(function (_, i) { w.appendChild(subRow(profile.wallets, i, 'label', 'addr', T('walletLabel'), T('walletAddr'), renderLists)); });
    $('#addWallet').disabled = profile.wallets.length >= 3;
  }
  function renderTags() {
    var box = $('#tagPresets'); box.innerHTML = '';
    var all = T('tagPresets').slice();
    profile.tags.forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); });
    all.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (profile.tags.indexOf(t) >= 0 ? ' on' : ''); b.textContent = t;
      b.onclick = function () { var k = profile.tags.indexOf(t); if (k >= 0) profile.tags.splice(k, 1); else if (profile.tags.length < 8) profile.tags.push(t); renderTags(); changed(); };
      box.appendChild(b);
    });
  }
  var SW = { light: 'linear-gradient(90deg,#f5f5f2,#fff 60%,#2563eb)', dark: 'linear-gradient(90deg,#0b0e13,#151a22 60%,#f0b90b)', ink: 'radial-gradient(circle at 30% 40%,#555,#efe9dc 60%),#efe9dc', cyber: 'linear-gradient(90deg,#05010f,#00f0ff,#ff2bd6)', gold: 'linear-gradient(90deg,#fff8e7,#f0b90b)', aurora: 'linear-gradient(90deg,#1e3a8a,#7c3aed,#0ea5e9)' };
  function renderThemes() {
    var box = $('#themeList'); box.innerHTML = '';
    Object.keys(R.THEMES).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'theme' + (profile.theme === k ? ' on' : ''); b.dataset.theme = k;
      b.innerHTML = '<i style="background:' + SW[k] + '"></i><span>' + R.THEMES[k][lang] + '</span>';
      b.onclick = function () { profile.theme = k; renderThemes(); changed(); };
      box.appendChild(b);
    });
  }

  // ---------- 预览 ----------
  var html = '', rt = null;
  function changed() { save(); clearTimeout(rt); rt = setTimeout(updatePreview, 120); }
  function updatePreview() {
    html = R.render(profile);
    $('#preview').srcdoc = html;
    var n = new TextEncoder().encode(html).length;
    $('#sizeInfo').textContent = 'index.html · ' + (n / 1024).toFixed(1) + ' KB';
    renderAvatar();
  }

  function bindForm() {
    var f = $('#form');
    ['name', 'bio', 'intro'].forEach(function (k) { f[k].addEventListener('input', function () { profile[k] = f[k].value; changed(); }); });
    f.lang.addEventListener('change', function () { profile.lang = f.lang.value; changed(); });
    ['x', 'telegram', 'github', 'website'].forEach(function (k) { f['link_' + k].addEventListener('input', function () { profile.links[k] = f['link_' + k].value; changed(); }); });
    $('#addCustom').onclick = function () { if (profile.custom.length < 3) { profile.custom.push({ label: '', url: '' }); renderLists(); changed(); } };
    $('#addWallet').onclick = function () { if (profile.wallets.length < 3) { profile.wallets.push({ label: '', addr: '' }); renderLists(); changed(); } };
    function addTag() { var v = $('#tagInput').value.trim().slice(0, 16); if (v && profile.tags.indexOf(v) < 0 && profile.tags.length < 8) { profile.tags.push(v); renderTags(); changed(); } $('#tagInput').value = ''; }
    $('#tagAdd').onclick = addTag;
    $('#tagInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
    $('#avatarFile').addEventListener('change', function () { var file = this.files[0]; this.value = ''; if (file) resizeAvatar(file); });
    $('#avatarClear').onclick = function () { profile.avatar = ''; changed(); $('#avatarInfo').textContent = T('avatarHint'); };
    $('#loadSample').onclick = function () { profile = normalize(JSON.parse(JSON.stringify(SAMPLE))); if (lang === 'en') { profile.lang = 'en'; } fillForm(); changed(); };
    $('#resetBtn').onclick = function () { if (confirm(T('confirmReset'))) { profile = normalize(JSON.parse(JSON.stringify(EMPTY))); fillForm(); changed(); } };
    $('#importFile').addEventListener('change', function () {
      var file = this.files[0]; this.value = ''; if (!file) return;
      file.text().then(function (txt) { var p = JSON.parse(txt); if (!p || p.v !== 1) throw new Error('bad'); profile = normalize(p); fillForm(); changed(); toast(T('imported')); })
        .catch(function () { toast(T('importErr')); });
    });
  }

  function resizeAvatar(file) {
    var url = URL.createObjectURL(file); var img = new Image();
    img.onload = function () {
      var S = 240, c = document.createElement('canvas'); c.width = S; c.height = S;
      var s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2;
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S); ctx.drawImage(img, sx, sy, s, s, 0, 0, S, S);
      URL.revokeObjectURL(url);
      var d = '', q = 0.85;
      for (var i = 0; i < 6; i++) {
        d = c.toDataURL('image/webp', q);
        if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/jpeg', q);
        if (d.length <= 48000) break; q -= 0.12;
      }
      profile.avatar = d; changed();
      $('#avatarInfo').textContent = '240×240 · ' + (d.length / 1024).toFixed(1) + ' KB';
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast(T('avatarErr')); };
    img.src = url;
  }

  // ---------- 钱包 / 付费 ----------
  function renderFee() {
    var el = $('#feeLine');
    if (!CFG.paymentRequired) { el.innerHTML = T('feeFree'); return; }
    if (fee === false) { el.textContent = T('feeErr'); return; }
    if (fee === null) { el.textContent = T('feeLoading'); return; }
    el.innerHTML = T('feeLine')(fmt(fee), (burnBps / 100).toString());
  }
  function renderWallet() {
    var pay = $('#payBtn');
    $('#walletBox').hidden = !CFG.paymentRequired;
    $('#connectBtn').textContent = acct ? T('connected') + ' ' + acct.slice(0, 6) + '…' + acct.slice(-4) : T('connect');
    $('#mintBtn').hidden = !(acct && NET.testnet);
    pay.hidden = !(acct && !unlocked && fee);
    if (fee) pay.textContent = T('payBtn')(fmt(fee));
    ['#dlZip', '#copyHtml', '#dlHtml'].forEach(function (s) { $(s).disabled = !unlocked; });
    var es = $('#exportStatus');
    if (CFG.paymentRequired && !unlocked && !es.dataset.sticky) status(es, T('needPay'));
    if (CFG.paymentRequired && unlocked && acct && !es.dataset.sticky) status(es, T('unlocked'), 'ok');
  }
  function loadFee() {
    if (!CFG.paymentRequired || !NET.contract) return;
    var c = new ethers.Contract(NET.contract, ABI_PF, readProv);
    Promise.all([c.fee(), c.burnBps()]).then(function (r) { fee = r[0]; burnBps = Number(r[1]); renderFee(); renderWallet(); })
      .catch(function () { fee = false; $('#feeLine').textContent = T('feeErr'); });
  }
  async function refreshAcct() {
    if (!acct) return;
    var t = new ethers.Contract(NET.token, ABI_T, readProv);
    var c = new ethers.Contract(NET.contract, ABI_PF, readProv);
    try {
      var r = await Promise.all([t.balanceOf(acct), c.paymentsOf(acct)]);
      $('#acctLine').textContent = T('balance') + ': ' + fmt(r[0]) + ' BEM' + (NET.testnet ? ' (testnet)' : '');
      if (r[1] > 0n) unlocked = true;
    } catch (e) {}
    if (localStorage.getItem('tapecard.paid.' + NET.chainId + '.' + acct.toLowerCase())) unlocked = true;
    renderWallet();
  }
  async function ensureChain() {
    var id = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(id, 16) === NET.chainId) return;
    status($('#payStatus'), T('wrongChain') + NET.chainName + '…');
    var hex = '0x' + NET.chainId.toString(16);
    try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] }); }
    catch (e) {
      if (e && (e.code === 4902 || /Unrecognized|not added/i.test(e.message || ''))) {
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: hex, chainName: NET.chainName, rpcUrls: [NET.rpcUrl], blockExplorerUrls: [NET.explorer], nativeCurrency: { name: NET.nativeSymbol, symbol: NET.nativeSymbol, decimals: 18 } }] });
      } else throw e;
    }
  }
  async function connect() {
    if (!window.ethereum) { status($('#payStatus'), T('noWallet'), 'err'); return; }
    try {
      var accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureChain();
      bp = new ethers.BrowserProvider(window.ethereum, 'any');
      signer = await bp.getSigner();
      acct = ethers.getAddress(accs[0]);
      status($('#payStatus'), '');
      await refreshAcct();
      if (window.ethereum.on) window.ethereum.on('accountsChanged', function (a) { acct = a && a[0] ? ethers.getAddress(a[0]) : null; unlocked = !CFG.paymentRequired; bp && bp.getSigner().then(function (s) { signer = s; }); $('#exportStatus').dataset.sticky = ''; refreshAcct(); renderWallet(); });
    } catch (e) { status($('#payStatus'), errMsg(e), 'err'); }
    renderWallet();
  }
  async function mint() {
    var st = $('#payStatus'); $('#mintBtn').disabled = true;
    try {
      await ensureChain();
      status(st, T('minting'));
      var t = new ethers.Contract(NET.token, ABI_T, signer);
      var tx = await t.mint(acct, ethers.parseUnits(NET.mintAmount, NET.decimals));
      await tx.wait();
      status(st, T('minted') + '<br>' + txLink(T('txMint'), tx.hash), 'ok');
      await refreshAcct();
    } catch (e) { status(st, errMsg(e), 'err'); }
    $('#mintBtn').disabled = false;
  }
  async function pay() {
    var st = $('#payStatus'), btn = $('#payBtn'); btn.disabled = true;
    var links = [];
    try {
      await ensureChain();
      var f = await new ethers.Contract(NET.contract, ABI_PF, readProv).fee(); fee = f;
      var t = new ethers.Contract(NET.token, ABI_T, signer);
      var bal = await t.balanceOf(acct);
      if (bal < f) { status(st, T('lowBal'), 'err'); btn.disabled = false; return; }
      var allow = await t.allowance(acct, NET.contract);
      if (allow < f) {
        status(st, T('approving') + fmt(f) + T('approving2'));
        var a = await t.approve(NET.contract, f); links.push(txLink(T('txApprove'), a.hash));
        status(st, T('approving') + fmt(f) + T('approving2') + '<br>' + links.join('<br>'));
        await a.wait();
      }
      updatePreview();
      var h = ethers.keccak256(ethers.toUtf8Bytes(html));
      status(st, T('paying') + '<br>' + links.join('<br>'));
      var c = new ethers.Contract(NET.contract, ABI_PF, signer);
      var tx = await c.pay(h, f); links.push(txLink(T('txPay'), tx.hash));
      status(st, T('paying') + '<br>' + links.join('<br>'));
      var rc = await tx.wait();
      if (!rc || rc.status !== 1) throw new Error('tx failed');
      localStorage.setItem('tapecard.paid.' + NET.chainId + '.' + acct.toLowerCase(), JSON.stringify({ tx: tx.hash, hash: h, at: Date.now() }));
      unlocked = true; renderWallet();
      status(st, T('paid') + '<br>' + links.join('<br>'), 'ok');
      await refreshAcct();
    } catch (e) { status(st, errMsg(e) + (links.length ? '<br>' + links.join('<br>') : ''), 'err'); }
    btn.disabled = false; renderWallet();
  }

  // ---------- 导出 ----------
  function slug() {
    var s = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    return s || 'profile';
  }
  function exportFiles() {
    updatePreview();
    var json = JSON.stringify(profile, null, 2);
    return [{ name: 'index.html', data: html }, { name: 'tape-card.json', data: json }];
  }
  function showChecks(zipBytes, files) {
    var bad = R.audit(html);
    var rows = [];
    rows.push('<div>' + T('chkTop') + '</div>');
    rows.push('<div' + (zipBytes > MAX_ZIP ? ' class="bad"' : '') + '>' + T('chkSize') + (zipBytes / 1024).toFixed(1) + ' KB ≤ 10 MiB</div>');
    rows.push('<div>' + T('chkFiles') + files + ' ≤ 500</div>');
    rows.push(bad.length ? '<div class="bad">' + T('chkBad') + R.esc(bad.join(', ')) + '</div>' : '<div>' + R.esc(T('chkNoScript')) + '</div>');
    $('#checks').innerHTML = rows.join('');
  }
  function download(name, bytes, type) {
    var blob = new Blob([bytes], { type: type });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function guard() { if (!unlocked) { status($('#exportStatus'), T('needPay'), 'err'); return false; } return true; }
  function bindExport() {
    $('#dlZip').onclick = function () {
      if (!guard()) return;
      var files = exportFiles(); var z = TapeZip.makeZip(files);
      showChecks(z.length, files.length);
      if (z.length > MAX_ZIP) return;
      var name = 'tape-card-' + slug() + '.zip';
      download(name, z, 'application/zip');
      var es = $('#exportStatus'); es.dataset.sticky = '1'; status(es, T('downloaded') + name, 'ok');
    };
    $('#dlHtml').onclick = function () {
      if (!guard()) return;
      exportFiles(); showChecks(new TextEncoder().encode(html).length, 1);
      download('index.html', new TextEncoder().encode(html), 'text/html');
      var es = $('#exportStatus'); es.dataset.sticky = '1'; status(es, T('downloaded') + 'index.html', 'ok');
    };
    $('#copyHtml').onclick = function () {
      if (!guard()) return;
      exportFiles(); showChecks(new TextEncoder().encode(html).length, 1);
      var es = $('#exportStatus'); es.dataset.sticky = '1';
      var done = function () { status(es, T('copied'), 'ok'); toast(T('copied')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(html).then(done, fallback); else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = html; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? done() : status(es, T('copyFail'), 'err'); } catch (e) { status(es, T('copyFail'), 'err'); }
        ta.remove();
      }
    };
  }

  // ---------- 标签页（手机） ----------
  function bindTabs() {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
        document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('show', p.id === 'pane-' + b.dataset.tab); });
        window.scrollTo(0, 0);
      };
    });
    $('#pane-edit').classList.add('show');
  }

  $('#langBtn').onclick = function () { lang = lang === 'zh' ? 'en' : 'zh'; localStorage.setItem('tapecard.lang', lang); applyI18n(); };
  $('#connectBtn').onclick = connect;
  $('#mintBtn').onclick = mint;
  $('#payBtn').onclick = pay;
  bindTabs(); bindForm(); bindExport(); fillForm(); applyI18n(); updatePreview(); loadFee();
  window.__tapecard = { get html() { return html; }, get unlocked() { return unlocked; }, get profile() { return profile; } };
})();
