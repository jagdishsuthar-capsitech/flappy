
import {
  saveData,
  spendCoins,
  unlockBird,
  selectBird
} from "./storage.js";

export class BirdShop {
  constructor() {
    this.birds = [
      {
        id: "yellow",
        name: "Classic Bird",
        emoji: "🐤",
        price: 0,
        color: "#ffcf38",
        description: "The original flying champion."
      },
      {
        id: "blue",
        name: "Blue Bird",
        emoji: "🐦",
        price: 100,
        color: "#38a8ff",
        description: "A cool blue flying bird."
      },
      {
        id: "red",
        name: "Fire Bird",
        emoji: "🐦",
        price: 200,
        color: "#ff5252",
        description: "A fiery flying champion."
      },
      {
        id: "green",
        name: "Jungle Bird",
        emoji: "🦜",
        price: 300,
        color: "#40c878",
        description: "A bird from the jungle."
      },
      {
        id: "purple",
        name: "Magic Bird",
        emoji: "🦄",
        price: 450,
        color: "#bb72ff",
        description: "A magical flying character."
      },
      {
        id: "gold",
        name: "Golden Bird",
        emoji: "🐤",
        price: 750,
        color: "#ffd700",
        description: "A rare golden champion."
      },
      {
        id: "diamond",
        name: "Diamond Bird",
        emoji: "🐦",
        price: 1200,
        color: "#68e5ff",
        description: "A legendary diamond bird."
      },
      {
        id: "shadow",
        name: "Shadow Bird",
        emoji: "🐦‍⬛",
        price: 1800,
        color: "#55516f",
        description: "A mysterious dark bird."
      }
    ];
  }

  // GET ALL BIRDS

  getBirds() {
    return this.birds.map(bird => ({
      ...bird,
      unlocked: this.isUnlocked(bird.id),
      selected: this.isSelected(bird.id)
    }));
  }

  // FIND BIRD

  getBird(id) {
    return this.birds.find(bird => bird.id === id) || null;
  }

  // CHECK OWNERSHIP

  isUnlocked(id) {
    return saveData.birds.unlocked.includes(id);
  }

  // CHECK SELECTION

  isSelected(id) {
    return saveData.birds.selected === id;
  }

  // CURRENT BIRD

  getSelectedBird() {
    return (
      this.getBird(saveData.birds.selected) ||
      this.getBird("yellow")
    );
  }

  // BUY BIRD

  buyBird(id) {
    const bird = this.getBird(id);

    if (!bird) {
      return {
        success: false,
        message: "Bird not found."
      };
    }

    if (this.isUnlocked(id)) {
      return {
        success: false,
        message: "You already own this bird."
      };
    }

    if (saveData.wallet.coins < bird.price) {
      return {
        success: false,
        message: "Not enough coins."
      };
    }

    if (!spendCoins(bird.price)) {
      return {
        success: false,
        message: "Purchase failed."
      };
    }

    if (!unlockBird(id)) {
      return {
        success: false,
        message: "Could not unlock bird."
      };
    }

    return {
      success: true,
      message: `${bird.name} unlocked!`,
      bird
    };
  }

  // SELECT BIRD

  chooseBird(id) {
    if (!this.getBird(id)) {
      return {
        success: false,
        message: "Bird not found."
      };
    }

    if (!this.isUnlocked(id)) {
      return {
        success: false,
        message: "Purchase this bird first."
      };
    }

    if (!selectBird(id)) {
      return {
        success: false,
        message: "Could not select bird."
      };
    }

    return {
      success: true,
      message: `${this.getBird(id).name} selected!`,
      bird: this.getBird(id)
    };
  }

  // SHOP INFORMATION

  getWallet() {
    return saveData.wallet.coins;
  }

  getOwnedCount() {
    return saveData.birds.unlocked.length;
  }

  getTotalCount() {
    return this.birds.length;
  }

  getShopStats() {
    return {
      coins: this.getWallet(),
      owned: this.getOwnedCount(),
      total: this.getTotalCount(),
      selected: this.getSelectedBird()
    };
  }

  // RESET SHOP SELECTION

  resetSelection() {
    return selectBird("yellow");
  }
}

export const shop = new BirdShop();
