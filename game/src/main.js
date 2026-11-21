// Twin Lookout bootstrap: create the game, then honour the optional ?shot=
// staging used only for the entry's screenshots — a normal visit with no
// query string opens the menu and plays exactly as the player left it.

import { SpotGame } from './game.js';

const game = new SpotGame();
window.twinLookout = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'play' || shot === 'late' || shot === 'win') {
  const scene = Number(params.get('scene') || (shot === 'late' ? 1 : 0));
  const found = Number(params.get('found') || (shot === 'late' ? 6 : shot === 'win' ? 7 : 3));
  const timer = Number(params.get('timer') || (shot === 'late' ? 23 : shot === 'win' ? 41 : 97));
  const score = Number(params.get('score') || (shot === 'late' ? 1250 : shot === 'win' ? 1890 : 320));
  game.stageShot({ scene, found, timer, score, hint: shot === 'late' });
  if (shot === 'win') {
    game.completeRound();
  } else if (shot === 'late') {
    game.setMessage('Hint: something changed near the missing pine… (−50 points)');
  }
}
