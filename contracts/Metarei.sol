// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./ERC20HalveningSupply.sol";
import "./ERC20Taxable.sol";

contract Metarei is ERC20HalvingSupply, ERC20Taxable {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC20-ERC20Capped-ERC20Burnable}.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint _cap,
        uint[] memory _unlocks
    ) ERC20HalvingSupply(_name, _symbol, _cap, _unlocks) ERC20Taxable() Owned() {}

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /**
 * @dev See {ERC20-Capped Supply _mint}.
     */
    function _mint(address _recipient, uint _amount) internal virtual override (ERC20, ERC20Capped) {
        super._mint(_recipient, _amount);
    }

    function transfer(address _recipient, uint _amount) public virtual override (ERC20,ERC20Taxable) returns (bool) {
        super.transfer(_recipient, _amount);
        return true;
    }
}
