// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {ProfileFee} from "../src/ProfileFee.sol";
import {MockBEM, FalseToken} from "../src/MockBEM.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ProfileFeeTest is Test {
    MockBEM bem;
    ProfileFee pf;
    address owner = address(this);
    address treasury = address(0x7EA5);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 constant ONE = 1e8; // 8 位小数
    bytes32 constant H = keccak256("profile-1");

    event Paid(address indexed payer, bytes32 indexed profileHash, uint256 fee, uint256 burned, uint256 toTreasury);

    function setUp() public {
        bem = new MockBEM();
        pf = new ProfileFee(IERC20(address(bem)), treasury, ONE / 10, 5000, ONE / 1000, 5 * ONE);
        bem.mint(alice, 100 * ONE);
        bem.mint(bob, 100 * ONE);
        vm.prank(alice); bem.approve(address(pf), type(uint256).max);
    }

    function test_DeployState() public view {
        assertEq(address(pf.token()), address(bem));
        assertEq(pf.treasury(), treasury);
        assertEq(pf.fee(), ONE / 10);
        assertEq(pf.burnBps(), 5000);
        assertEq(pf.owner(), owner);
        (uint256 t, uint256 b, uint256 r) = pf.quote();
        assertEq(t, ONE / 10); assertEq(b, ONE / 20); assertEq(r, ONE / 20);
    }

    function test_PaySplits50_50() public {
        uint256 a0 = bem.balanceOf(alice);
        vm.expectEmit(true, true, false, true);
        emit Paid(alice, H, ONE / 10, ONE / 20, ONE / 20);
        vm.prank(alice); pf.pay(H, ONE / 10);
        assertEq(bem.balanceOf(alice), a0 - ONE / 10);
        assertEq(bem.balanceOf(DEAD), ONE / 20);
        assertEq(bem.balanceOf(treasury), ONE / 20);
        assertEq(bem.balanceOf(address(pf)), 0, "contract never holds funds");
        assertTrue(pf.paid(alice, H));
        assertFalse(pf.paid(bob, H));
        assertEq(pf.paymentsOf(alice), 1);
        assertEq(pf.totalPayments(), 1);
        assertEq(pf.totalBurned(), ONE / 20);
        assertEq(pf.totalToTreasury(), ONE / 20);
    }

    function test_PayTakesOnlyFeeEvenWithUnlimitedApproval() public {
        vm.prank(alice); pf.pay(H, type(uint256).max);
        assertEq(bem.balanceOf(alice), 100 * ONE - ONE / 10);
    }

    function test_RevertWhenFeeAboveMax() public {
        pf.setFee(ONE);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ProfileFee.FeeAboveMax.selector, ONE, ONE / 10));
        pf.pay(H, ONE / 10);
    }

    function test_RevertEmptyHash() public {
        vm.prank(alice);
        vm.expectRevert(ProfileFee.EmptyHash.selector);
        pf.pay(bytes32(0), ONE);
    }

    function test_RevertWithoutApproval() public {
        vm.prank(bob);
        vm.expectRevert();
        pf.pay(H, ONE);
    }

    function test_RevertInsufficientBalance() public {
        address carol = address(0xCA201);
        bem.mint(carol, ONE / 100);
        vm.startPrank(carol); bem.approve(address(pf), type(uint256).max);
        vm.expectRevert();
        pf.pay(H, ONE);
        vm.stopPrank();
    }

    function test_MultiplePaymentsAndHashes() public {
        vm.startPrank(alice);
        pf.pay(H, ONE); pf.pay(H, ONE); pf.pay(keccak256("p2"), ONE);
        vm.stopPrank();
        assertEq(pf.paymentsOf(alice), 3);
        assertEq(pf.totalPayments(), 3);
        assertTrue(pf.paid(alice, keccak256("p2")));
        assertEq(bem.balanceOf(DEAD) + bem.balanceOf(treasury), 3 * ONE / 10);
    }

    function test_OwnerSetFeeWithinBounds() public {
        pf.setFee(ONE / 1000); assertEq(pf.fee(), ONE / 1000);
        pf.setFee(5 * ONE); assertEq(pf.fee(), 5 * ONE);
        vm.expectRevert(ProfileFee.FeeOutOfBounds.selector); pf.setFee(ONE / 1000 - 1);
        vm.expectRevert(ProfileFee.FeeOutOfBounds.selector); pf.setFee(5 * ONE + 1);
        vm.expectRevert(ProfileFee.FeeOutOfBounds.selector); pf.setFee(0);
    }

    function test_OwnerSetBurnWithinBounds() public {
        pf.setBurnBps(1000); assertEq(pf.burnBps(), 1000);
        pf.setBurnBps(10000); assertEq(pf.burnBps(), 10000);
        vm.expectRevert(ProfileFee.BurnOutOfBounds.selector); pf.setBurnBps(999);
        vm.expectRevert(ProfileFee.BurnOutOfBounds.selector); pf.setBurnBps(10001);
    }

    function test_Burn100PercentSendsNothingToTreasury() public {
        pf.setBurnBps(10000);
        vm.prank(alice); pf.pay(H, ONE);
        assertEq(bem.balanceOf(DEAD), ONE / 10);
        assertEq(bem.balanceOf(treasury), 0);
    }

    function test_Burn10Percent() public {
        pf.setBurnBps(1000);
        vm.prank(alice); pf.pay(H, ONE);
        assertEq(bem.balanceOf(DEAD), ONE / 100);
        assertEq(bem.balanceOf(treasury), ONE / 10 - ONE / 100);
    }

    function test_NonOwnerCannotConfigure() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        pf.setFee(ONE);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        pf.setBurnBps(1000);
        vm.stopPrank();
    }

    function test_TwoStepOwnershipTransfer() public {
        pf.transferOwnership(bob);
        assertEq(pf.owner(), owner);
        vm.prank(bob); pf.acceptOwnership();
        assertEq(pf.owner(), bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        pf.setFee(ONE);
    }

    function test_ConstructorValidation() public {
        vm.expectRevert(ProfileFee.ZeroAddress.selector);
        new ProfileFee(IERC20(address(0)), treasury, ONE, 5000, 1, 5 * ONE);
        vm.expectRevert(ProfileFee.ZeroAddress.selector);
        new ProfileFee(IERC20(address(bem)), address(0), ONE, 5000, 1, 5 * ONE);
        vm.expectRevert(ProfileFee.FeeOutOfBounds.selector);
        new ProfileFee(IERC20(address(bem)), treasury, ONE, 5000, 0, 5 * ONE);
        vm.expectRevert(ProfileFee.FeeOutOfBounds.selector);
        new ProfileFee(IERC20(address(bem)), treasury, 6 * ONE, 5000, 1, 5 * ONE);
        vm.expectRevert(ProfileFee.BurnOutOfBounds.selector);
        new ProfileFee(IERC20(address(bem)), treasury, ONE, 500, 1, 5 * ONE);
    }

    function test_SafeERC20RejectsFalseReturn() public {
        FalseToken ft = new FalseToken();
        ProfileFee p2 = new ProfileFee(IERC20(address(ft)), treasury, ONE, 5000, 1, 5 * ONE);
        ft.mint(alice, 10 * ONE);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(ft)));
        p2.pay(H, ONE);
    }

    function test_NoFunctionToMoveUserFunds() public {
        // 授权了无限额，owner 改到最高费用也只会划走 maxFeeCap，且需要用户自己调用 pay
        pf.setFee(5 * ONE);
        assertEq(bem.allowance(alice, address(pf)), type(uint256).max);
        vm.prank(owner);
        (bool ok,) = address(pf).call(abi.encodeWithSignature("pay(bytes32,uint256)", H, type(uint256).max));
        // owner 调用只会从 owner 自己扣（owner 没币 → 失败），动不了 alice
        assertFalse(ok);
        assertEq(bem.balanceOf(alice), 100 * ONE);
    }

    function testFuzz_SplitConserves(uint256 f, uint16 bps) public {
        f = bound(f, ONE / 1000, 5 * ONE);
        bps = uint16(bound(bps, 1000, 10000));
        pf.setFee(f); pf.setBurnBps(bps);
        uint256 a0 = bem.balanceOf(alice);
        vm.prank(alice); pf.pay(H, f);
        assertEq(a0 - bem.balanceOf(alice), f);
        assertEq(bem.balanceOf(DEAD) + bem.balanceOf(treasury), f);
        assertEq(bem.balanceOf(DEAD), f * bps / 10000);
        assertEq(bem.balanceOf(address(pf)), 0);
    }
}
