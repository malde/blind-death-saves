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
});

const blindMode = () => {
  return game.settings.get("blind-death-saves", "mode") === "blind";
}

// Skip success and failure messages (legacy)
Hooks.on("dnd5e.rollDeathSave", (actor, roll, details) => {
   if (details.chatString === "DND5E.DeathSaveSuccess") {
     details.chatString = undefined;
     // we explicitly want the 3 successes visible on the character sheet, so we override the default behaviour here
     details.updates = {
       "system.attributes.death.success": Math.clamped(3, 0, 3)
     };
   }
   else if (details.chatString === "DND5E.DeathSaveFailure") {
     details.chatString = undefined;
   }
});

// Skip success and failure messages (V2)
/* TODO broken because of destructured data param
Hooks.on("dnd5e.rollDeathSaveV2", (rolls, data) => {
   if (data.chatString === "DND5E.DeathSaveSuccess") {
     data.chatString = undefined;
     // we explicitly want the 3 successes visible on the character sheet, so we override the default behaviour here
     data.updates = {
       "system.attributes.death.success": Math.clamped(3, 0, 3)
     };
   }
   else if (data.chatString === "DND5E.DeathSaveFailure") {
     data.chatString = undefined;
   }
});
*/

// Hook into chat message creation and catch death saves
Hooks.on("preCreateChatMessage", (msg, options, userId) => {
  // check for death saving throw
  if (msg.flags && msg.flags.dnd5e?.roll?.type === "death") {
    // update ChatMessage by setting the blind flag and GMs as recipients
    msg.updateSource({
      blind: blindMode(),
      whisper: game.users.activeGM.id,
    });
  }
  /* TODO this is ugly as hell and only stops the message
  let success = game.i18n.format("DND5E.DeathSaveSuccess", { name: options.speaker.alias });
  let failure = game.i18n.format("DND5E.DeathSaveFailure", { name: options.speaker.alias });
  if (msg.content === success || msg.content === failure) {
    return false;
  }
  */
});

// Remove death save counters from character sheet (only for Players)
Hooks.on("renderActorSheet", async function (app, html, data) {
  if (blindMode() && !game.user.isGM || !data.owner) {
    if (app.options.classes.includes("tidy5e-sheet")) {
      const tidyDeathSaveIconSuccess = $(html).find(
        ".death-saves .fa-check"
      );
      const tidyDeathSaveCounterSuccessAndFailure = $(html).find(
        `.death-saves .death-save-result`
      );
      const tidyDeathSaveIconFailure = $(html).find(
        ".death-saves .fa-times"
      );

      tidyDeathSaveIconSuccess.remove();
      tidyDeathSaveCounterSuccessAndFailure.remove();
      tidyDeathSaveIconFailure.remove();
    }
    else {
      const deathSaveCounters = $(html).find(
          ".death-tray .death-saves .pips"
      );
      deathSaveCounters.remove();
    }
  }
});

Hooks.on("renderPortraitPanelArgonComponent", (portraitPanel, element, actor) => {
  if (blindMode() && !game.user.isGM) {
    const deathSaveResultContainers = $(element).find(
        ".death-save-result-container"
    );
    deathSaveResultContainers.remove();
  }
});
