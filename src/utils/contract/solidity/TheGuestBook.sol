//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './Renderer.sol';

/*

▀█▀ █░█ █▀▀
░█░ █▀█ ██▄

█▀▀ █░█ █▀▀ █▀ ▀█▀   █▄▄ █▀█ █▀█ █▄▀
█▄█ █▄█ ██▄ ▄█ ░█░   █▄█ █▄█ █▄█ █░█

*/

contract TheGuestBook is ERC721, Ownable {
  constructor() ERC721('The Guest Book', 'GUEST') {}

  // Emitted when we know that something about the token has changed
  event MetadataUpdated(uint256 indexed tokenId);
  event GuestUpdated(uint256 indexed guestId);

  // Define tokenId, guestID, etc
  uint256 public tokenId;
  uint256 public guestId;

  // Store renderer as separate contract so we can update it if needed
  Renderer public renderer;

  // Store content for the nfts
  mapping(uint256 => string[]) _tokenMetadata;

  struct Guest {
    uint256 guestId; // Enumerated ID of the guest
    string guest; // The address of the guest.
    string message; // The message the guest sent.
    string timestamp; // The timestamp when the guest visited.
    string minted; // boolean if minted
    uint256 tokenId; // tokenId, set to 0 if `minted` is false
  }

  event NewGuest(
    uint256 guestId,
    string author,
    string message,
    string timestamp
  );

  Guest[] public guests;

  /// @notice returns all guests
  function getAllGuests() public view returns (Guest[] memory) {
    return guests;
  }

  function addGuest(
    string memory _message,
    string memory _minted,
    uint256 _tokenId
  ) private {
    // struct the guest values
    string memory _a = Strings.toHexString(uint256(uint160(msg.sender)));
    string memory _timestamp = Strings.toString(block.number);

    // emit event for new guest
    Guest memory g = Guest(
      guestId,
      _a,
      _message,
      _timestamp,
      _minted,
      _tokenId
    );
    guests.push(g);
    emit NewGuest(guestId, _a, _message, _timestamp);

    // increment guestId
    guestId++;
  }

  /// @notice write a message to the blockchain
  /// @notice recommend less than 280 characters
  function signWithoutMint(string memory _message) public {
    require(
      bytes(_message).length <= 280,
      'Message should be less than 280 characters.'
    );
    addGuest(_message, 'false', 0);
  }

  /// @notice write a message to the blockchain and get an nft
  /// @notice your message will be inscribed in an on-chain svg, recommend less than 280 characters
  function signWithMint(string memory _message) public payable {
    require(msg.value >= 0.01 ether, 'Not enough ETH');
    require(
      bytes(_message).length <= 280,
      'Message should be less than 280 characters.'
    );
    addGuest(_message, 'true', tokenId);
    string memory _a = Strings.toHexString(uint256(uint160(msg.sender)));
    _tokenMetadata[tokenId] = [_a];
    _mint(msg.sender, tokenId);
    tokenId++;
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    override
    returns (string memory)
  {
    return renderer.render(_tokenId, _tokenMetadata[_tokenId][0]);
  }

  /* ADMIN */
  // @notice admin reserves the right to rewrite any message that contains hurtful or inflammatory language
  function rewriteMessage(uint256 _guestId, string calldata _message)
    external
    onlyOwner
  {
    // struct the updated guest message
    guests[_guestId].message = _message;
    emit GuestUpdated(_guestId);
  }

  function withdrawAll() external {
    payable(owner()).transfer(address(this).balance);
  }

  function withdrawAllERC20(IERC20 _erc20Token) external {
    _erc20Token.transfer(owner(), _erc20Token.balanceOf(address(this)));
  }

  function setRenderer(Renderer _renderer) external onlyOwner {
    renderer = _renderer;
    emit MetadataUpdated(type(uint256).max);
  }
}
