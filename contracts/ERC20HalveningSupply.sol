// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./Owned.sol";
import "./PrivateSale.sol";

contract ERC20HalvingSupply is ERC20Capped, Owned {
    using SafeMath for uint;
    /**
    * @notice submit a list of unix timestamps for halving dates.
    */
    uint[] public unlocks;

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
    ) ERC20Capped(_cap) ERC20(_name, _symbol) {
        unlocks = _unlocks;
    }

    /**
     * @dev See {ERC20-Capped Supply _mint}.
     */
    function mint() public onlyAdmin {
        uint supplyBefore = totalSupply();
        bool success = false;
        if (block.timestamp > unlocks[unlocks.length - 1] && unlocks[unlocks.length - 1] > 0) {
            if (unlocks.length > 1) {
                unlocks.pop();
                _mint(_msgSender(), (cap() - totalSupply()) / 2);
            } else {
                _mint(_msgSender(), (cap() - totalSupply()));
            }
            emit Halvening(supplyBefore, totalSupply());
            success = true;
        }
        require(success == true, 'no halving due');
    }

    event Halvening(uint supplyBefore, uint supplyAfter);
}
