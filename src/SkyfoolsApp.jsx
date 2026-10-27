import React,{useState,useRef,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {ArrowUpRight,Plus,X,Menu as MenuIcon} from 'lucide-react';
import {menu,frame} from './data';
import {FRAME_COUNT} from './frameCount';
import Hero from './Hero';
import Footer from './SkyfoolsFooter';
import FoodPhoto from './FoodPhoto';
import MenuBook from './menuPage';
import './style.css';
import './refinement.css';

const instagram='https://www.instagram.com/strivx.technologies/';
const directions='https://www.google.com/maps/search/?api=1&query=Bandra+West+Mumbai';
const links=[['Home','#home'],['Menu','#book'],['Our Story','#story'],['Gallery','#gallery'],['Visit Us','#visit']];

function DetailModal({content,onClose}){
  const ref=useRef();
  useEffect(()=>{const before=document.activeElement,old=document.body.style.overflow;document.body.style.overflow='hidden';ref.current.showModal();return()=>{document.body.style.overflow=old;before?.focus();};},[]);
  return <dialog aria-label={content.type==='food'?content.item.name:content.title} ref={ref} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} className="detail-modal">
    <button className="modal-close" autoFocus onClick={onClose} aria-label="Close details"><X/></button>
    {content.type==='food'?<><FoodPhoto item={content.item}/><div className="modal-copy food-detail-copy"><span className="eyebrow">{content.item.category}</span><h2>{content.item.name}</h2><span className="item-detail-label">WHAT IT IS</span><p>{content.item.detail}</p><div className="item-detail-bottom"><span>MENU PRICE</span><strong>₹{content.item.price}</strong></div><a className="text-link" href="/menu.html">Explore the full menu <ArrowUpRight size={16}/></a></div></>:<><img src={frame(content.frame)} alt={content.title}/><div className="modal-copy"><span className="eyebrow">AROUND THE CAFÉ</span><h2>{content.title}</h2></div></>}
  </dialog>;
}

function MenuCarousel({onSelect,modalOpen}){
  const track=useRef(),position=useRef(0),hold=useRef(false),drag=useRef(null),reduced=useReducedMotion();
  useEffect(()=>{let raf,last=performance.now(),visible=false;const el=track.current;const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'200px'});observer.observe(el.parentElement);const tick=t=>{if(!visible||document.hidden){last=t;raf=requestAnimationFrame(tick);return;}const step=el.firstElementChild.getBoundingClientRect().width+24,total=step*menu.length;if(!hold.current&&!modalOpen&&!reduced&&!drag.current)position.current+=Math.min(t-last,40)*.024;last=t;position.current=((position.current%total)+total)%total;el.style.transform=`translateX(${-position.current}px)`;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);observer.disconnect();};},[modalOpen,reduced]);
  return <div className="carousel-window" onMouseEnter={()=>hold.current=true} onMouseLeave={()=>hold.current=false} onFocus={()=>hold.current=true} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))hold.current=false;}} onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,start:position.current,moved:false};}} onPointerMove={e=>{if(drag.current){const d=e.clientX-drag.current.x;drag.current.moved=drag.current.moved||Math.abs(d)>5;position.current=drag.current.start-d;}}} onPointerUp={()=>setTimeout(()=>drag.current=null,0)} onPointerCancel={()=>drag.current=null} onPointerLeave={()=>{drag.current=null;hold.current=false;}}>
    <div className="menu-track" ref={track}>{[0,1,2].flatMap(copy=>menu.map(item=><button tabIndex={copy===0?0:-1} aria-hidden={copy>0?true:undefined} className="menu-card" key={`${copy}-${item.id}`} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))position.current=e.currentTarget.offsetLeft;}} onClick={()=>{if(!drag.current?.moved)onSelect({type:'food',item});}}><div className="card-image"><FoodPhoto item={item}/><span className="card-plus"><Plus size={20}/></span></div><div className="card-meta"><span>{item.category}</span></div><h3>{item.name}</h3><p>{item.description}</p><span className="view-details">Explore item <ArrowUpRight size={14}/></span></button>))}</div>
  </div>;
}

function App(){
  const [mobile,setMobile]=useState(false),[scrolled,setScrolled]=useState(false),[heroComplete,setHeroComplete]=useState(false),[modal,setModal]=useState(null);
  const reduced=useReducedMotion();
  useEffect(()=>{const f=()=>setScrolled((document.getElementById('home')?.getBoundingClientRect().bottom??Infinity)<=innerHeight);window.addEventListener('scroll',f,{passive:true});return()=>window.removeEventListener('scroll',f);},[]);
  const reveal={initial:{opacity:reduced?1:0,y:reduced?0:20},whileInView:{opacity:1,y:0},viewport:{once:true,amount:.12},transition:{duration:.65}};
  return <><a href="#book" className="skip-link">Skip to menu</a><header className={scrolled?'nav scrolled':heroComplete?'nav nav-arrived':'nav nav-walkthrough'}><a href="#home" className="wordmark">the skyfools<span>COFFEE · COMPANY · CURIOSITY</span></a><nav className={mobile?'open':''} aria-label="Main navigation">{links.map(([name,href])=><a key={name} href={href} onClick={()=>setMobile(false)}>{name}</a>)}</nav><a href="#visit" className="visit-pill">Come on in <ArrowUpRight size={15}/></a><button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<MenuIcon/>}</button></header>
  <main><Hero onComplete={setHeroComplete}/><div className="welcome-strip"><span>GOOD DAYS START SLOW.</span><span className="sun">✳</span><span>BETTER WITH COMPANY.</span><span className="sun">✳</span><span>ALWAYS ROOM FOR ONE MORE.</span></div>
    <section className="section menu-section" id="menu"><motion.div {...reveal} className="section-title"><div><span className="eyebrow">A TASTE OF SKYFOOLS</span><h2>Made to savour.</h2></div><div className="section-intro"><p>Coffee, bakes, brunch and more. Select a card to take a closer look.</p></div></motion.div><MenuCarousel onSelect={setModal} modalOpen={!!modal}/></section>
    <section id="book" className="section book-home-section"><motion.div {...reveal} className="section-title"><div><span className="eyebrow">THE MENU</span><h2>Turn the page.</h2></div><div className="section-intro"><p>Take your time. There is plenty to choose from.</p><a href="/menu.html" className="text-link">Open the menu on its own page <ArrowUpRight size={16}/></a></div></motion.div><MenuBook embedded/></section>
    <section id="story" className="story section"><motion.div {...reveal} className="story-visual"><img loading="lazy" src={frame(Math.round(FRAME_COUNT*.7))} alt="Skyfools café seating"/><span className="image-caption">A MOMENT INSIDE SKYFOOLS</span></motion.div><motion.div {...reveal} className="story-copy"><span className="eyebrow">OUR STORY</span><h2>Room to linger.</h2><p>Skyfools is a place to slow down, settle in and let a good conversation run a little longer.</p><p>Follow the café walk from the entrance to the coffee counter, then find a corner that feels like yours.</p></motion.div></section>
    <section id="gallery" className="gallery section"><motion.div {...reveal} className="section-title"><div><span className="eyebrow">THE SPACE</span><h2>A look around.</h2></div><p className="section-intro">From the first step inside to a quiet seat at the end of the walk.</p></motion.div><div className="gallery-grid">{[[1,'The arrival'],[Math.round(FRAME_COUNT*.4),'At the counter'],[Math.round(FRAME_COUNT*.7),'A place to pause'],[FRAME_COUNT,'Stay a little longer']].map(([n,title],i)=><motion.button {...reveal} className={`gallery-item gallery-${i}`} key={n} onClick={()=>setModal({type:'gallery',frame:n,title})}><img loading="lazy" src={frame(n)} alt={title}/><span>{title}<Plus size={20}/></span></motion.button>)}</div></section>
    <section id="visit" className="visit section"><div><span className="eyebrow">BANDRA WEST · MUMBAI</span><h2>Come by.</h2><div className="visit-info"><div><span className="eyebrow">FIND US</span><p>Bandra West,<br/>Mumbai</p></div><div><span className="eyebrow">STAY CONNECTED</span><p>Follow along for more from Skyfools.</p></div></div><div className="visit-actions"><a className="button" href={directions} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={17}/></a><a href={instagram} target="_blank" rel="noreferrer" className="text-link">Instagram <ArrowUpRight size={16}/></a></div></div><div className="map-wrap"><iframe title="Map of Bandra West, Mumbai" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Bandra%20West%20Mumbai&t=&z=15&ie=UTF8&iwloc=&output=embed"/><div className="map-caption"><span>THE SKYFOOLS<br/><small>BANDRA WEST · MUMBAI</small></span><ArrowUpRight/></div></div></section>
  </main><Footer/>{modal&&<DetailModal content={modal} onClose={()=>setModal(null)}/>}</>;
}

createRoot(document.getElementById('root')).render(<App/>);
