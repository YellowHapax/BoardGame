/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans bg-zinc-950">
      <GameCanvas />
      <UI />
    </div>
  );
}

