// .tape 名片生成器配置
// paymentRequired: true = 导出前需要先在链上付一小笔 BEM；推广期想免费，改成 false 即可（页面会显示「推广期免费」）。
// active: 默认 BSC 主网（真实 BEM）。在网址后加 ?net=testnet 可切回 BSC 测试网演示（测试 BEM，可领取）。
window.TAPECARD_CONFIG = {
  paymentRequired: true,
  active: (/[?&]net=testnet\b/.test(location.search) ? "bscTestnet" : "bsc"),
  siteUrl: "https://renyuefeng1-dot.github.io/tape-card/",
  guideUrl: "https://renyuefeng1-dot.github.io/tapenow-guide/",
  networks: {
    bscTestnet: {
      testnet: true,
      chainId: 97,
      chainName: "BNB Smart Chain Testnet",
      rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
      explorer: "https://testnet.bscscan.com",
      nativeSymbol: "tBNB",
      faucet: "https://www.bnbchain.org/en/testnet-faucet",
      contract: "0xCb1f367F716298268Dd0140fa37990541F85559A", // ProfileFee（测试网）
      token: "0xAf81078FA7DF6aF5E5bD97B98a358939600EC320",    // 测试网 MockBEM（8 位小数，任何人可 mint）
      decimals: 8,
      mintAmount: "100" // 「领取测试 BEM」每次领取数量
    },
    bsc: {
      testnet: false,
      chainId: 56,
      chainName: "BNB Smart Chain",
      rpcUrl: "https://bsc-dataseed.bnbchain.org",
      explorer: "https://bscscan.com",
      nativeSymbol: "BNB",
      contract: "0x9777F9037DAaAeA79f787B0d8bB5fC2EF2ebF4F6", // ProfileFee（主网，2026-10-10 部署，Sourcify 已验证）
      token: "0x5ce033B2bFCa3Af30b3e8C8457DeaF776A8b695a", // 真实 BEM
      decimals: 8
    }
  }
};
