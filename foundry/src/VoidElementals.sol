// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VoidElementals is ERC1155, Ownable2Step {
  string public constant name = "Void Elementals";
  string public constant symbol = "VOID";
  address public minter;

  constructor(
    address initialOwner
  )
    ERC1155("ipfs://QmPmrgYjUPtz7wgFGhffApkuGNkL8fosshKYXB7yjTcbrt/{id}")
    Ownable(initialOwner)
  {}

  function uri(uint256 id) public pure override returns (string memory) {
    return
      string(
        abi.encodePacked(
          "ipfs://QmPmrgYjUPtz7wgFGhffApkuGNkL8fosshKYXB7yjTcbrt/",
          Strings.toString(id)
        )
      );
  }

  function setMinter(address minterAddress) external onlyOwner {
    require(minterAddress != address(0), "Please enter a valid minter address");
    minter = minterAddress;
  }

  function burn(address account, uint256 id, uint256 amount) external {
    require(msg.sender == minter, "Not authorized");
    _burn(account, id, amount);
  }

  function mint(address account, uint256 id, uint256 amount) external {
    require(msg.sender == minter, "Not authorized");
    _mint(account, id, amount, "");
  }
}

contract VoidElementalsForge {
  VoidElementals public immutable tokenContract;
  uint public lastMint;

  constructor(address _tokenContract) {
    tokenContract = VoidElementals(_tokenContract);
  }

  function mintTokens(uint8 idx) external {
    require(idx <= 2, "You can only mint tokens 0, 1, or 2.");
    require(
      block.timestamp >= lastMint + 1 minutes,
      "Cooldown active: Please wait 1 minute between mints."
    );
    lastMint = block.timestamp;
    tokenContract.mint(msg.sender, idx, 1);
  }

  function forge(uint8 forgeToken) external {
    require(
      forgeToken >= 3 && forgeToken <= 6,
      "Only token IDs 3, 4, 5, or 6 may be forged."
    );
    if (forgeToken == 3) {
      require(
        tokenContract.balanceOf(msg.sender, 0) >= 1 &&
          tokenContract.balanceOf(msg.sender, 1) >= 1,
        "Raijuu requires Kurogawa and Enbu to be forged."
      );
      tokenContract.burn(msg.sender, 0, 1);
      tokenContract.burn(msg.sender, 1, 1);
      tokenContract.mint(msg.sender, 3, 1);
    } else if (forgeToken == 4) {
      require(
        tokenContract.balanceOf(msg.sender, 1) >= 1 &&
          tokenContract.balanceOf(msg.sender, 2) >= 1,
        "Shigane requires Enbu and Retsu to be forged."
      );
      tokenContract.burn(msg.sender, 1, 1);
      tokenContract.burn(msg.sender, 2, 1);
      tokenContract.mint(msg.sender, 4, 1);
    } else if (forgeToken == 5) {
      require(
        tokenContract.balanceOf(msg.sender, 0) >= 1 &&
          tokenContract.balanceOf(msg.sender, 2) >= 1,
        "Doron requires Kurogawa and Retsu to be forged."
      );
      tokenContract.burn(msg.sender, 0, 1);
      tokenContract.burn(msg.sender, 2, 1);
      tokenContract.mint(msg.sender, 5, 1);
    } else if (forgeToken == 6) {
      require(
        tokenContract.balanceOf(msg.sender, 0) >= 1 &&
          tokenContract.balanceOf(msg.sender, 1) >= 1 &&
          tokenContract.balanceOf(msg.sender, 2) >= 1,
        "Fuujin requires Kurogawa, Enbu, and Retsu to be forged."
      );
      tokenContract.burn(msg.sender, 0, 1);
      tokenContract.burn(msg.sender, 1, 1);
      tokenContract.burn(msg.sender, 2, 1);
      tokenContract.mint(msg.sender, 6, 1);
    }
  }

  function trade(uint8 offerIdx, uint8 askIdx) external {
    require(
      askIdx <= 2,
      "You can only trade for token IDs 0, 1, or 2."
    );
    require(offerIdx != askIdx, "Cannot trade token for itself.");
    tokenContract.burn(msg.sender, offerIdx, 1);
    tokenContract.mint(msg.sender, askIdx, 1);
  }
}
