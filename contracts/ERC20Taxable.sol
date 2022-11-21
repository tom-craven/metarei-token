// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./Owned.sol";

abstract contract ERC20Taxable is ERC20Burnable,Owned {
    using SafeMath for uint;
    uint public burnedAmount;
    uint public burnedFraction;
    /**
     * @dev
     * See {ERC20-ERC20Capped}.
     */
    constructor(
    ) ERC20Burnable() {
        burnedAmount = 0;
        burnedFraction = 160;
    }

    /**
    * @dev See {IERC20-transfer}.
         *
         * Requirements:
         *
         * - `recipient` cannot be the zero address.
         * - recipient cannot be this contract
         * - the caller must have a balance of at least `amount`.
         * - the tax must be burned.
         */
    function transfer(address _recipient, uint _amount) public virtual override returns (bool) {
        require(_recipient != address(this), 'dont send coins to this contract address');
        (bool a, uint b) = SafeMath.tryDiv(_amount, burnedFraction);
        require(a == true, "error calculating burned amount");
        (bool c, uint d) = SafeMath.trySub(_amount, b);
        require(c == true, "error subtracting burned amount");
        burn(b);
        super.transfer(_recipient, d);
        return true;
    }

    /**
* @dev Sets `burnFraction` during transfers.
     * See {burn}.
     */
    function burnFraction(uint _burnedFraction) public onlyAdmin {
        burnedFraction = _burnedFraction;
    }

    /**
 * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint _amount) public virtual override {
        (bool a, uint b) = SafeMath.tryAdd(burnedAmount, _amount);
        require(a == true, "error burning tokens");
        burnedAmount = b;
        super._burn(_msgSender(), _amount);
    }
}
