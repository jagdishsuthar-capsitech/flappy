
import {
  saveData,
  addCoins,
  addXP,
  unlockAchievement,
  claimDailyReward,
  saveGame
} from "./storage.js";

export class RewardSystem {
  constructor() {
    this.missions = [
      {
        id: "play_1",
        name: "First Flight",
        description: "Play 1 game.",
        type: "games",
        target: 1,
        reward: 20,
        xp: 10
      },
      {
        id: "score_10",
        name: "Getting Better",
        description: "Score 10 points in total.",
        type: "score",
        target: 10,
        reward: 30,
        xp: 15
      },
      {
        id: "collect_10",
        name: "Coin Collector",
        description: "Collect 10 coins.",
        type: "coins",
        target: 10,
        reward: 40,
        xp: 20
      },
      {
        id: "pipes_20",
        name: "Pipe Master",
        description: "Pass 20 pipes.",
        type: "pipes",
        target: 20,
        reward: 50,
        xp: 25
      },
      {
        id: "play_5",
        name: "Dedicated Player",
        description: "Play 5 games.",
        type: "games",
        target: 5,
        reward: 75,
        xp: 30
      }
    ];

    this.achievements = [
      {
        id: "first_game",
        name: "First Flight",
        description: "Play your first game.",
        type: "games",
        target: 1,
        reward: 25
      },
      {
        id: "score_10",
        name: "Rising Star",
        description: "Reach a best score of 10.",
        type: "bestScore",
        target: 10,
        reward: 50
      },
      {
        id: "score_50",
        name: "Sky Champion",
        description: "Reach a best score of 50.",
        type: "bestScore",
        target: 50,
        reward: 150
      },
      {
        id: "coins_100",
        name: "Treasure Hunter",
        description: "Collect 100 coins in total.",
        type: "totalCoins",
        target: 100,
        reward: 100
      },
      {
        id: "pipes_100",
        name: "Pipe Legend",
        description: "Pass 100 pipes.",
        type: "totalPipes",
        target: 100,
        reward: 200
      }
    ];

    this.initializeMissions();
  }

  // INITIALIZE MISSIONS

  initializeMissions() {
    if (!Array.isArray(saveData.missions)) {
      saveData.missions = [];
    }

    for (const mission of this.missions) {
      let existing = saveData.missions.find(
        item => item.id === mission.id
      );

      if (!existing) {
        saveData.missions.push({
          id: mission.id,
          progress: 0,
          claimed: false
        });
      }
    }

    saveGame();
  }

  // GET PLAYER STATISTICS

  getStatistic(type) {
    const stats = saveData.statistics;

    switch (type) {
      case "games":
        return stats.gamesPlayed;

      case "score":
        return stats.totalScore;

      case "coins":
        return saveData.wallet.totalCoins;

      case "pipes":
        return stats.totalPipes;

      case "bestScore":
        return stats.bestScore;

      case "totalCoins":
        return saveData.wallet.totalCoins;

      case "totalPipes":
        return stats.totalPipes;

      default:
        return 0;
    }
  }

  // UPDATE MISSION PROGRESS

  updateMissions() {
    for (const mission of this.missions) {
      const progress = Math.min(
        mission.target,
        this.getStatistic(mission.type)
      );

      const saved = saveData.missions.find(
        item => item.id === mission.id
      );

      if (!saved) continue;

      saved.progress = progress;
    }

    saveGame();

    this.checkAchievements();
  }

  // GET MISSIONS

  getMissions() {
    return this.missions.map(mission => {
      const saved = saveData.missions.find(
        item => item.id === mission.id
      );

      return {
        ...mission,
        progress: saved?.progress ?? 0,
        completed: (saved?.progress ?? 0) >= mission.target,
        claimed: saved?.claimed ?? false
      };
    });
  }

  // CLAIM MISSION

  claimMission(id) {
    const mission = this.missions.find(
      item => item.id === id
    );

    if (!mission) {
      return {
        success: false,
        message: "Mission not found."
      };
    }

    const saved = saveData.missions.find(
      item => item.id === id
    );

    if (!saved || saved.progress < mission.target) {
      return {
        success: false,
        message: "Mission not completed."
      };
    }

    if (saved.claimed) {
      return {
        success: false,
        message: "Reward already collected."
      };
    }

    saved.claimed = true;

    addCoins(mission.reward);
    addXP(mission.xp);

    saveGame();

    return {
      success: true,
      message: "Mission reward collected!",
      coins: mission.reward,
      xp: mission.xp
    };
  }

  // CHECK ACHIEVEMENTS

  checkAchievements() {
    const unlocked = [];

    for (const achievement of this.achievements) {
      const progress = this.getStatistic(
        achievement.type
      );

      if (
        progress >= achievement.target &&
        !saveData.achievements.includes(achievement.id)
      ) {
        const success = unlockAchievement(achievement.id);

        if (success) {
          addCoins(achievement.reward);

          unlocked.push({
            ...achievement,
            success: true
          });
        }
      }
    }

    return unlocked;
  }

  // GET ACHIEVEMENTS

  getAchievements() {
    return this.achievements.map(achievement => {
      const progress = this.getStatistic(
        achievement.type
      );

      return {
        ...achievement,
        progress: Math.min(progress, achievement.target),
        unlocked: saveData.achievements.includes(
          achievement.id
        )
      };
    });
  }

  // DAILY REWARD

  getDailyRewardInfo() {
    const streak = saveData.rewards.loginStreak;

    return {
      streak,
      claimedToday:
        saveData.rewards.lastClaimDate ===
        new Date().toLocaleDateString("en-CA"),

      nextReward: Math.min(
        100,
        20 + streak * 5
      )
    };
  }

  claimDaily() {
    const result = claimDailyReward();

    if (!result) {
      return {
        success: false,
        message: "Daily reward already claimed."
      };
    }

    return {
      success: true,
      message: `You received ${result.reward} coins!`,
      ...result
    };
  }

  // GET COMPLETE REWARD DATA

  getOverview() {
    return {
      missions: this.getMissions(),
      achievements: this.getAchievements(),
      daily: this.getDailyRewardInfo(),
      totalAchievements: this.achievements.length,
      unlockedAchievements: saveData.achievements.length
    };
  }

  // RESET DAILY MISSIONS

  resetMissions() {
    saveData.missions = this.missions.map(mission => ({
      id: mission.id,
      progress: 0,
      claimed: false
    }));

    return saveGame();
  }
}

export const rewards = new RewardSystem();
