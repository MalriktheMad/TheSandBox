const INVENTORY_STORAGE_KEY = "lab-zero-inventory";

const ITEM_DEFINITIONS = {
  sunflowerSeeds: {
    name: "Sunflower Seeds",
    description: "Tiny treasures for hungry birds and future trades.",
    emptyDescription: "None yet.",
    usable: false
  },
  milletSeeds: {
    name: "Millet Seeds",
    description: "A classic bird snack with excellent negotiation potential.",
    emptyDescription: "None yet.",
    usable: false
  },
  cig: {
    name: "Cig",
    description: "A questionable emergency escape plan.",
    emptyDescription: "Used up.",
    usable: true
  }
};

const STARTING_INVENTORY = {
  sunflowerSeeds: 0,
  milletSeeds: 0,
  cig: 1
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
  sessionStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({
    ...STARTING_INVENTORY,
    ...inventory
  }));
}

function getInventoryItemCount(itemId) {
  return getInventory()[itemId] || 0;
}

function hasInventoryItem(itemId, amount = 1) {
  return getInventoryItemCount(itemId) >= amount;
}

function addInventoryItem(itemId, amount = 1) {
  if (!ITEM_DEFINITIONS[itemId]) {
    return false;
  }

  const inventory = getInventory();
  inventory[itemId] = Math.max(0, (inventory[itemId] || 0) + amount);
  saveInventory(inventory);
  return true;
}

function removeInventoryItem(itemId, amount = 1) {
  if (!ITEM_DEFINITIONS[itemId] || !hasInventoryItem(itemId, amount)) {
    return false;
  }

  const inventory = getInventory();
  inventory[itemId] = Math.max(0, (inventory[itemId] || 0) - amount);
  saveInventory(inventory);
  return true;
}

function useInventoryItem(itemId) {
  if (itemId === "cig" && hasInventoryItem("cig")) {
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
    itemDescription.textContent = count > 0 ? item.description : item.emptyDescription;

    const itemCount = document.createElement("strong");
    itemCount.textContent = `x${count}`;

    itemDetails.append(itemName, itemDescription);
    itemElement.append(itemDetails, itemCount);

    if (item.usable) {
      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.textContent = count > 0 ? "Use" : "Gone";
      useButton.disabled = count <= 0;
      useButton.addEventListener("click", () => useInventoryItem(itemId));
      itemElement.append(useButton);
    }

    inventoryList.append(itemElement);
  });
}

renderInventory();
