//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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
  // Emitted when we know that something about the token has changed
  event MetadataUpdated(uint256 indexed tokenId);
  event GuestUpdated(uint256 indexed guestId);

  // Define tokenId, guestID, etc
  uint256 public tokenId;
  uint256 public guestId;
  string _a = Strings.toHexString(uint256(uint160(msg.sender)));
  string _timestamp = Strings.toString(block.number);

  // Store renderer as separate contract so we can update it if needed
  Renderer public renderer;

  // Store content for the nfts
  mapping(uint256 => string[]) _tokenMetadata;

  constructor() ERC721('The Guest Book', 'GUEST') {}

  struct Guest {
    uint256 guestId; // Enumerated ID of the guest
    uint256 tokenId; // Enumerated ID of the guest
    string guest; // The address of the guest.
    string message; // The message the guest sent.
    string timestamp; // The timestamp when the guest visited.
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

  function addGuest(string memory _message, uint256 _tokenId) private {
    // struct the guest values
    Guest memory g = Guest(guestId, _tokenId, _a, _message, _timestamp);
    guests.push(g);

    // emit event for new guest
    emit NewGuest(guestId, _a, _message, _timestamp);

    // increment guestId
    guestId++;
  }

  /// @notice write a message to the blockchain
  function signWithoutMint(string memory _message) public {
    addGuest(_message, 0);
  }

  /// @notice write a message to the blockchain and get an nft
  /// @notice your message will be inscribed in an on-chain svg, recommend less than 590 characters
  function signWithMint(string memory _message) public payable {
    require(msg.value >= 0.001 ether, 'Not enough ETH');
    require(
      bytes(_message).length <= 1254,
      'Message should be less than 1254 characters.'
    );

    addGuest(_message, tokenId);

    _tokenMetadata[tokenId] = [_a, _timestamp, _message];

    _mint(msg.sender, tokenId);
    tokenId++;
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    override
    returns (string memory)
  {
    return
      renderer.render(
        _tokenId,
        _tokenMetadata[_tokenId][0],
        _tokenMetadata[_tokenId][1],
        _tokenMetadata[_tokenId][2]
      );
  }

  /* ADMIN */
  // If a message contains any text that is hurtful, inflammatory, hateful, or otherwise unwanted language this allows for it to be changed.
  // admins can rewrite at their discretion.
  function rewriteMessage(
    uint256 _guestId,
    uint256 _tokenId,
    string calldata _message
  ) external onlyOwner {
    // struct the updated guest message
    guests[_guestId].message = _message;
    emit GuestUpdated(_guestId);

    // if a token ID is included rewrite that message as well
    if (_tokenId > 0) {
      _tokenMetadata[_tokenId][2] = _message;
    }
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
