// Hook into chat message creation and make death saves blind
Hooks.on("preCreateChatMessage", (msg, options, userId) => {
  if (msg.data.flags && msg.data.flags.dnd5e?.roll?.type === "death") {
    const gms = ChatMessage.getWhisperRecipients("GM");
    const gmIds = gms.map((user) => user.data._id);
    const updates = {
      blind: true,
      whisper: gmIds,
    };
    msg.data.update(updates);
  }
});

Hooks.on("init", () => {
  // Register settings to hide Death Save from player's character sheet
  game.settings.register("blind-death-saves", "hiddenDeathSaveStatus", {
    name: "Hide Death Save Status",
    hint: "Death Save status counters will be hidden for Players in their character sheets.",
    type: Boolean,
    default: false,
    scope: "world",
    config: true,
    restricted: true,
  });
});

// Remove death save counters from character sheet (only for Players)
Hooks.on("renderActorSheet", async function (app, html, data) {
  if (
    game.settings.get("blind-death-saves", "hiddenDeathSaveStatus") &&
    !game.user.isGM
  ) {
    let deathSaveCounters = $(html).find(
      "div.counter.flexrow.death-saves > div.counter-value"
    );
    deathSaveCounters.remove();
  }
});
