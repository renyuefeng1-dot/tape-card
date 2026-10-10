// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// 测试用 BEM（8 位小数，任何人可 mint），只用于单元测试
contract MockBEM is ERC20 {
    constructor() ERC20("Mock BEM", "BEM") {}
    function decimals() public pure override returns (uint8) { return 8; }
    function mint(address to, uint256 a) external { _mint(to, a); }
}

/// transferFrom 返回 false 而不是 revert 的代币（测试 SafeERC20）
contract FalseToken is ERC20 {
    constructor() ERC20("F", "F") {}
    function mint(address to, uint256 a) external { _mint(to, a); }
    function transferFrom(address, address, uint256) public pure override returns (bool) { return false; }
}
