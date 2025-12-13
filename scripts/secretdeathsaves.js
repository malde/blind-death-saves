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

const secretDeathSaveClass = "secret-death-save";

// Tag roll dialog
Hooks.on("dnd5e.buildDeathSaveRollConfig", (app) => {
  app.options.classes.push(secretDeathSaveClass);
});

// Set roll mode
Hooks.on("dnd5e.preRollDeathSaveV2", (cfg, dialog, msg) => {
  msg.rollMode = blindMode() ? CONST.DICE_ROLL_MODES.BLIND : CONST.DICE_ROLL_MODES.PRIVATE;
});

// Hide roll mode selection in roll dialog
Hooks.on("renderRollConfigurationDialog", (app, html) => {
  if (app.options.classes?.includes(secretDeathSaveClass)) {
    html.querySelector('[data-application-part="configuration"]').remove();
  }
});

// Skip success and failure messages
Hooks.on("dnd5e.rollDeathSaveV2", (rolls, details) => {
  if (details.chatString === "DND5E.DeathSaveSuccess") {
    details.chatString = undefined;
    // we explicitly want the 3 successes visible on the character sheet, so we override the default behavior here
    details.updates = {
      "system.attributes.death.success": Math.clamped(3, 0, 3)
    };
  }
  else if (details.chatString === "DND5E.DeathSaveFailure") {
    details.chatString = undefined;
  }
});

// Remove death save counters from character sheet (only for Players)
Hooks.on("renderActorSheetV2", async function (app, html, data) {
  if (blindMode() && !game.user.isGM || !data.owner) {
    if (app.options.classes.includes("tidy5e-sheet")) {
      html.querySelectorAll('[data-tidy-sheet-part="death-save-failures"], [data-tidy-sheet-part="death-save-successes"]')
          .forEach(success => success.remove());
      // fallback to legacy selectors
      html.querySelectorAll('.death-saves .fa-check, .death-saves .death-save-result, .death-saves .fa-times')
          .forEach(success => success.remove());
    }
    else {
      html.querySelectorAll('.death-tray .death-saves .pips').forEach(pip => pip.remove());
    }
  }
});

Hooks.on("renderPortraitPanelArgonComponent", (portraitPanel, element, actor) => {
  if (blindMode() && !game.user.isGM) {
    element.querySelectorAll('.death-save-result-container').forEach(container => container.remove());
  }
});
