Hooks.on("init", () => {
  // Register settings to disable blind Death Saves
  game.settings.register("blind-death-saves", "blindDeathSaves", {
    name: game.i18n.localize("BLINDDEATHSAVES.blindDeathSaves.name"),
    hint: game.i18n.localize("BLINDDEATHSAVES.blindDeathSaves.hint"),
    type: Boolean,
    default: true,
    scope: "world",
    config: true,
    restricted: true,
  });
});

// Hook into chat message creation and catch death saves
Hooks.on("preCreateChatMessage", (msg, options, userId) => {
  const blindDeathSaves = game.settings.get("blind-death-saves", "blindDeathSaves");
  // check for death saving throw
  if (msg.data.flags && msg.data.flags.dnd5e?.roll?.type === "death") {
    // collect user ids of GMs
    const gmIds = ChatMessage.getWhisperRecipients("GM").map((user) => user.data._id);

    // update ChatMessage by setting the blind flag and GMs as recipients
    msg.data.update({
      blind: blindDeathSaves,
      whisper: gmIds,
    });

    if (blindDeathSaves) {
      // whisper explanation for hidden roll to player
      ChatMessage.create({
        whisper: [game.user.id],
        speaker: {
          alias: game.i18n.localize("BLINDDEATHSAVES.notificationAlias"),
        },
        content: game.i18n.localize("BLINDDEATHSAVES.notificationText")
      });
    }
  }
});

// Remove death save counters from character sheet (only for Players)
Hooks.on("renderActorSheet", async function (app, html, data) {
  if (game.settings.get("blind-death-saves", "blindDeathSaves") && !game.user.isGM) {
    if (app.options.classes.includes("tidy5e")) {
      let tidyDeathSaveIconSuccess = $(html).find(
        "div.death-saves > div > i.fas.fa-check"
      );
      let tidyDeathSaveCounterSuccess = $(html).find(
        "div.death-saves > div > input[type=text]:nth-child(2)"
      );
      let tidyDeathSaveIconFailure = $(html).find(
        "div.death-saves > div > i.fas.fa-times"
      );
      let tidyDeathSaveCounterFailure = $(html).find(
        "div.death-saves > div > input[type=text]:nth-child(4)"
      );

      tidyDeathSaveIconSuccess.remove();
      tidyDeathSaveCounterSuccess.remove();
      tidyDeathSaveIconFailure.remove();
      tidyDeathSaveCounterFailure.remove();
    }
    else {
      let deathSaveCounters = $(html).find(
        "div.counter.flexrow.death-saves > div.counter-value"
      );
      deathSaveCounters.remove();
    }
  }
});
