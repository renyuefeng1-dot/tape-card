// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ProfileFee} from "../src/ProfileFee.sol";

/// 只在设置了 BSC_FORK=1 时跑：对着主网真实 BEM 状态模拟一次付款（不发交易）。
contract ProfileFeeForkTest is Test {
    address constant BEM = 0x5ce033B2bFCa3Af30b3e8C8457DeaF776A8b695a;
    address constant TREASURY = 0xb16a39789A88546E1448a403414e038209b568aA;
    address constant DEAD = 0x000000000000000000000000000000000000dEaD;

    function test_fork_payWithRealBEM() public {
        if (vm.envOr("BSC_FORK", uint256(0)) == 0) return;
        vm.createSelectFork("https://bsc-dataseed.bnbchain.org");
        IERC20 t = IERC20(BEM);
        address payer = makeAddr("payer");
        // 从一个真实持币地址转 1 BEM 给测试付款人（仅在本地分叉里）
        vm.prank(TREASURY);
        assertTrue(t.transfer(payer, 1e8));
        assertEq(t.balanceOf(payer), 1e8, "fee-on-transfer?");

        ProfileFee pf = new ProfileFee(t, TREASURY, 1e7, 5000, 1e5, 5e8);
        uint256 dead0 = t.balanceOf(DEAD);
        uint256 tr0 = t.balanceOf(TREASURY);
        vm.startPrank(payer);
        t.approve(address(pf), 1e7);
        pf.pay(keccak256("card"), 1e7);
        vm.stopPrank();
        assertEq(t.balanceOf(payer), 1e8 - 1e7);
        assertEq(t.balanceOf(DEAD) - dead0, 5e6);
        assertEq(t.balanceOf(TREASURY) - tr0, 5e6);
        assertEq(pf.paymentsOf(payer), 1);
    }
}
