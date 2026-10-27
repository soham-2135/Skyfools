import React, {useEffect, useRef, useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {ArrowDown} from 'lucide-react';
import {FRAME_COUNT} from './frameCount';

const LAST_FRAME = FRAME_COUNT;
const FRAMES_PER_SHEET = 12;
const SHEET_COUNT = Math.ceil(LAST_FRAME / FRAMES_PER_SHEET);
const WALKTHROUGH_END = .88;
const sheetUrl = (index, compact) => `/${compact ? 'sprite-mobile' : 'sprite'}/sheet-${String(index + 1).padStart(2, '0')}.webp`;
const frameUrl = (number, compact) => compact
  ? `/sequence-mobile/frame-${String(number).padStart(3, '0')}.webp`
  : `/frames/ezgif-frame-${String(number).padStart(3, '0')}.jpg`;

export default function Hero({onComplete}) {
  const root = useRef(null), canvas = useRef(null), progress = useRef(null);
  const [complete, setComplete] = useState(false);
  const [status, setStatus] = useState('Preparing the walkthrough…');
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 699px)').matches);
  const reduced = useReducedMotion();

  useEffect(() => {
    const query = matchMedia('(max-width: 699px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const sheets = new Map(), detail = new Map();
    const sheetPending = new Set(), sheetFailed = new Set(), detailPending = new Set(), detailFailed = new Set();
    const tileWidth = 480, tileHeight = 270;
    const ctx = canvas.current.getContext('2d', {alpha: false, desynchronized: true});
    let alive = true, raf = 0, target = reduced ? LAST_FRAME : 1, direction = 1, active = true;
    let sheetInFlight = 0, detailInFlight = 0;
    let lastRender = '', finished = false;

    setStatus('Preparing the walkthrough…');
    const schedule = () => { if (alive && !raf) raf = requestAnimationFrame(draw); };
    const trimSheets = () => {
      const focus = Math.floor((target - 1) / FRAMES_PER_SHEET);
      const removable = [...sheets.keys()].filter(index => index !== focus)
        .sort((a, b) => Math.abs(b - focus) - Math.abs(a - focus));
      while (sheets.size > (compact ? 7 : 12) && removable.length) {
        const index = removable.shift();
        sheets.get(index).close(); sheets.delete(index);
      }
    };
    const loadSheet = index => {
      const focus = Math.floor((target - 1) / FRAMES_PER_SHEET);
      if (index < 0 || index >= SHEET_COUNT || sheets.has(index) || sheetPending.has(index) || sheetFailed.has(index) || sheetInFlight >= (index === focus ? 4 : 2)) return;
      sheetPending.add(index); sheetInFlight++;
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index === Math.floor((target - 1) / FRAMES_PER_SHEET) ? 'high' : 'low';
      image.onload = async () => {
        try {
          const bitmap = await createImageBitmap(image);
          if (!alive) { bitmap.close(); return; }
          sheets.set(index, bitmap);
          trimSheets();
          if (index === 0 || index === Math.floor((target - 1) / FRAMES_PER_SHEET)) setStatus('');
        } catch { sheetFailed.add(index); }
        finally { sheetPending.delete(index); sheetInFlight--; schedule(); queueSheets(); }
      };
      image.onerror = () => {
        sheetFailed.add(index); sheetPending.delete(index); sheetInFlight--;
        if (index === Math.floor((target - 1) / FRAMES_PER_SHEET) && !detail.has(target)) setStatus('Walkthrough unavailable. Use Menu to continue.');
        queueSheets();
      };
      image.src = sheetUrl(index, compact);
    };
    const queueSheets = () => {
      if (!alive || reduced || document.hidden) return;
      const focus = Math.floor((target - 1) / FRAMES_PER_SHEET);
      const nearby = [focus, focus + direction, focus - direction,
        focus + direction * 2, focus + direction * 3, focus + direction * 4];
      nearby.forEach(loadSheet);
    };
    const trimDetail = () => {
      const removable = [...detail.keys()].filter(number => number !== target)
        .sort((a, b) => Math.abs(b - target) - Math.abs(a - target));
      while (detail.size > (compact ? 12 : 18) && removable.length) {
        const number = removable.shift();
        detail.get(number).close(); detail.delete(number);
      }
    };
    const loadDetail = number => {
      if (number < 1 || number > LAST_FRAME || detail.has(number) || detailPending.has(number) || detailFailed.has(number) || detailInFlight >= (number === target ? 4 : 2)) return;
      detailPending.add(number); detailInFlight++;
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = number === target ? 'high' : 'low';
      image.onload = async () => {
        try {
          const bitmap = await createImageBitmap(image);
          if (!alive) { bitmap.close(); return; }
          detail.set(number, bitmap);
          trimDetail();
          if (number === target || reduced) setStatus('');
          schedule();
        } catch {
          detailFailed.add(number);
          if (reduced) setStatus('Walkthrough unavailable. Use Menu to continue.');
        } finally {
          detailPending.delete(number); detailInFlight--;
          queueDetails();
        }
      };
      image.onerror = () => {
        detailFailed.add(number);
        detailPending.delete(number); detailInFlight--;
        if (reduced) setStatus('Walkthrough unavailable. Use Menu to continue.');
        queueDetails();
      };
      image.src = frameUrl(number, compact);
    };
    const queueDetails = () => {
      if (!alive || document.hidden || !active) return;
      if (reduced) { loadDetail(LAST_FRAME); return; }
      loadDetail(target);
      for (let step = 1; step <= (compact ? 8 : 12) && detailInFlight < 2; step++) {
        loadDetail(target + direction * step);
        if (step <= 3) loadDetail(target - direction * step);
      }
    };
    const readProgress = () => {
      const section = root.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      active = rect.bottom > 0 && rect.top < innerHeight;
      const distance = Math.max(1, section.offsetHeight - innerHeight);
      const position = Math.max(0, Math.min(1, -rect.top / distance));
      const next = reduced ? LAST_FRAME : Math.round(Math.min(1, position / WALKTHROUGH_END) * (LAST_FRAME - 1)) + 1;
      direction = next >= target ? 1 : -1;
      target = next;
      progress.current.style.transform = `scaleX(${Math.min(1, position / WALKTHROUGH_END)})`;
      queueSheets();
      queueDetails();
      schedule();
    };
    const draw = () => {
      raf = 0;
      const element = canvas.current;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? 2.5 : 2);
      const width = Math.round(element.clientWidth * pixelRatio);
      const height = Math.round(element.clientHeight * pixelRatio);
      if (element.width !== width || element.height !== height) {
        element.width = width; element.height = height; lastRender = '';
      }
      const sheetIndex = Math.floor((target - 1) / FRAMES_PER_SHEET);
      const sheet = sheets.get(sheetIndex), sharp = detail.get(target);
      const useSharp = Boolean(sharp);
      const ready = Boolean(useSharp || sheet);
      const done = target === LAST_FRAME && ready;
      if (done !== finished) { finished = done; setComplete(done); onComplete(done); }
      if (!ready) return;
      const key = `${target}:${useSharp ? 'sharp' : 'sheet'}:${width}x${height}`;
      if (key === lastRender) return;
      const sourceWidth = useSharp ? sharp.width : tileWidth;
      const sourceHeight = useSharp ? sharp.height : tileHeight;
      const scale = Math.min(width / sourceWidth, height / sourceHeight);
      const drawWidth = sourceWidth * scale, drawHeight = sourceHeight * scale;
      const x = (width - drawWidth) / 2, y = (height - drawHeight) / 2;
      ctx.fillStyle = '#27271f'; ctx.fillRect(0, 0, width, height);
      if (useSharp) ctx.drawImage(sharp, x, y, drawWidth, drawHeight);
      else {
        const offset = (target - 1) % FRAMES_PER_SHEET;
        ctx.drawImage(sheet, (offset % 4) * tileWidth, Math.floor(offset / 4) * tileHeight,
          tileWidth, tileHeight, x, y, drawWidth, drawHeight);
      }
      lastRender = key;
    };

    window.addEventListener('scroll', readProgress, {passive: true});
    window.addEventListener('resize', readProgress, {passive: true});
    const resume = () => { queueSheets(); queueDetails(); };
    document.addEventListener('visibilitychange', resume);
    queueSheets();
    readProgress();
    return () => {
      alive = false;
      window.removeEventListener('scroll', readProgress);
      window.removeEventListener('resize', readProgress);
      document.removeEventListener('visibilitychange', resume);
      cancelAnimationFrame(raf);
      sheets.forEach(bitmap => bitmap.close());
      detail.forEach(bitmap => bitmap.close());
    };
  }, [compact, reduced, onComplete]);

  return <section id="home" className="hero-track" ref={root}>
    <div className={`hero ${complete ? 'journey-complete' : 'journey-active'}`}>
      <canvas ref={canvas} aria-label={`Scroll-controlled café walkthrough using the ${FRAME_COUNT} original supplied frames`}/>
      <div className="hero-shade"/>
      <div className="hero-copy" aria-hidden={!complete} inert={!complete}>
        <span className="eyebrow">BANDRA WEST · MUMBAI</span>
        <h1>The <em>Skyfools.</em></h1>
        <p>Good coffee. Curious plates. Stay a little longer.</p>
      </div>
      <div className="hero-bottom"><span>{complete ? 'YOU’VE ARRIVED' : 'TAKE YOUR TIME'}</span>
        <div className="scroll-cue"><span>{complete ? 'SCROLL TO THE MENU' : 'SCROLL TO STEP INSIDE'}</span><ArrowDown size={19}/></div>
        <span className="hero-index">{complete ? 'MAKE YOURSELF AT HOME' : 'A SLOW WALK THROUGH'}</span>
      </div>
      {status && <div className="loading" role="status">{status}</div>}
      <div className="hero-progress" ref={progress}/>
    </div>
  </section>;
}
