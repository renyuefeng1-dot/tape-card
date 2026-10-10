// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ProfileFee} from "../src/ProfileFee.sol";

/// BSC 主网部署：真实 BEM（8 位小数），费用 0.1 BEM，50% 销毁。
contract DeployMainnet is Script {
    address constant BEM = 0x5ce033B2bFCa3Af30b3e8C8457DeaF776A8b695a;
    address constant TREASURY = 0xb16a39789A88546E1448a403414e038209b568aA;
    uint256 constant ONE = 1e8;

    function run() external returns (ProfileFee pf) {
        require(block.chainid == 56, "not BSC mainnet");
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        pf = new ProfileFee(IERC20(BEM), TREASURY, ONE / 10, 5000, ONE / 1000, 5 * ONE);
        vm.stopBroadcast();
        console.log("ProfileFee", address(pf));
    }
}
