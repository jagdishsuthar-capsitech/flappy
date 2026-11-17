
const STORAGE_KEY = "flappyBird3_save";
const SAVE_VERSION = 1;

const DEFAULT_SAVE = {
  version: SAVE_VERSION,

  player: {
    name: "PLAYER",
    level: 1,
    xp: 0
  },

  wallet: {
    coins: 0,
    totalCoins: 0
  },

  statistics: {
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    totalPipes: 0,
    totalDeaths: 0,
    totalPlayTime: 0
  },

  birds: {
    selected: "yellow",
    unlocked: ["yellow"]
  },

  settings: {
    sound: true,
    music: false,
    soundVolume: 0.7,
    musicVolume: 0.4,
    difficulty: "medium",
    mode: "classic",
    screenMode: "mobile"
  },

  achievements: [],
  missions: [],

  rewards: {
    lastClaimDate: null,
    loginStreak: 0
  },

  updatedAt: Date.now()
};

const clone = value => JSON.parse(JSON.stringify(value));

function isObject(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function safeNumber(value, fallback = 0, min = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(min, number)
    : fallback;
}

function cleanString(value, fallback, maxLength = 30) {
  if (typeof value !== "string") return fallback;

  return value.trim().slice(0, maxLength) || fallback;
}

function validateSave(data) {
  if (!isObject(data)) return clone(DEFAULT_SAVE);

  const defaults = clone(DEFAULT_SAVE);

  const validModes = [
    "classic",
    "endless",
    "timeAttack",
    "boss",
    "hardcore",
    "coinRush"
  ];

  const validDifficulties = ["easy", "medium", "hard"];

  const result = {
    ...defaults,
    ...data,

    player: {
      ...defaults.player,
      ...(isObject(data.player) ? data.player : {})
    },

    wallet: {
      ...defaults.wallet,
      ...(isObject(data.wallet) ? data.wallet : {})
    },

    statistics: {
      ...defaults.statistics,
      ...(isObject(data.statistics) ? data.statistics : {})
    },

    birds: {
      ...defaults.birds,
      ...(isObject(data.birds) ? data.birds : {})
    },

    settings: {
      ...defaults.settings,
      ...(isObject(data.settings) ? data.settings : {})
    },

    rewards: {
      ...defaults.rewards,
      ...(isObject(data.rewards) ? data.rewards : {})
    }
  };

  result.version = SAVE_VERSION;

  result.player.name = cleanString(
    result.player.name,
    "PLAYER"
  );

  result.player.level = Math.floor(
    safeNumber(result.player.level, 1, 1)
  );

  result.player.xp = safeNumber(result.player.xp);

  result.wallet.coins = Math.floor(
    safeNumber(result.wallet.coins)
  );

  result.wallet.totalCoins = Math.floor(
    safeNumber(result.wallet.totalCoins)
  );

  for (const key of Object.keys(defaults.statistics)) {
    result.statistics[key] = safeNumber(
      result.statistics[key]
    );
  }

  const unlocked = Array.isArray(result.birds.unlocked)
    ? result.birds.unlocked.filter(
        bird => typeof bird === "string" && bird.length <= 40
      )
    : ["yellow"];

  result.birds.unlocked = [...new Set(["yellow", ...unlocked])];

  result.birds.selected =
    result.birds.unlocked.includes(result.birds.selected)
      ? result.birds.selected
      : "yellow";

  if (!validModes.includes(result.settings.mode)) {
    result.settings.mode = "classic";
  }

  if (!validDifficulties.includes(result.settings.difficulty)) {
    result.settings.difficulty = "medium";
  }

  result.settings.sound = Boolean(result.settings.sound);
  result.settings.music = Boolean(result.settings.music);

  result.settings.soundVolume = Math.min(
    1,
    safeNumber(result.settings.soundVolume, 0.7)
  );

  result.settings.musicVolume = Math.min(
    1,
    safeNumber(result.settings.musicVolume, 0.4)
  );

  result.settings.screenMode =
    result.settings.screenMode === "desktop"
      ? "desktop"
      : "mobile";

  result.achievements = Array.isArray(data.achievements)
    ? data.achievements.filter(x => typeof x === "string")
    : [];

  result.missions = Array.isArray(data.missions)
    ? data.missions
    : [];

  result.rewards.loginStreak = Math.floor(
    safeNumber(result.rewards.loginStreak)
  );

  result.updatedAt = safeNumber(
    data.updatedAt,
    Date.now()
  );

  return result;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return clone(DEFAULT_SAVE);

    return validateSave(JSON.parse(raw));
  } catch (error) {
    console.error("Could not load save:", error);
    return clone(DEFAULT_SAVE);
  }
}

export let saveData = readStorage();

export function saveGame() {
  try {
    saveData.updatedAt = Date.now();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(saveData)
    );

    return true;
  } catch (error) {
    console.error("Could not save game:", error);
    return false;
  }
}

export function updateSave(updates) {
  if (!isObject(updates)) return false;

  saveData = validateSave({
    ...saveData,
    ...updates
  });

  return saveGame();
}

export function getSaveData() {
  return clone(saveData);
}

// PLAYER

export function setPlayerName(name) {
  saveData.player.name = cleanString(name, "PLAYER");
  return saveGame();
}

export function addXP(amount) {
  amount = Math.floor(safeNumber(amount));

  saveData.player.xp += amount;

  while (saveData.player.xp >= saveData.player.level * 100) {
    saveData.player.xp -= saveData.player.level * 100;
    saveData.player.level++;
  }

  saveGame();

  return saveData.player.level;
}

// COINS

export function addCoins(amount) {
  amount = Math.floor(safeNumber(amount));

  saveData.wallet.coins += amount;
  saveData.wallet.totalCoins += amount;

  saveGame();

  return saveData.wallet.coins;
}

export function spendCoins(amount) {
  amount = Math.floor(safeNumber(amount));

  if (amount <= 0 || saveData.wallet.coins < amount) {
    return false;
  }

  saveData.wallet.coins -= amount;

  saveGame();

  return true;
}

// SCORES AND STATISTICS

export function updateBestScore(score) {
  score = Math.floor(safeNumber(score));

  if (score <= saveData.statistics.bestScore) {
    return false;
  }

  saveData.statistics.bestScore = score;

  saveGame();

  return true;
}

export function recordGame(result = {}) {
  const score = Math.floor(safeNumber(result.score));
  const coins = Math.floor(safeNumber(result.coins));
  const pipes = Math.floor(safeNumber(result.pipes));
  const playTime = safeNumber(result.playTime);

  saveData.statistics.gamesPlayed++;
  saveData.statistics.totalScore += score;
  saveData.statistics.totalPipes += pipes;
  saveData.statistics.totalDeaths++;
  saveData.statistics.totalPlayTime += playTime;

  if (score > saveData.statistics.bestScore) {
    saveData.statistics.bestScore = score;
  }

  addCoins(coins);
  addXP(score * 2);

  saveGame();

  return getSaveData();
}

// BIRDS

export function unlockBird(birdId) {
  if (typeof birdId !== "string" || !birdId) {
    return false;
  }

  if (saveData.birds.unlocked.includes(birdId)) {
    return false;
  }

  saveData.birds.unlocked.push(birdId);

  saveGame();

  return true;
}

export function selectBird(birdId) {
  if (!saveData.birds.unlocked.includes(birdId)) {
    return false;
  }

  saveData.birds.selected = birdId;

  saveGame();

  return true;
}

// SETTINGS

export function updateSettings(settings) {
  if (!isObject(settings)) return false;

  saveData.settings = {
    ...saveData.settings,
    ...settings
  };

  saveData = validateSave(saveData);

  return saveGame();
}

// ACHIEVEMENTS

export function unlockAchievement(id) {
  if (typeof id !== "string" || !id) {
    return false;
  }

  if (saveData.achievements.includes(id)) {
    return false;
  }

  saveData.achievements.push(id);

  saveGame();

  return true;
}

// DAILY REWARDS

export function claimDailyReward() {
  const today = new Date().toLocaleDateString("en-CA");

  if (saveData.rewards.lastClaimDate === today) {
    return false;
  }

  const yesterday = new Date(
    Date.now() - 86400000
  ).toLocaleDateString("en-CA");

  saveData.rewards.loginStreak =
    saveData.rewards.lastClaimDate === yesterday
      ? saveData.rewards.loginStreak + 1
      : 1;

  saveData.rewards.lastClaimDate = today;

  const reward = Math.min(
    100,
    20 + (saveData.rewards.loginStreak - 1) * 5
  );

  addCoins(reward);

  return {
    reward,
    streak: saveData.rewards.loginStreak
  };
}

// BACKUP EXPORT

export function exportBackup() {
  try {
    const backup = {
      app: "FlappyBird3",
      version: SAVE_VERSION,
      exportedAt: new Date().toISOString(),
      data: getSaveData()
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "flappy-bird-backup.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return true;
  } catch (error) {
    console.error("Backup export failed:", error);
    return false;
  }
}

// BACKUP IMPORT

export function importBackup(file) {
  return new Promise(resolve => {
    if (!file || file.size > 2 * 1024 * 1024) {
      resolve(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);

        if (
          backup.app !== "FlappyBird3" ||
          !isObject(backup.data)
        ) {
          resolve(false);
          return;
        }

        saveData = validateSave(backup.data);

        resolve(saveGame());
      } catch (error) {
        console.error("Invalid backup:", error);
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    reader.readAsText(file);
  });
}

// RESET

export function resetSave() {
  saveData = clone(DEFAULT_SAVE);
  return saveGame();
}