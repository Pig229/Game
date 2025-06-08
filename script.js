class Item {
    constructor(name, description, item_type, effect_attribute = null, effect_value = 0, 
                slot = null, accessory_type = null, attack_bonus = 0, defense_bonus = 0, 
                gold_cost = 0, critical_chance = 0, damage_reduction = 0, lifesteal = 0, rarity = "common") {
        this.name = name;
        this.description = description;
        this.type = item_type;
        this.effectAttribute = effect_attribute;
        this.effectValue = effect_value;
        this.slot = slot;
        this.accessoryType = accessory_type;
        this.attackBonus = attack_bonus;
        this.defenseBonus = defense_bonus;
        this.goldCost = gold_cost;
        this.criticalChance = critical_chance;
        this.damageReduction = damage_reduction;
        this.lifesteal = lifesteal;
        this.rarity = rarity;
    }

    calculatePrice() {
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
        }

        const rarityMultipliers = {
            "common": 1.0,
            "uncommon": 1.5,
            "rare": 2.5,
            "epic": 4.0,
            "legendary": 7.0
        };

        basePrice = basePrice * (rarityMultipliers[this.rarity] || 1.0);
        return Math.max(5, Math.round(basePrice));
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

    updateStats() {
        let totalAttack = this.attack;
        let totalDefense = this.defense;

        if (this.equipment.weapon) {
            totalAttack += this.equipment.weapon.attackBonus;
        }

        if (this.equipment.armor) {
            totalDefense += this.equipment.armor.defenseBonus;
        }

        Object.values(this.equipment.accessories).forEach(accessory => {
            if (accessory) {
                totalAttack += accessory.attackBonus || 0;
                totalDefense += accessory.defenseBonus || 0;
            }
        });

        return { totalAttack, totalDefense };
    }

    displayStatus() {
        const { totalAttack, totalDefense } = this.updateStats();

        let healthBar = "";
        let healthPercent = Math.floor((this.health / this.maxHealth) * 20);
        healthBar = "█".repeat(healthPercent) + "░".repeat(20 - healthPercent);

        const statusHTML = `
            <p>名称: ${this.name}</p>
            <p>等级: ${this.level} (${this.exp}/${this.expToNextLevel} EXP)</p>
            <p>生命值: ${this.health}/${this.maxHealth} ${healthBar}</p>
            <p>攻击力: ${totalAttack} (基础: ${this.attack}, 装备: ${totalAttack - this.attack})</p>
            <p>防御力: ${totalDefense} (基础: ${this.defense}, 装备: ${totalDefense - this.defense})</p>
            <p>金币: ${this.gold}</p>
            <p>灵魂: ${this.souls}</p>
            <p>击败敌人: ${this.defeatedEnemies}</p>
        `;

        document.getElementById('status-content').innerHTML = statusHTML;
    }

    attackMonster(monster) {
        const { totalAttack } = this.updateStats();
        const isCritical = Math.random() < this.criticalChance / 100;
        const damageMultiplier = isCritical ? this.criticalEffect / 100 : 1.0;

        let damage = Math.max(1, Math.floor(totalAttack * damageMultiplier - monster.defense * 0.5));

        monster.health -= damage;
        monster.health = Math.max(0, monster.health);

        const log = document.getElementById('log');
        log.innerHTML += `<p>${isCritical ? "<strong>暴击！</strong>" : ""}你对 ${monster.name} 造成了 ${damage} 点伤害。</p>`;

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
            log.innerHTML += `<p>${monster.name} 剩余生命值: ${monster.health}</p>`;
        }

        if (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }

        this.displayStatus();
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

        this.displayStatus();
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
            // 其他效果类似...
        } else if (item.type === "equipment") {
            if (item.slot === "weapon" && this.equipment.weapon) {
                this.inventory.push(this.equipment.weapon);
            } else if (item.slot === "armor" && this.equipment.armor) {
                this.inventory.push(this.equipment.armor);
            } else if (item.slot === "accessory" && item.accessoryType && this.equipment.accessories[item.accessoryType]) {
                this.inventory.push(this.equipment.accessories[item.accessoryType]);
            }

            if (item.slot === "weapon") {
                this.equipment.weapon = item;
            } else if (item.slot === "armor") {
                this.equipment.armor = item;
            } else if (item.slot === "accessory") {
                this.equipment.accessories[item.accessoryType] = item;
            }

            const index = this.inventory.indexOf(item);
            if (index > -1) {
                this.inventory.splice(index, 1);
            }
        }

        this.displayStatus();
    }

    receiveItemDrop() {
        const rarity = this.level < 5 ? "common" : this.level < 10 ? "uncommon" : "rare";
        const items = {
            "common": [
                new Item("治愈药剂", "恢复 80-120 点生命值", "potion", "health", Math.floor(Math.random() * 41) + 80, "common")
            ],
            "uncommon": [
                new Item("强效治愈药剂", "恢复 150-250 点生命值", "potion", "health", Math.floor(Math.random() * 101) + 150, "uncommon"),
                new Item("短刀", "装备时增加 10-15 点攻击力", "equipment", null, 0, "weapon", null, Math.floor(Math.random() * 6) + 10, 0, 0, 0, 0, "uncommon")
            ],
            "rare": [
                new Item("超级治愈药剂", "恢复 300-500 点生命值", "potion", "health", Math.floor(Math.random() * 201) + 300, "rare"),
                new Item("长剑", "装备时增加 20-30 点攻击力", "equipment", null, 0, "weapon", null, Math.floor(Math.random() * 11) + 20, 0, 0, 0, 0, "rare")
            ]
        };

        const itemPool = items[rarity];
        const item = itemPool[Math.floor(Math.random() * itemPool.length)];
        this.addInventory(item);
    }
}

class Monster {
    constructor(name, health, attack, defense, souls, gold) {
        this.name = name;
        this.health = health;
        this.attack = attack;
        this.defense = defense;
        this.souls = souls;
        this.gold = gold;
    }

    attackPlayer(player) {
        let damage = Math.max(1, Math.floor(this.attack - player.defense * 0.5));
        player.health -= damage;

        const log = document.getElementById('log');
        log.innerHTML += `<p>${this.name} 对你造成了 ${damage} 点伤害。</p>`;

        if (player.health <= 0) {
            log.innerHTML += "<p>你被击败了！游戏结束。</p>";
        } else {
            log.innerHTML += `<p>你的剩余生命值: ${player.health}</p>`;
        }
    }
}

class Game {
    constructor() {
        this.player = null;
        this.monsters = [];
        this.shopItems = [];
        this.initGame();
        this.setupEventListeners();
    }

    initGame() {
        const playerName = document.getElementById('player-name').value;
        if (playerName) {
            this.player = new Character(playerName);
            this.monsters = [
                new Monster("腐尸骷髅", 50, 10, 3, 10, 5),
                new Monster("洞穴鼠", 30, 8, 1, 5, 3),
                new Monster("暗影蝙蝠", 40, 12, 2, 8, 4),
                new Monster("迟缓僵尸", 70, 15, 5, 15, 8),
                new Monster("怨灵鬼魂", 60, 18, 4, 18, 10)
            ];

            this.shopItems = [
                new Item("治愈药剂", "恢复 100 点生命值", "potion", "health", 100, "common", 0, 0, 0, 20),
                new Item("铁质长剑", "增加 15 点攻击力", "equipment", null, 0, "weapon", null, 15, 0, 0, 0, 0, 150)
            ];
        }
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            if (!this.player) this.initGame();
            if (this.player) {
                document.getElementById('welcome-screen').classList.add('hidden');
                document.getElementById('game-main').classList.remove('hidden');
                this.player.displayStatus();
            }
        });

        document.getElementById('explore-btn').addEventListener('click', () => {
            if (!this.player) return;
            this.explore();
        });

        document.getElementById('inventory-btn').addEventListener('click', () => {
            if (!this.player) return;
            this.showInventory();
        });

        document.getElementById('shop-btn').addEventListener('click', () => {
            if (!this.player) return;
            this.showShop();
        });

        document.getElementById('attack-btn').addEventListener('click', () => {
            if (!this.player || !this.monster) return;
            this.player.attackMonster(this.monster);
            if (this.monster.health > 0) {
                this.monster.attackPlayer(this.player);
                if (this.player.health <= 0) {
                    // 游戏结束逻辑
                }
            }
        });
    }

    explore() {
        document.getElementById('log').innerHTML = "";
        document.getElementById('log').classList.remove('hidden');
        document.getElementById('battle-screen').classList.remove('hidden');

        const monsterIndex = Math.floor(Math.random() * this.monsters.length);
        this.monster = this.monsters[monsterIndex];
        document.getElementById('monster-info').innerHTML = `
            <p>你遇到了 ${this.monster.name}！</p>
            <p>生命值: ${this.monster.health}</p>
        `;
    }

    showInventory() {
        let inventoryHTML = "<h3>背包</h3>";
        if (this.player.inventory.length === 0) {
            inventoryHTML += "<p>背包为空</p>";
        } else {
            this.player.inventory.forEach((item, index) => {
                inventoryHTML += `<p>${index + 1}. ${item.name} - ${item.description}</p>`;
            });
        }

        document.getElementById('log').innerHTML = inventoryHTML;
        document.getElementById('log').classList.remove('hidden');
    }

    showShop() {
        let shopHTML = "<h3>商店</h3>";
        this.shopItems.forEach((item, index) => {
            shopHTML += `<p>${index + 1}. ${item.name} - ${item.description} (${item.goldCost} 金币)</p>`;
        });

        document.getElementById('log').innerHTML = shopHTML;
        document.getElementById('log').classList.remove('hidden');
    }
}

// 当页面加载完成后初始化游戏
window.onload = function() {
    new Game();
};