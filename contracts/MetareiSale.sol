pragma solidity ^0.8.0;

import "./Metarei.sol";
import "./PrivateSale.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/security/Pausable.sol";

contract MetareiSale is Owned, ReentrancyGuard, PrivateSale {
    using SafeMath for uint;
    using SafeERC20 for Metarei;
    Metarei private token;
    uint public tokenPrice;
    uint public tokenSold;
    bool public isActive;

    event Withdrawn(address _buyer, uint _amount);
    event Sale(address _buyer, uint _amount);
    event PriceChange(uint oldPrice, uint newPrice);

    constructor (Metarei _address, uint _price) {
        token = _address;
        tokenPrice = _price;
        isActive = false;
    }

    function buyToken(uint _amount, bool _acceptance, bytes32 _phrase) public payable nonReentrant() maybePrivate(_phrase) {
        require(_acceptance, "The terms and conditions have to be accepted");
        require(isActive == true, "The sale must be active to swap tokens");
        require(token.balanceOf(address(this)) >= _amount);
        (bool a, uint b) = SafeMath.tryDiv(msg.value, _amount);
        require(a == true, "error calculating cost of tokens");
        require(b >= tokenPrice, "message value needs to be meet cost");
        (bool c, uint d) = SafeMath.tryAdd(tokenSold, _amount);
        require(c == true, "error updating tokens sold");
        tokenSold = d;
        token.safeTransfer(msg.sender, _amount);
        emit Sale(msg.sender, _amount);
    }

    function withdrawSale() public onlyAdmin {
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawBalance() public onlyAdmin {
        uint ethBalance = address(this).balance;
        require(ethBalance > 0, "the balance cannot be empty");
        address payable wallet = payable(address(msg.sender));
        wallet.transfer(ethBalance);
        emit Withdrawn(wallet, ethBalance);
    }

    function balance() public view returns (uint, uint){
        uint amountToken = token.balanceOf(address(this));
        uint amountEth = address(this).balance;
        return (amountToken, amountEth);
    }

    function setPrice(uint _price) public onlyAdmin {
        uint oldPrice = tokenPrice;
        tokenPrice = _price;
        emit PriceChange(oldPrice, tokenPrice);
    }

    function setActive(bool _active) public onlyAdmin {
        isActive = _active;
    }
}

