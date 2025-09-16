// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test, console } from "forge-std/Test.sol";
import { VoidElementals, VoidElementalsForge } from "../src/VoidElementals.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract VoidElementalsTest is Test {
  VoidElementals public voidElementals;
  VoidElementalsForge public forge;
  address initialOwner;
  address userAddr;
  struct VoidElementalData {
    uint8[] burnTokens;
    string errorMessage;
  }
  mapping(uint8 => VoidElementalData) public voidElementalInfo;

  error OwnableUnauthorizedAccount(address account);

  function setUp() public {
    initialOwner = vm.addr(1);
    userAddr = vm.addr(2);
    voidElementals = new VoidElementals(initialOwner);
    forge = new VoidElementalsForge(address(voidElementals));

    vm.prank(initialOwner);
    voidElementals.setMinter(address(forge));

    voidElementalInfo[3] = VoidElementalData({
      burnTokens: new uint8[](2),
      errorMessage: "Raijuu requires Kurogawa and Enbu to be forged."
    });
    voidElementalInfo[3].burnTokens[0] = 0;
    voidElementalInfo[3].burnTokens[1] = 1;

    voidElementalInfo[4] = VoidElementalData({
      burnTokens: new uint8[](2),
      errorMessage: "Shigane requires Enbu and Retsu to be forged."
    });
    voidElementalInfo[4].burnTokens[0] = 1;
    voidElementalInfo[4].burnTokens[1] = 2;

    voidElementalInfo[5] = VoidElementalData({
      burnTokens: new uint8[](2),
      errorMessage: "Doron requires Kurogawa and Retsu to be forged."
    });
    voidElementalInfo[5].burnTokens[0] = 0;
    voidElementalInfo[5].burnTokens[1] = 2;

    voidElementalInfo[6] = VoidElementalData({
      burnTokens: new uint8[](3),
      errorMessage: "Fuujin requires Kurogawa, Enbu, and Retsu to be forged."
    });
    voidElementalInfo[6].burnTokens[0] = 0;
    voidElementalInfo[6].burnTokens[1] = 1;
    voidElementalInfo[6].burnTokens[2] = 2;
  }

  function mintWithCooldown(uint8 id) public {
    // Simulate time passing by advancing the block timestamp by 1 minute.
    vm.warp(block.timestamp + 1 minutes);

    // Prank as the user address to mint the token.
    vm.prank(userAddr);
    forge.mintTokens(id);
  }

  function testNonMinterCannotMintOrBurn() public {
    // Expect minting from a non-minter address to revert.
    vm.prank(userAddr);
    vm.expectRevert("Not authorized");
    voidElementals.mint(userAddr, 0, 1);

    // Expect minting from a non-minter address to revert.
    vm.prank(userAddr);
    vm.expectRevert("Not authorized");
    voidElementals.burn(userAddr, 0, 1);
  }

  function testMintTokens() public {
    // Scenario 1: Successful Mint.
    mintWithCooldown(1);

    // Scenario 2: Cooldown still active.
    vm.prank(userAddr);
    vm.expectRevert("Cooldown active: Please wait 1 minute between mints.");
    forge.mintTokens(0);

    // Assert that the token balance is correct after minting.
    assertEq(
      voidElementals.balanceOf(userAddr, 1),
      1,
      "Minting after cooldown failed."
    );

    // Scenario 3: Unmintable token.
    vm.expectRevert("You can only mint tokens 0, 1, or 2.");
    mintWithCooldown(3);
  }

  function testForge() public {
    for (uint8 voidElementalId = 3; voidElementalId <= 6; voidElementalId++) {
      VoidElementalData memory data = voidElementalInfo[voidElementalId];

      // Expect forging to fail if user has inadequate balances.
      vm.expectRevert(bytes(data.errorMessage));
      forge.forge(voidElementalId);

      // Mint required tokens.
      for (uint8 i = 0; i < data.burnTokens.length; i++) {
        mintWithCooldown(data.burnTokens[i]);
      }

      // Forge should be successful.
      vm.prank(userAddr);
      forge.forge(voidElementalId);

      // Expect offer tokens to be burned.
      for (uint8 i = 0; i < data.burnTokens.length; i++) {
        assertEq(
          voidElementals.balanceOf(userAddr, i),
          0,
          string(
            abi.encodePacked(
              "Void Elemental ID ",
              Strings.toString(i),
              " should be burned when forging Void Elemental ID ",
              Strings.toString(voidElementalId)
            )
          )
        );
      }

      // Expect token to be forged.
      assertEq(
        voidElementals.balanceOf(userAddr, voidElementalId),
        1,
        string(
          abi.encodePacked(
            "Failed to forge Void Elemental ID ",
            Strings.toString(voidElementalId)
          )
        )
      );
    }
  }

  function testTrade() public {
    // Mint trade token.
    mintWithCooldown(0);

    // Expect revert when trading for untradeable token.
    vm.prank(userAddr);
    vm.expectRevert("You can only trade for token IDs 0, 1, or 2.");
    forge.trade(0, 3);

    // Expect revert when trading token for itself.
    vm.prank(userAddr);
    vm.expectRevert("Cannot trade token for itself.");
    forge.trade(0, 0);

    // Expect successful trade.
    vm.prank(userAddr);
    forge.trade(0, 1);

    // Offer token should be burned.
    assertEq(
      voidElementals.balanceOf(userAddr, 0),
      0,
      "Offer token was not burned following trade."
    );

    // Ask token should be minted.
    assertEq(
      voidElementals.balanceOf(userAddr, 1),
      1,
      "Ask token was not minted following trade."
    );
  }
}
