Hooks.once("ready", () => {
  // Register setting to switch between blind and private Death Saves
  game.settings.register("blind-death-saves", "mode", {
    name: game.i18n.localize("BLINDDEATHSAVES.mode.name"),
    hint: game.i18n.localize("BLINDDEATHSAVES.mode.hint"),
    type: String,
    choices: {
      blind: game.i18n.localize("BLINDDEATHSAVES.mode.blind"),
      private: game.i18n.localize("BLINDDEATHSAVES.mode.private"),
    },
    default: "blind",
    scope: "world",
    config: true,
    restricted: true,
  });

  // @deprecated
  game.settings.register("blind-death-saves", "blindDeathSaves", {
    name: "legacy mode setting",
    hint: "don't touch this",
    type: Boolean,
    default: true,
    scope: "world",
    config: false,
    restricted: true,
  });

  /**
   * a bit of migration:
   * if 'blindDeathSaves' had been set to 'false' previously, change the new 'mode' to 'private' accordingly
   * the 'true' case doesn't need to be handled, since that corresponds to the new default anyway
   */
  if (!game.settings.get("blind-death-saves", "blindDeathSaves")) {
    game.settings.set("blind-death-saves", "mode", "private");
    // reset legacy setting so it won't mess things up if it is removed in the future
    game.settings.set("blind-death-saves", "blindDeathSaves", true); 
  }
});

// Hook into chat message creation and catch death saves
Hooks.on("preCreateChatMessage", (msg, options, userId) => {
  const blindDeathSaves = game.settings.get("blind-death-saves", "mode") === "blind";
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
  if (game.settings.get("blind-death-saves", "mode") === "blind" && !game.user.isGM || !data.owner) {
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
