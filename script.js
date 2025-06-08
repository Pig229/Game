class Item {
    constructor(name, description, type, effectAttribute = null, effectValue = 0, slot = null, accessoryType = null, attackBonus = 0, defenseBonus = 0, goldCost = 0, criticalChance = 0, damageReduction = 0, lifesteal = 0, rarity = "common") {
        this.name = name;
        this.description = description;
        this.type = type;
        this.effectAttribute = effectAttribute;
        this.effectValue = effectValue;
        this.slot = slot;
        this.accessoryType = accessoryType;
        this.attackBonus = attackBonus;
        this.defenseBonus = defenseBonus;
        this.goldCost = goldCost;
        this.criticalChance = criticalChance;
        this.damageReduction = damageReduction;
        this.lifesteal = lifesteal;
        this.rarity = rarity;
    }

    calculateBasePrice() {
        let basePrice = 0;

        if (this.type === "potion") {
            basePrice = 10;
            if (this.effectAttribute === "health") {
                basePrice += this.effectValue / 5;
            } else if (this.effectAttribute === "attack" || this.effectAttribute === "defense") {
                basePrice += this.effectValue * 2;
            }
        } else if (this.type === "stat") {
            basePrice = 50;
            basePrice += this.effectValue * 5;
        } else if (this.type === "equipment") {
            basePrice = 30;
            basePrice += this.attackBonus * 10;
            basePrice += this.defenseBonus * 10;

            basePrice += this.criticalChance * 20;
            basePrice += this.damageReduction * 25;
            basePrice += this.lifesteal * 30;

            if (this.slot === "weapon") {
                basePrice *= 1.5;
            } else if (this.slot === "armor") {
                basePrice *= 1.3;
            } else if (this.slot === "accessory") {
                basePrice *= 1.1;
            }
        }

        const rarityMultipliers = {
            "common": 1.0,
            "uncommon": 1.5,
            "rare": 2.5,
            "epic": 4.0,
            "legendary": 7.0
        };

        basePrice = basePrice * (rarityMultipliers[this.rarity] || 1.0);
        return Math.max(5, Math.floor(basePrice));
    }
}

class Character {
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 15;
        this.defense = 5;
        this.strength = 10;
        this.agility = 10;
        this.intelligence = 10;
        this.criticalChance = 5;
        this.criticalEffect = 150;
        this.lifesteal = 0;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessories: {}
        };
        this.gold = 50;
        this.specialEffects = {};
        this.souls = 0;
        this.defeatedEnemies = 0;
    }

    displayStatus() {
        const totalAttack = this.attack + (this.equipment.weapon ? this.equipment.weapon.attackBonus : 0) + Object.values(this.equipment.accessories).reduce((sum, item) => sum + (item?.attackBonus || 0), 0);
        const totalDefense = this.defense + (this.equipment.armor ? this.equipment.armor.defenseBonus : 0) + Object.values(this.equipment.accessories).reduce((sum, item) => sum + (item?.defenseBonus || 0), 0);

        const healthPercent = Math.floor((this.health / this.maxHealth) * 20);
        const healthBar = "█".repeat(healthPercent) + "░".repeat(20 - healthPercent);

        const statusHTML = `
            <p>名称: ${this.name}</p>
            <p>等级: ${this.level} (${this.exp}/${this.expToNextLevel} EXP)</p>
            <p>生命值: ${this.health}/${this.maxHealth} ${healthBar}</p>
            <p>攻击力: ${totalAttack} (基础: ${this.attack}, 装备: ${totalAttack - this.attack})</p>
            <p>防御力: ${totalDefense} (基础: ${this.defense}, 装备: ${totalDefense - this.defense})</p>
            <p>力量: ${this.strength}</p>
            <p>敏捷: ${this.agility}</p>
            <p>智力: ${this.intelligence}</p>
            <p>暴击率: ${this.criticalChance}%</p>
            <p>暴击效果: ${this.criticalEffect}%</p>
            <p>生命偷取: ${this.lifesteal}%</p>
            <p>金币: ${this.gold}</p>
            <p>灵魂: ${this.souls}</p>
            <p>击败敌人: ${this.defeatedEnemies}</p>
        `;

        document.getElementById('status-content').innerHTML = statusHTML;
    }

    attackMonster(monster) {
        const totalAttack = this.attack + (this.equipment.weapon ? this.equipment.weapon.attackBonus : 0) + Object.values(this.equipment.accessories).reduce((sum, item) => sum + (item?.attackBonus || 0), 0);
        const isCritical = Math.random() < this.criticalChance / 100;
        const damageMultiplier = isCritical ? this.criticalEffect / 100 : 1.0;

        let damage = Math.max(1, Math.floor(totalAttack * damageMultiplier - monster.defense * 0.5));
        monster.health -= damage;
        monster.health = Math.max(0, monster.health);

        const log = document.getElementById('log');
        log.innerHTML += `<p>你对 ${monster.name} 造成了 ${damage} 点${isCritical ? '暴击' : ''}伤害。</p>`;

        if (monster.health <= 0) {
            log.innerHTML += `<p>${monster.name} 被击败了！</p>`;
            this.exp += monster.souls;
            this.gold += monster.gold;
            this.defeatedEnemies++;
            log.innerHTML += `<p>获得 ${monster.souls} 点灵魂和 ${monster.gold} 金币。</p>`;

            if (Math.random() < 0.6) {
                this.receiveItemDrop();
            }
        } else {
            const healthPercent = Math.floor((monster.health / monster.initialHealth) * 100);
            log.innerHTML += `<p>${monster.name} 剩余生命值: ${monster.health} (${healthPercent}%)</p>`;
        }
    }

    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level++;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.attack += 5;
        this.defense += 3;
        this.strength += 2;
        this.agility += 2;
        this.intelligence += 2;

        const log = document.getElementById('log');
        log.innerHTML += `<p>恭喜！你升级到了 ${this.level} 级！</p>`;
    }

    addInventory(item) {
        this.inventory.push(item);
        const log = document.getElementById('log');
        log.innerHTML += `<p>获得物品: ${item.name}</p>`;
    }

    useItem(item) {
        if (item.type === "potion") {
            if (item.effectAttribute === "health") {
                const oldHealth = this.health;
                this.health = Math.min(this.maxHealth, this.health + item.effectValue);
                const log = document.getElementById('log');
                log.innerHTML += `<p>使用了 ${item.name}，恢复了 ${this.health - oldHealth} 点生命值。</p>`;
            }
        }

        const index = this.inventory.findIndex(invItem => invItem.name === item.name);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
    }

    receiveItemDrop() {
        const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
        const rarityIndex = Math.min(this.level, rarities.length - 1);
        const rarity = rarities[rarityIndex];

        const items = {
            "common": [
                new Item("治愈药剂", "恢复 80-120 点生命值", "potion", "health", Math.floor(Math.random() * 41) + 80, "common")
            ],
            "uncommon": [
                new Item("强效治愈药剂", "恢复 150-250 点生命值", "potion", "health", Math.floor(Math.random() * 101) + 150, "uncommon"),
                new Item("短刀", "装备时增加 10-15 点攻击力", "equipment", "weapon", null, 0, 0, Math.floor(Math.random() * 6) + 10, 0, 0, 0, 0, "uncommon")
            ],
            "rare": [
                new Item("超级治愈药剂", "恢复 300-500 点生命值", "potion", "health", Math.floor(Math.random() * 201) + 300, "rare"),
                new Item("长剑", "装备时增加 20-30 点攻击力", "equipment", "weapon", null, 0, 0, Math.floor(Math.random() * 11) + 20, 0, 0, 0, 0, "rare")
            ],
            "epic": [
                new Item("神圣治愈药剂", "恢复全部生命值", "potion", "health", 9999, "epic"),
                new Item("屠龙大剑", "装备时增加 50-70 点攻击力和 10% 暴击率", "equipment", "weapon", null, 0, 0, Math.floor(Math.random() * 21) + 50, 0, 10, 0, 0, "epic")
            ],
            "legendary": [
                new Item("英雄徽章", "装备时增加 20 点攻击力、20 点防御力", "equipment", "accessory", "medal", 20, 20, 0, 0, 0, 0, 0, 0, "legendary")
            ]
        };

        const availableItems = items[rarity];
        const droppedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        this.addInventory(droppedItem);
    }
}

class Monster {
    constructor(name, health, attack, defense, souls, gold, rarity = "普通", skills = null) {
        this.name = name;
        this.health = health;
        this.initialHealth = health;
        this.attack = attack;
        this.defense = defense;
        this.souls = souls;
        this.gold = gold;
        this.rarity = rarity;
        this.skills = skills || [];
    }

    attackPlayer(player) {
        let damage = Math.max(1, Math.floor(this.attack - player.defense * 0.5));
        player.health -= damage;

        const log = document.getElementById('log');
        log.innerHTML += `<p>${this.name} 对你造成了 ${damage} 点伤害。</p>`;

        if (player.health <= 0) {
            log.innerHTML += "<p>你被击败了！游戏结束。</p>";
        } else {
            const healthPercent = Math.floor((player.health / player.maxHealth) * 100);
            log.innerHTML += `<p>你的剩余生命值: ${player.health} (${healthPercent}%)</p>`;
        }
    }
}

class Boss extends Monster {
    constructor(name, health, attack, defense, souls, gold) {
        super(name, health, attack, defense, souls, gold, "BOSS");
        this.skills = [
            "高伤害攻击",
            "范围攻击",
            "可能施放减益效果",
            "生命值低于30%时会狂暴"
        ];
    }

    attackPlayer(player) {
        if (this.health < this.initialHealth * 0.3 && this.skills.includes("生命值低于30%时会狂暴")) {
            const log = document.getElementById('log');
            log.innerHTML += `<p>${this.name} 生命值低于30%，进入狂暴状态！攻击力提升50%！</p>`;
            damage = Math.max(1, Math.floor(this.attack * 1.5 - player.defense * 0.5));
        } else {
            damage = Math.max(1, Math.floor(this.attack - player.defense * 0.5));
        }

        player.health -= damage;
        const log = document.getElementById('log');
        log.innerHTML += `<p>${this.name} 对你造成了 ${damage} 点伤害。</p>`;

        if (player.health <= 0) {
            log.innerHTML += "<p>你被击败了！游戏结束。</p>";
        } else {
            const healthPercent = Math.floor((player.health / player.maxHealth) * 100);
            log.innerHTML += `<p>你的剩余生命值: ${player.health} (${healthPercent}%)</p>`;
        }
    }
}

class Game {
    constructor() {
        this.player = null;
        this.monsters = [];
        this.bosses = [];
        this.shopItems = [];
        this.initGame();
        this.setupEventListeners();
    }

    initGame() {
        const playerName = document.getElementById('player-name').value;
        if (playerName) {
            this.player = new Character(playerName);

            const starterWeapon = new Item("新手木剑", "初学者的木剑+5攻击力", "equipment", null, "weapon", null, 5, 0, 0, 0, 0, 0, 0, "common");
            const starterArmor = new Item("粗布衣衫", "初学者的衣服+3防御力", "equipment", null, "armor", null, 0, 3, 0, 0, 0, 0, 0, "common");
            const starterRing = new Item("新手铜戒", "初学者的戒指+2攻击力", "equipment", null, "accessory", "ring", 2, 0, 0, 0, 0, 0, 0, "common");

            this.player.equipment.weapon = starterWeapon;
            this.player.equipment.armor = starterArmor;
            this.player.equipment.accessories.ring = starterRing;

            this.monsters = [
                new Monster("腐尸骷髅", 50, 10, 3, 10, 5, "普通", ["可能闪避攻击"]),
                new Monster("洞穴鼠", 30, 8, 1, 5, 3, "普通", ["可能逃跑"]),
                new Monster("暗影蝙蝠", 40, 12, 2, 8, 4, "普通", ["可能会吸血"]),
                new Monster("迟缓僵尸", 70, 15, 5, 15, 8, "普通", ["可能迟缓攻击"]),
                new Monster("怨灵鬼魂", 60, 18, 4, 18, 10, "普通", ["可能造成恐惧"]),
                new Monster("嗜血狼人", 80, 20, 6, 20, 12, "普通", ["可能暴击"]),
                new Monster("岩石石像鬼", 100, 15, 10, 25, 15, "普通", ["物理攻击减半"]),
                new Monster("幽灵幻影", 70, 25, 3, 22, 13, "普通", ["可能穿透防御"]),
                new Monster("黏性黏液怪", 90, 18, 7, 23, 14, "普通", ["可能降低攻击速度"]),
                new Monster("黑暗术士", 60, 30, 5, 30, 20, "普通", ["可能施放魔法"]),
            ];

            this.bosses = [
                new Boss("骷髅统领", 300, 40, 20, 100, 50),
                new Boss("巨型毒蛛", 250, 35, 15, 80, 40),
                new Boss("火焰巨魔", 400, 50, 25, 150, 75),
                new Boss("冰霜冰龙", 500, 60, 30, 200, 100),
                new Boss("黑暗魔王", 700, 80, 40, 300, 150)
            ];

            this.shopItems = [
                new Item("治愈药剂", "恢复 100 点生命值", "potion", "health", 100, "common", 0, 0, 0, 20),
                new Item("强效治愈药剂", "恢复 300 点生命值", "potion", "health", 300, "uncommon", 0, 0, 0, 50),
                new Item("生命精华药剂", "永久增加 50 点最大生命值", "stat", "health_capacity", 50, "uncommon", 0, 0, 0, 100),
                new Item("攻击强化药剂", "永久增加 10 点攻击力", "stat", "attack", 10, "uncommon", 0, 0, 0, 120),
                new Item("防御强化药剂", "永久增加 10 点防御力", "stat", "defense", 10, "uncommon", 0, 0, 0, 120),
                new Item("铁质长剑", "锋利的铁剑 增加 15 点攻击力", "equipment", "weapon", null, 15, 0, 0, 150),
                new Item("皮质铠甲", "坚韧的皮甲 增加 12 点防御力", "equipment", "armor", null, 0, 12, 0, 150),
                new Item("英雄徽章", "传说中的英雄勋章 增加 20 点攻击力 20 点防御力", "equipment", "accessory", "medal", 20, 20, 0, 800)
            ];

            document.getElementById('welcome-screen').classList.add('hidden');
            document.getElementById('game-main').classList.remove('hidden');
            this.updateUI();
        }
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            if (!this.player) this.initGame();
        });

        document.getElementById('explore-btn').addEventListener('click', () => {
            if (this.player) this.explore();
        });

        document.getElementById('status-btn').addEventListener('click', () => {
            if (this.player) this.player.displayStatus();
        });

        document.getElementById('inventory-btn').addEventListener('click', () => {
            if (this.player) this.showInventory();
        });

        document.getElementById('shop-btn').addEventListener('click', () => {
            if (this.player) this.showShop();
        });

        document.getElementById('sell-btn').addEventListener('click', () => {
            if (this.player) this.sellItem();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            if (this.player) this.saveGame();
        });

        document.getElementById('load-btn').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('attack-btn').addEventListener('click', () => {
            if (this.player && this.monster) this.player.attackMonster(this.monster);
            if (this.monster && this.monster.health > 0) this.monster.attackPlayer(this.player);
        });

        document.getElementById('use-item-btn').addEventListener('click', () => {
            if (this.player) this.useItem();
        });

        document.getElementById('run-btn').addEventListener('click', () => {
            if (this.player && this.monster) this.runFromBattle();
        });
    }

    explore() {
        document.getElementById('log').innerHTML = "";
        document.getElementById('log').classList.remove('hidden');
        document.getElementById('battle-screen').classList.remove('hidden');

        if (this.player.defeatedEnemies > 0 && this.player.defeatedEnemies % 10 === 0) {
            const bossIndex = Math.min(Math.floor(this.player.defeatedEnemies / 10) - 1, this.bosses.length - 1);
            this.monster = new Boss(
                this.bosses[bossIndex].name,
                this.bosses[bossIndex].health,
                this.bosses[bossIndex].attack,
                this.bosses[bossIndex].defense,
                this.bosses[bossIndex].souls,
                this.bosses[bossIndex].gold
            );
        } else {
            const maxIndex = this.player.defeatedEnemies < 5 ? 3 : 
                           this.player.defeatedEnemies < 10 ? 6 : 
                           this.player.defeatedEnemies < 20 ? 8 : 
                           this.monsters.length - 1;
            const monsterPrototype = this.monsters[Math.floor(Math.random() * (maxIndex + 1))];
            this.monster = new Monster(
                monsterPrototype.name,
                monsterPrototype.initialHealth,
                monsterPrototype.attack,
                monsterPrototype.defense,
                monsterPrototype.souls,
                monsterPrototype.gold,
                monsterPrototype.rarity,
                monsterPrototype.skills
            );
        }

        const monsterInfo = document.getElementById('monster-info');
        monsterInfo.innerHTML = `
            <p>你遇到了 ${this.monster.name}！</p>
            <p>生命值: ${this.monster.health}</p>
        `;
    }

    updateUI() {
        if (this.player) {
            document.getElementById('player-health').textContent = `生命值: ${this.player.health}/${this.player.maxHealth}`;
            document.getElementById('player-level').textContent = `等级: ${this.player.level}`;
            document.getElementById('player-gold').textContent = `金币: ${this.player.gold}`;
        }
    }

    showInventory() {
        const inventory = document.getElementById('log');
        inventory.innerHTML = "<h3>背包</h3>";
        if (this.player.inventory.length === 0) {
            inventory.innerHTML += "<p>背包为空</p>";
        } else {
            this.player.inventory.forEach((item, index) => {
                inventory.innerHTML += `<p>${index + 1}. ${item.name} - ${item.description}</p>`;
            });
        }
        inventory.classList.remove('hidden');
    }

    showShop() {
        const shop = document.getElementById('log');
        shop.innerHTML = "<h3>商店</h3>";
        this.shopItems.forEach((item, index) => {
            shop.innerHTML += `<p>${index + 1}. ${item.name} - ${item.description} (${item.goldCost} 金币)</p>`;
        });
        shop.classList.remove('hidden');
    }

    sellItem() {
        const inventory = document.getElementById('log');
        inventory.innerHTML = "<h3>背包物品</h3>";
        if (this.player.inventory.length === 0) {
            inventory.innerHTML += "<p>背包为空</p>";
            return;
        }
        this.player.inventory.forEach((item, index) => {
            const sellPrice = Math.floor(item.goldCost * 0.8);
            inventory.innerHTML += `<p>${index + 1}. ${item.name} - 售价: ${sellPrice} 金币</p>`;
        });
        inventory.classList.remove('hidden');

        const sellBtn = document.createElement('button');
        sellBtn.id = 'confirm-sell-btn';
        sellBtn.textContent = '确认售卖';
        sellBtn.addEventListener('click', () => {
            const index = parseInt(prompt("请输入要售卖的物品编号: ")) - 1;
            if (index >= 0 && index < this.player.inventory.length) {
                const item = this.player.inventory[index];
                this.player.gold += Math.floor(item.goldCost * 0.8);
                this.player.inventory.splice(index, 1);
                this.updateUI();
                this.showInventory();
            }
        });
        inventory.appendChild(sellBtn);
    }

    useItem() {
        const inventory = document.getElementById('log');
        inventory.innerHTML = "<h3>背包物品</h3>";
        if (this.player.inventory.length === 0) {
            inventory.innerHTML += "<p>背包为空</p>";
            return;
        }
        this.player.inventory.forEach((item, index) => {
            inventory.innerHTML += `<p>${index + 1}. ${item.name} - ${item.description}</p>`;
        });
        inventory.classList.remove('hidden');

        const useBtn = document.createElement('button');
        useBtn.id = 'confirm-use-btn';
        useBtn.textContent = '使用物品';
        useBtn.addEventListener('click', () => {
            const index = parseInt(prompt("请输入要使用的物品编号: ")) - 1;
            if (index >= 0 && index < this.player.inventory.length) {
                const item = this.player.inventory[index];
                this.player.useItem(item);
                this.updateUI();
            }
        });
        inventory.appendChild(useBtn);
    }

    runFromBattle() {
        if (Math.random() < 0.5) {
            const log = document.getElementById('log');
            log.innerHTML += "<p>你成功逃跑了！</p>";
            document.getElementById('battle-screen').classList.add('hidden');
        } else {
            const log = document.getElementById('log');
            log.innerHTML += "<p>逃跑失败！</p>";
            this.monster.attackPlayer(this.player);
        }
    }

    saveGame() {
        const playerName = prompt("请输入存档名称:");
        if (playerName) {
            localStorage.setItem(playerName, JSON.stringify({
                name: this.player.name,
                level: this.player.level,
                exp: this.player.exp,
                expToNextLevel: this.player.expToNextLevel,
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                attack: this.player.attack,
                defense: this.player.defense,
                gold: this.player.gold,
                inventory: this.player.inventory.map(item => ({
                    name: item.name,
                    description: item.description,
                    type: item.type,
                    effectAttribute: item.effectAttribute,
                    effectValue: item.effectValue,
                    slot: item.slot,
                    accessoryType: item.accessoryType,
                    attackBonus: item.attackBonus,
                    defenseBonus: item.defenseBonus,
                    goldCost: item.goldCost,
                    criticalChance: item.criticalChance,
                    damageReduction: item.damageReduction,
                    lifesteal: item.lifesteal,
                    rarity: item.rarity
                }))
            }));
            alert("游戏已保存");
        }
    }

    loadGame() {
        const saves = Object.keys(localStorage);
        if (saves.length === 0) {
            alert("没有找到存档");
            return;
        }
        const saveName = prompt("请输入要加载的存档名称:", saves[0]);
        if (saveName) {
            const saveData = JSON.parse(localStorage.getItem(saveName));
            if (saveData) {
                this.player = new Character(saveData.name);
                this.player.level = saveData.level;
                this.player.exp = saveData.exp;
                this.player.expToNextLevel = saveData.expToNextLevel;
                this.player.health = saveData.health;
                this.player.maxHealth = saveData.maxHealth;
                this.player.attack = saveData.attack;
                this.player.defense = saveData.defense;
                this.player.gold = saveData.gold;
                this.player.inventory = saveData.inventory.map(itemData => new Item(
                    itemData.name,
                    itemData.description,
                    itemData.type,
                    itemData.effectAttribute,
                    itemData.effectValue,
                    itemData.slot,
                    itemData.accessoryType,
                    itemData.attackBonus,
                    itemData.defenseBonus,
                    itemData.goldCost,
                    itemData.criticalChance,
                    itemData.damageReduction,
                    itemData.lifesteal,
                    itemData.rarity
                ));
                alert("游戏已加载");
                this.updateUI();
                this.showInventory();
            }
        }
    }
}

window.onload = function() {
    new Game();
};