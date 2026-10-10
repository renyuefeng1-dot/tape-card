// 端到端测试：填表 → 预览 → 测试网付费（本地注入测试钱包）→ 导出 ZIP / 复制 HTML → 校验导出页无外部脚本/样式
// 测试钱包私钥只在本进程使用，从 .testkeys.json 读取（已 gitignore），不打印。
const { chromium } = require('/workspace/anmao_server/node_modules/playwright-core');
const { ethers } = require('/workspace/anmao_server/node_modules/ethers');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const R = require(path.join(ROOT, 'render.js'));
const RPC = 'https://bsc-testnet-rpc.publicnode.com';
const URL = process.env.URL || 'http://127.0.0.1:8811/';
const PF = '0xCb1f367F716298268Dd0140fa37990541F85559A', BEM = '0xAf81078FA7DF6aF5E5bD97B98a358939600EC320', DEAD = '0x000000000000000000000000000000000000dEaD';
const SHOTS = path.join(ROOT, 'e2e'), SAMPLE = path.join(ROOT, 'sample');
// 每次运行生成一个全新的临时钱包（只存在内存里），由部署者（env PRIVATE_KEY）转一点 tBNB 作 gas
const funderKey = process.env.PRIVATE_KEY;
const results = [];
function ok(name, cond, extra) { results.push([cond ? 'PASS' : 'FAIL', name, extra || '']); console.log(cond ? 'PASS' : 'FAIL', name, extra || ''); }

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC, 97, { staticNetwork: true });
  const w = ethers.Wallet.createRandom().connect(provider);
  const funder = new ethers.Wallet(funderKey, provider);
  const ft = await funder.sendTransaction({ to: w.address, value: ethers.parseEther('0.003'), gasPrice: 1000000000n, type: 0 });
  await ft.wait(); console.log('fresh wallet', w.address, 'funded', ft.hash);
  const erc = new ethers.Contract(BEM, ['function balanceOf(address) view returns (uint256)'], provider);
  const pf = new ethers.Contract(PF, ['function paid(address,bytes32) view returns (bool)', 'function paymentsOf(address) view returns (uint256)'], provider);
  const dead0 = await erc.balanceOf(DEAD), pay0 = await pf.paymentsOf(w.address);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true, locale: 'zh-CN' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL.replace(/\/$/, '') });
  const txs = [];
  await ctx.exposeBinding('__rpc', async (_s, method, params) => {
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [w.address];
    if (method === 'eth_chainId') return '0x61';
    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
    if (method === 'eth_sendTransaction') {
      const tx = params[0];
      const r = await w.sendTransaction({ to: tx.to, data: tx.data, value: tx.value || 0, gasPrice: 1000000000n, type: 0 });
      txs.push(r.hash); console.log('TX', r.hash); return r.hash;
    }
    return provider.send(method, params || []);
  });
  await ctx.addInitScript(() => { window.ethereum = { isMetaMask: true, on() {}, request: ({ method, params }) => window.__rpc(method, params) }; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const ext = [];
  page.on('request', r => { const u = r.url(); if (!u.startsWith(URL) && !u.startsWith('data:') && !u.startsWith('blob:') && !u.includes('bsc-testnet-rpc')) ext.push(u); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' });
  ok('testnet banner shown', (await page.textContent('#testBanner')).includes('测试网演示'));
  await page.click('.tab[data-tab="export"]');
  ok('export locked before payment', await page.isDisabled('#dlZip') && await page.isDisabled('#copyHtml'));
  await page.waitForFunction(() => document.querySelector('#feeLine').textContent.includes('BEM'), null, { timeout: 30000 });
  ok('fee read from chain', (await page.textContent('#feeLine')).includes('0.1 BEM'), (await page.textContent('#feeLine')).slice(0, 40));
  await page.click('.tab[data-tab="edit"]');

  // 填表
  await page.fill('input[name=name]', '山间矿工 Lin');
  await page.fill('input[name=bio]', 'TapeOut 矿工 · 白天写合约，晚上坐禅');
  await page.fill('textarea[name=intro]', '2026 年开始玩 TapeOut，手上两台矿机，正在学 Solidity。\n\n这个页面本身就放在 TapeOut 的链上容器里——链在，页面就在。\n\n（示例数据，不是真人）');
  await page.setInputFiles('#avatarFile', path.join(SAMPLE, 'avatar-demo.png'));
  await page.waitForFunction(() => window.__tapecard.profile.avatar.startsWith('data:image/'), null, { timeout: 10000 });
  const av = await page.evaluate(() => window.__tapecard.profile.avatar.length);
  ok('avatar resized & inlined (<=48KB)', av > 1000 && av <= 48000, av + ' chars');
  await page.fill('input[name=link_x]', '@tape_lin_demo');
  await page.fill('input[name=link_telegram]', '@tape_lin_demo');
  await page.fill('input[name=link_github]', 'tape-lin-demo');
  await page.fill('input[name=link_website]', 'tapeout.link');
  await page.click('#addCustom');
  await page.fill('#customList .sub input >> nth=0', 'TapeNow 排错手册');
  await page.fill('#customList .sub input >> nth=1', 'https://renyuefeng1-dot.github.io/tapenow-guide/');
  await page.click('#addCustom');
  await page.fill('#customList .sub >> nth=1 >> input >> nth=0', 'XSS 测试');
  await page.fill('#customList .sub >> nth=1 >> input >> nth=1', 'javascript:alert(1)');
  await page.click('#addWallet');
  await page.fill('#walletList .sub input >> nth=0', 'BSC（示例地址）');
  await page.fill('#walletList .sub input >> nth=1', '0x000000000000000000000000000000000000dEaD');
  for (const t of ['矿工', '开发者', '禅修者']) await page.click(`#tagPresets .chip:text-is("${t}")`);
  await page.fill('#tagInput', '<b>标签</b>'); await page.press('#tagInput', 'Enter');
  await page.click('.theme[data-theme="ink"]');
  await page.waitForTimeout(300);
  ok('avatar thumbnail shown in form', await page.evaluate(() => document.querySelector('#avatarBox').style.backgroundImage.startsWith('url("data:image/')) && await page.isVisible('#avatarClear'));
  await page.screenshot({ path: path.join(SHOTS, '01_edit_zh.png'), fullPage: true });

  // 预览
  await page.click('.tab[data-tab="preview"]');
  await page.waitForTimeout(400);
  const fr = page.frameLocator('#preview');
  ok('preview shows name', (await fr.locator('h1').textContent()) === '山间矿工 Lin');
  ok('preview escapes tag HTML', (await fr.locator('.tag >> nth=3').textContent()) === '<b>标签</b>');
  ok('javascript: link dropped', !(await page.evaluate(() => window.__tapecard.html)).includes('javascript:'));
  for (const th of ['light', 'dark', 'cyber', 'gold', 'aurora']) {
    await page.click('.tab[data-tab="edit"]'); await page.click(`.theme[data-theme="${th}"]`);
    await page.click('.tab[data-tab="preview"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, `02_preview_${th}.png`) });
  }
  await page.click('.tab[data-tab="edit"]'); await page.click('.theme[data-theme="ink"]');
  await page.click('.tab[data-tab="preview"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '02_preview_ink.png') });

  // 付费
  await page.click('.tab[data-tab="export"]');
  await page.click('#connectBtn');
  await page.waitForSelector('#mintBtn:not([hidden])', { timeout: 30000 });
  ok('wallet connected', (await page.textContent('#connectBtn')).includes('0x'));
  await page.click('#mintBtn');
  await page.waitForFunction(() => document.querySelector('#payStatus').textContent.includes('已领取'), null, { timeout: 90000 });
  ok('mint test BEM', true, txs[txs.length - 1]);
  await page.waitForSelector('#payBtn:not([hidden])', { timeout: 30000 });
  const preHtml = await page.evaluate(() => window.__tapecard.html);
  await page.click('#payBtn');
  await page.waitForFunction(() => /支付成功|取消|失败|error/i.test(document.querySelector('#payStatus').textContent), null, { timeout: 120000 });
  const payText = await page.textContent('#payStatus');
  ok('pay on testnet', payText.includes('支付成功'), payText.slice(0, 60));
  await page.screenshot({ path: path.join(SHOTS, '03_paid_zh.png'), fullPage: true });
  ok('export unlocked after payment', !(await page.isDisabled('#dlZip')));
  const h = ethers.keccak256(ethers.toUtf8Bytes(preHtml));
  ok('on-chain paid(payer, keccak(html))', await pf.paid(w.address, h), h);
  ok('paymentsOf incremented', (await pf.paymentsOf(w.address)) === pay0 + 1n);
  ok('burned 0.05 BEM to dEaD', (await erc.balanceOf(DEAD)) - dead0 === 5000000n, ((await erc.balanceOf(DEAD)) - dead0).toString());

  // 导出 ZIP
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dlZip')]);
  const zipPath = path.join(SAMPLE, 'tape-card-lin-sample.zip');
  await dl.saveAs(zipPath);
  ok('zip filename', dl.suggestedFilename() === 'tape-card-lin.zip', dl.suggestedFilename());
  const list = execSync(`unzip -Z1 ${zipPath}`).toString().trim().split('\n');
  ok('zip root has index.html, few files', list[0] === 'index.html' && list.length <= 3 && list.every(n => !n.includes('/')), list.join(','));
  execSync(`unzip -t ${zipPath}`);
  const size = fs.statSync(zipPath).size;
  ok('zip <= 10 MiB', size <= 10 * 1024 * 1024, (size / 1024).toFixed(1) + ' KB');
  const outDir = path.join(SAMPLE, 'demo'); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir);
  execSync(`unzip -q -o ${zipPath} -d ${outDir}`);
  const out = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  ok('exported html == previewed html', out === preHtml);
  ok('audit: no script/external css/media', R.audit(out).length === 0, R.audit(out).join(','));
  const srcs = [...out.matchAll(/\s(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]);
  const nonAnchorExternal = [...out.matchAll(/<(?:link|script|img|iframe|source|embed|object)\b[^>]*\s(?:src|href)=["'](https?:)?\/\//gi)];
  ok('no external <link>/<script>/<img> URLs', nonAnchorExternal.length === 0);
  ok('footer link present', out.includes('Made with .tape 名片生成器') && out.includes('https://renyuefeng1-dot.github.io/tape-card/'));
  console.log('anchor hrefs:', srcs.filter(s => !s.startsWith('data:')).join(' | '));

  // 复制 HTML
  await page.click('#copyHtml');
  await page.waitForTimeout(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok('copy HTML to clipboard', clip === out, clip.length + ' chars');
  await page.screenshot({ path: path.join(SHOTS, '04_exported_zh.png'), fullPage: true });

  // 英文界面
  await page.click('#langBtn');
  ok('UI switches to English', (await page.textContent('#dlZip')) === 'Download ZIP' && (await page.textContent('#testBanner')).includes('TESTNET'));
  await page.screenshot({ path: path.join(SHOTS, '05_export_en.png'), fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  ok('language remembered', (await page.textContent('#dlZip')) === 'Download ZIP');
  ok('draft persisted', (await page.inputValue('input[name=name]')) === '山间矿工 Lin');
  await page.click('#langBtn');
  ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  ok('app loads no external resources (except RPC)', ext.length === 0, ext.join(','));

  // 导出页在 TapeOut 式 CSP 下渲染（default-src 'none'，脚本禁外链）
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p3 = await ctx3.newPage();
  const csp = [];
  p3.on('console', m => { if (/Content Security Policy|Refused/i.test(m.text())) csp.push(m.text()); });
  await p3.route('http://card.test/', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers: { 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'; img-src data: https:; font-src data: https:" }, body: out }));
  await p3.goto('http://card.test/');
  await p3.waitForTimeout(500);
  ok('renders under strict CSP with no violations', csp.length === 0 && (await p3.textContent('h1')) === '山间矿工 Lin', csp.join(' | ').slice(0, 200));
  await p3.screenshot({ path: path.join(SAMPLE, 'sample-page-mobile.png'), fullPage: true });
  const p4 = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p4.setContent(out); await p4.waitForTimeout(300);
  await p4.screenshot({ path: path.join(SAMPLE, 'sample-page-desktop.png'), fullPage: true });

  // 换一个干净浏览器（没有本地记录），同一钱包连上后应直接从链上识别为已付费
  const ctx6 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' });
  await ctx6.exposeBinding('__rpc', async (_s, method, params) => {
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [w.address];
    if (method === 'eth_chainId') return '0x61';
    if (method === 'wallet_switchEthereumChain') return null;
    return provider.send(method, params || []);
  });
  await ctx6.addInitScript(() => { window.ethereum = { on() {}, request: ({ method, params }) => window.__rpc(method, params) }; });
  const p6 = await ctx6.newPage();
  await p6.goto(URL, { waitUntil: 'networkidle' });
  await p6.click('.tab[data-tab="export"]'); await p6.click('#connectBtn');
  await p6.waitForFunction(() => !document.querySelector('#dlZip').disabled, null, { timeout: 30000 }).catch(() => {});
  ok('paid wallet auto-unlocks on a new device (read from chain)', !(await p6.isDisabled('#dlZip')) && await p6.isHidden('#payBtn'));

  // 推广期免费模式（把 config 的 paymentRequired 改为 false）
  const ctx5 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' });
  await ctx5.route('**/config.js', async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace('paymentRequired: true,', 'paymentRequired: false,') }); });
  const p5 = await ctx5.newPage();
  await p5.goto(URL, { waitUntil: 'networkidle' });
  await p5.click('.tab[data-tab="export"]');
  ok('free mode: export enabled without wallet', !(await p5.isDisabled('#dlZip')) && (await p5.textContent('#testBanner')).includes('推广期免费') && await p5.isHidden('#walletBox'));
  await p5.screenshot({ path: path.join(SHOTS, '06_free_mode.png') });

  await browser.close();
  fs.writeFileSync(path.join(ROOT, 'e2e', 'last-run.txt'), results.map(r => r.join('\t')).join('\n') + '\nTXS ' + txs.join(' ') + '\n');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('E2E ERROR', e.message); process.exit(2); });
