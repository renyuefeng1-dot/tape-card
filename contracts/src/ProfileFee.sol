// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title ProfileFee —— .tape 名片生成器的导出费
/// @notice 用户为一个名片（profileHash）支付一笔很小的 BEM：
///         其中 burnBps 部分直接转入 0x…dEaD 销毁，其余转给部署时设定的 treasury。
///         合约自己从不持有代币：两笔转账都是直接从付款人钱包 transferFrom 到目的地，
///         每次只会划走当时的 fee（且不超过付款人自己写的 maxFee），没有任何提走用户资金的函数。
/// @dev    owner 只能在固定上下限内调整 fee 和 burnBps；treasury 和 token 不可变。
contract ProfileFee is Ownable2Step {
    using SafeERC20 for IERC20;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint16 public constant BPS = 10_000;
    /// 销毁比例下限 10%，上限 100%
    uint16 public constant MIN_BURN_BPS = 1_000;

    IERC20 public immutable token;
    address public immutable treasury;
    /// 费用上下限（部署时按代币精度设定，之后不可改）
    uint256 public immutable minFee;
    uint256 public immutable maxFeeCap;

    uint256 public fee;
    uint16 public burnBps;

    uint256 public totalPayments;
    uint256 public totalBurned;
    uint256 public totalToTreasury;
    /// payer => profileHash => 是否已付
    mapping(address => mapping(bytes32 => bool)) public paid;
    /// payer => 已付次数
    mapping(address => uint256) public paymentsOf;

    event Paid(address indexed payer, bytes32 indexed profileHash, uint256 fee, uint256 burned, uint256 toTreasury);
    event FeeChanged(uint256 oldFee, uint256 newFee);
    event BurnBpsChanged(uint16 oldBps, uint16 newBps);

    error ZeroAddress();
    error FeeOutOfBounds();
    error BurnOutOfBounds();
    error FeeAboveMax(uint256 fee, uint256 maxFee);
    error EmptyHash();

    constructor(
        IERC20 token_,
        address treasury_,
        uint256 fee_,
        uint16 burnBps_,
        uint256 minFee_,
        uint256 maxFeeCap_
    ) Ownable(msg.sender) {
        if (address(token_) == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (minFee_ == 0 || minFee_ > maxFeeCap_) revert FeeOutOfBounds();
        token = token_;
        treasury = treasury_;
        minFee = minFee_;
        maxFeeCap = maxFeeCap_;
        _setFee(fee_);
        _setBurnBps(burnBps_);
    }

    /// @notice 为名片付费。maxFee 防止 owner 在交易打包前调高费用。
    function pay(bytes32 profileHash, uint256 maxFee) external {
        if (profileHash == bytes32(0)) revert EmptyHash();
        uint256 f = fee;
        if (f > maxFee) revert FeeAboveMax(f, maxFee);
        uint256 burned = (f * burnBps) / BPS;
        uint256 rest = f - burned;

        paid[msg.sender][profileHash] = true;
        paymentsOf[msg.sender] += 1;
        totalPayments += 1;
        totalBurned += burned;
        totalToTreasury += rest;

        if (burned > 0) token.safeTransferFrom(msg.sender, DEAD, burned);
        if (rest > 0) token.safeTransferFrom(msg.sender, treasury, rest);
        emit Paid(msg.sender, profileHash, f, burned, rest);
    }

    /// @notice 当前费用的拆分：(总费用, 销毁, 进 treasury)
    function quote() external view returns (uint256 total, uint256 burned, uint256 toTreasury) {
        total = fee;
        burned = (total * burnBps) / BPS;
        toTreasury = total - burned;
    }

    function setFee(uint256 newFee) external onlyOwner { _setFee(newFee); }
    function setBurnBps(uint16 newBps) external onlyOwner { _setBurnBps(newBps); }

    function _setFee(uint256 newFee) internal {
        if (newFee < minFee || newFee > maxFeeCap) revert FeeOutOfBounds();
        emit FeeChanged(fee, newFee);
        fee = newFee;
    }

    function _setBurnBps(uint16 newBps) internal {
        if (newBps < MIN_BURN_BPS || newBps > BPS) revert BurnOutOfBounds();
        emit BurnBpsChanged(burnBps, newBps);
        burnBps = newBps;
    }
}
