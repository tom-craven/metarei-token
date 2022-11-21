// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract Owned {

  address public owner;
  address public newOwner;

  mapping(address => bool) public isAdmin;

  event OwnershipTransferProposed(address indexed _from, address indexed _to);
  event OwnershipTransferred(address indexed _from, address indexed _to);
  event AdminChange(address indexed _admin, bool _status);

  modifier onlyOwner {require(msg.sender == owner); _;}
  modifier onlyAdmin {require(isAdmin[msg.sender]); _;}

  constructor() {
    owner = msg.sender;
    isAdmin[owner] = true;
  }

  function transferOwnership(address _newOwner) public onlyOwner {
    require(_newOwner != address(0x0));
    emit OwnershipTransferProposed(owner, _newOwner);
    newOwner = _newOwner;
  }

  function acceptOwnership() public {
    require(msg.sender == newOwner);
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

  function addAdmin(address _a) public onlyOwner {
    require(isAdmin[_a] == false);
    isAdmin[_a] = true;
    emit AdminChange(_a, true);
  }

  function removeAdmin(address _a) public onlyOwner {
    require(isAdmin[_a] == true);
    isAdmin[_a] = false;
    emit AdminChange(_a, false);
  }

}
