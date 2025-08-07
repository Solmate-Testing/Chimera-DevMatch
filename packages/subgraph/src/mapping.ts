import {
    ProductListed,
    StakeAdded,
    ProductLoved,
  } from "../generated/Marketplace/Marketplace";
  import { Product, Stake, LoveEvent, User } from "../generated/schema";
  import { BigInt } from "@graphprotocol/graph-ts";
  
  export function handleProductListed(event: ProductListed): void {
    let product = new Product(event.params.productId.toHexString());
    
    product.name = event.params.name;
    product.creator = event.params.creator;
    product.category = event.params.category;
    product.totalStaked = BigInt.fromI32(0);
    product.loves = 0;
    product.active = true;
    product.createdAt = event.block.timestamp;
    product.updatedAt = event.block.timestamp;
    
    product.save();
    
    // Create or update user
    let user = User.load(event.params.creator.toHexString());
    if (!user) {
      user = new User(event.params.creator.toHexString());
      user.address = event.params.creator;
      user.totalStaked = BigInt.fromI32(0);
      user.save();
    }
  }
  
  export function handleStakeAdded(event: StakeAdded): void {
    let product = Product.load(event.params.productId.toHexString());
    if (product) {
      product.totalStaked = product.totalStaked.plus(event.params.amount);
      product.updatedAt = event.block.timestamp;
      product.save();
      
      // Create stake record
      let stakeId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
      let stake = new Stake(stakeId);
      stake.product = event.params.productId.toHexString();
      stake.user = event.params.user;
      stake.amount = event.params.amount;
      stake.timestamp = event.block.timestamp;
      stake.transactionHash = event.transaction.hash;
      stake.save();
      
      // Update user
      let user = User.load(event.params.user.toHexString());
      if (!user) {
        user = new User(event.params.user.toHexString());
        user.address = event.params.user;
        user.totalStaked = BigInt.fromI32(0);
      }
      user.totalStaked = user.totalStaked.plus(event.params.amount);
      user.save();
    }
  }
  
  export function handleProductLoved(event: ProductLoved): void {
    let product = Product.load(event.params.productId.toHexString());
    if (product) {
      product.loves = product.loves + 1;
      product.updatedAt = event.block.timestamp;
      product.save();
      
      // Create love event record
      let loveId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
      let loveEvent = new LoveEvent(loveId);
      loveEvent.product = event.params.productId.toHexString();
      loveEvent.user = event.params.user;
      loveEvent.timestamp = event.block.timestamp;
      loveEvent.transactionHash = event.transaction.hash;
      loveEvent.save();
    }
  }