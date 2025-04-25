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

// Skip success and failure messages
Hooks.on("dnd5e.rollDeathSaveV2", (rolls, details) => {
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
});

// Remove death save counters from character sheet (only for Players)
Hooks.on("renderActorSheetV2", async function (app, html, data) {
  if (blindMode() && !game.user.isGM || !data.owner) {
    if (app.options.classes.includes("tidy5e-sheet")) {
      html.querySelectorAll(".death-saves .fa-check").forEach(success => success.remove());
      html.querySelectorAll(".death-saves .death-save-result").forEach(counter => counter.remove());
      html.querySelectorAll(".death-saves .fa-times").forEach(failure => failure.remove());
    }
    else {
      html.querySelectorAll(".death-tray .death-saves .pips").forEach(pip => pip.remove());
    }
  }
});

Hooks.on("renderPortraitPanelArgonComponent", (portraitPanel, element, actor) => {
  if (blindMode() && !game.user.isGM) {
    element.querySelectorAll(".death-save-result-container").forEach(container => container.remove());
  }
});
