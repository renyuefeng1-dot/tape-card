# .tape 名片生成器（tape-card）

> 填几项信息，生成一个能直接放进 TapeOut 链上容器（DeWeb）的个人主页。
>
> ⚠️ 现在是 **BSC 测试网演示**：导出费用的是测试 BEM，没有价值；合约**未审计**，没有部署到主网。社区工具，非 TapeOut 官方。

- 在线使用：https://renyuefeng1-dot.github.io/tape-card/
- 示例名片（示例数据，不是真人）：https://renyuefeng1-dot.github.io/tape-card/sample/demo/
- English: a static, mobile-first generator for self-contained personal homepages (single `index.html`, no scripts, inline CSS and avatar) ready to publish into a TapeOut DeWeb container via TapeNow. Export is gated by a tiny BEM fee on **BSC testnet** (50% burned). Contract unaudited.

## 功能

- 表单：名字/昵称、头像（上传后自动裁成 240×240 并压缩成 data URI 内联）、一句话简介、详细介绍、链接（X / Telegram / GitHub / 网站 / 最多 3 个自定义）、最多 3 个展示用钱包地址、标签（预设 + 自定义）、6 种风格（简白 / 暗夜 / 水墨禅 / 赛博 / BNB 金 / 极光）、名片语言（中文 / English）。
- 实时预览（手机框，沙箱 iframe）；草稿自动存在本机浏览器；可导入/导出 `tape-card.json` 继续编辑。
- 导出：ZIP（根目录 `index.html` + `tape-card.json`，通常十几 KB，远低于 TapeNow 的 10 MiB / 500 个文件限制）、复制 HTML、只下载 `index.html`。导出前自动检查：没有 `<script>`、没有外部样式表 / 图片 / `@import` / `url()`、没有内联事件。
- 生成的页面**完全不含脚本**，只有你填的链接是普通 `<a>`，所以在 TapeOut 容器的 CSP（`default-src 'none'`、禁止外部脚本）下也能正常显示。页脚带「Made with .tape 名片生成器」链接。
- 应用本身：无 CDN，ethers 本地打包（`ethers.umd.min.js`），中 / EN 切换（记住选择），手机优先。
- 应用内有中文发布指南（项目设置 → 链上发布目标 → CPU Index / Token ID …），并链接排错手册 https://renyuefeng1-dot.github.io/tapenow-guide/

## 付费（测试网）

`config.js` 里 `paymentRequired: true` 时，导出前要付一小笔 BEM；推广期改成 `false` 即可免费（页面会显示「推广期免费」）。

合约 `contracts/src/ProfileFee.sol`：
- `pay(bytes32 profileHash, uint256 maxFee)`：从付款人钱包直接把 `fee × burnBps` 转到 `0x000000000000000000000000000000000000dEaD` 销毁，其余转到部署时写死的 `treasury`；发出 `Paid(payer, profileHash, fee, burned, toTreasury)` 事件。`profileHash` = 名片 `index.html` 的 keccak256，名片内容本身不上链。
- 合约**从不持有代币**，没有任何提币函数；每次只划走当前费用，且不超过付款人自己给的 `maxFee`（防止打包前被调价）。前端只 `approve` 这一笔费用的额度。
- owner 只能在部署时固定的上下限内调 `fee`（0.001 ~ 5 BEM）和 `burnBps`（10% ~ 100%），`token` 和 `treasury` 不可变；Ownable2Step；SafeERC20。
- 解锁规则：每个钱包付一次（链上 `paymentsOf(addr) > 0`），之后换设备、改内容都能导出。注意：这是开源静态网页，付费门槛在浏览器端，懂技术的人可以绕过——它是对工具的支持和 BEM 的消耗场景，不是 DRM。

| 项目 | 值 |
|---|---|
| 网络 | BSC Testnet（chainId 97） |
| ProfileFee | `0xCb1f367F716298268Dd0140fa37990541F85559A` https://testnet.bscscan.com/address/0xCb1f367F716298268Dd0140fa37990541F85559A |
| 源码验证 | Sourcify exact match：https://repo.sourcify.dev/97/0xCb1f367F716298268Dd0140fa37990541F85559A |
| 部署交易 | https://testnet.bscscan.com/tx/0x1affa014f318ba54d29762c863611d1a78509a0a8b06933351b5733ebedde9fd |
| 代币（测试网 MockBEM，8 位小数，任何人可 mint） | `0xAf81078FA7DF6aF5E5bD97B98a358939600EC320` |
| 费用 / 销毁 | 0.1 BEM，50% 销毁 |
| treasury / owner | `0x6Dc951a2fa02B48A4B91e7aD0c7D23666c9f99e4` |
| 主网 BEM（以后用） | `0x5ce033B2bFCa3Af30b3e8C8457DeaF776A8b695a` |

端到端测试的一次真实付款（测试网）：领取测试 BEM https://testnet.bscscan.com/tx/0xcdb497c7facf92786cd64929ab607f4fd7c0023decda36df3da91705305cbe1c · 授权 0.1 BEM https://testnet.bscscan.com/tx/0xc5380722523fccd45faa09341907c3a6aa694f8164b93a298bc8bbb37b7529ec · 支付（0.05 销毁 + 0.05 金库）https://testnet.bscscan.com/tx/0x6e5d0d99a6c65874469624406702a94ab6dafe9a01d8d91cbdaf090ed7d94038

## 测试

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 foundry-rs/forge-std   # 仓库不含 lib/
forge test -vv
```

- Foundry：18 个测试（含 512 轮模糊测试）全部通过——50/50 拆分、合约不留币、无限授权也只扣费用、`maxFee` 防抬价、空哈希、无授权 / 余额不足、多次付款、费用和销毁比例上下限、非 owner 不能改、两步转移 owner、构造参数校验、SafeERC20 拒绝返回 false 的代币、资金守恒。
- 浏览器端到端（`e2e/e2e.cjs`，Playwright + 本地 Chrome，测试网真实交易，每次生成临时钱包）：31 项全部通过——填表 → 头像压缩 → 预览 / XSS 转义 / 丢弃 `javascript:` 链接 → 6 种主题 → 连接钱包 → 领取测试 BEM → 授权 + 支付 → 链上 `paid()` / 销毁 0.05 BEM 核对 → 下载 ZIP（根目录 index.html、≤10 MiB）→ 导出页 = 预览页、无外部脚本/样式/图片 → 复制 HTML → 中/EN 切换并记住 → 严格 CSP 下渲染无报错 → 已付钱包换浏览器自动解锁 → 推广期免费模式。

## 上主网前

1. 请人审计 `ProfileFee.sol`（代码很短，但仍需要第二双眼睛）。
2. treasury 和 owner 换成多签钱包（部署时写死 treasury）。
3. 用真实 BEM `0x5ce0…695a` 部署，在 BscScan 公开源码；`config.js` 填主网合约，`active` 改成 `"bsc"`。
4. 定主网费用（建议先 `paymentRequired: false` 推广，或很小的费用）。
5. 自己把一份名片真实发布进 TapeOut 容器验证一遍（目前 TapeNow BSC 发布 `/chain/prepare` 有 500 报错，等官方修复）。

## 许可

MIT。`ethers.umd.min.js` 版权见 `ethers.LICENSE.md`。
