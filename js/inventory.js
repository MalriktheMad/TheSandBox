const INVENTORY_STORAGE_KEY = "lab-zero-inventory";

const ITEM_DEFINITIONS = {
  cig: {
    name: "Cig",
    description: "A questionable emergency escape plan.",
    usable: true
  },
  sunflowerSeeds: {
    name: "Sunflower Seeds",
    description: "Tiny treasures for hungry birds and future trades.",
    usable: false
  }
};

const STARTING_INVENTORY = {
  cig: 1,
  sunflowerSeeds: 0
};

function getInventory() {
  const savedInventory = sessionStorage.getItem(INVENTORY_STORAGE_KEY);

  if (!savedInventory) {
    return { ...STARTING_INVENTORY };
  }

  try {
    return {
      ...STARTING_INVENTORY,
      ...JSON.parse(savedInventory)
    };
  } catch (error) {
    sessionStorage.removeItem(INVENTORY_STORAGE_KEY);
    return { ...STARTING_INVENTORY };
  }
}

function saveInventory(inventory) {
  sessionStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

function addInventoryItem(itemId, amount = 1) {
  if (!ITEM_DEFINITIONS[itemId]) {
    return;
  }

  const inventory = getInventory();
  inventory[itemId] = Math.max(0, (inventory[itemId] || 0) + amount);
  saveInventory(inventory);
}

function useInventoryItem(itemId) {
  if (itemId === "cig" && getInventory().cig > 0) {
    window.location.href = "one-cig.html";
  }
}

function renderInventory() {
  const inventoryList = document.querySelector("[data-inventory-list]");

  if (!inventoryList) {
    return;
  }

  const inventory = getInventory();
  inventoryList.innerHTML = "";

  Object.entries(ITEM_DEFINITIONS).forEach(([itemId, item]) => {
    const count = inventory[itemId] || 0;
    const itemElement = document.createElement("article");
    itemElement.className = "inventory-item";

    const itemDetails = document.createElement("div");
    itemDetails.className = "item-details";

    const itemName = document.createElement("h2");
    itemName.textContent = item.name;

    const itemDescription = document.createElement("p");
    itemDescription.textContent = item.description;

    const itemCount = document.createElement("strong");
    itemCount.textContent = `x${count}`;

    itemDetails.append(itemName, itemDescription);
    itemElement.append(itemDetails, itemCount);

    if (item.usable) {
      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.textContent = "Use";
      useButton.disabled = count <= 0;
      useButton.addEventListener("click", () => useInventoryItem(itemId));
      itemElement.append(useButton);
    }

    inventoryList.append(itemElement);
  });
}

renderInventory();
