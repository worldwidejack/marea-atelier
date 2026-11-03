// Solo nel banco: confronta la resa normale del gioco con la risoluzione dello schermo.
import type { Renderer } from './render/scene.ts';

export function controlloRisoluzione(renderer: Renderer): void {
  const bottone = document.createElement('button');
  bottone.type = 'button';
  bottone.id = '_banco_risoluzione';
  bottone.style.cssText = 'position:fixed;left:12px;top:140px;z-index:1000;min-height:44px;padding:8px 12px;border:3px solid #1a1030;border-radius:12px;background:#e8e1d6;color:#1a1030;font:bold 14px sans-serif;cursor:pointer';
  let piena = false;
  const aggiorna = () => {
    bottone.textContent = piena ? 'Risoluzione: piena' : 'Risoluzione: retro';
    bottone.setAttribute('aria-pressed', String(piena));
    bottone.setAttribute('aria-label', piena ? 'Risoluzione piena: passa a retro' : 'Risoluzione retro: passa a piena');
  };
  bottone.addEventListener('click', () => {
    piena = !piena;
    renderer.setNitido?.(piena ? Infinity : null);
    aggiorna();
  });
  aggiorna();
  document.body.appendChild(bottone);
}
