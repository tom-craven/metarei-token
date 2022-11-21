// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./Owned.sol";

contract PrivateSale is Owned {

    bytes32 private code;
    bool public isPrivate;

    /**
* @dev rudimentary protection from bots guaranteed to work only until first success then the phrase can be inferred from the transaction logs.
     */
    modifier  maybePrivate(bytes32 _phrase) {
        if (isPrivate) {
            require(code == keccak256(abi.encodePacked(_phrase)), "The passphrase must be correct");
        }
        _;}

    constructor() {
        isPrivate = true;
    }

    /**
  * @dev Set an encoded passphrase for the private sale.
     */
    function setCode(bytes32 _code) public onlyAdmin {
        code = _code;
    }

    /**
  * @dev Determines if the sale is public or private.
     */
    function setPrivate(bool _isPrivate) public onlyAdmin {
        isPrivate = _isPrivate;
    }
}
