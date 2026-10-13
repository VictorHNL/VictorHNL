```aura width=860 height=200
<div style={{
  width: '100%', height: '100%', background: '#08080c',
  display: 'flex', alignItems: 'center', fontFamily: 'Inter',
  position: 'relative', overflow: 'hidden', borderRadius: 16,
  border: '1px solid rgba(110,80,220,0.18)'
}}>
  <style>{`
    @keyframes drift-a { 0%,100% { transform: translateX(0); opacity:.75 } 50% { transform:translateX(100px); opacity:1 } }
    @keyframes drift-b { 0%,100% { transform:translateX(0); opacity:.55 } 50% { transform:translateX(-80px); opacity:.95 } }
    @keyframes pulse { 0%,100% { transform:scale(1); opacity:.7 } 50% { transform:scale(1.2); opacity:.35 } }
    #glow-a { animation:drift-a 11s ease-in-out infinite }
    #glow-b { animation:drift-b 13s ease-in-out infinite }
    #glow-c { animation:pulse 8s ease-in-out infinite }
  `}</style>
  <svg width="860" height="200" style={{ position:'absolute', top:0, left:0 }}>
    <defs>
      <radialGradient id="violet" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(110,20,210,.65)"/><stop offset="70%" stopColor="rgba(90,15,180,0)"/></radialGradient>
      <radialGradient id="blue" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(0,110,255,.5)"/><stop offset="70%" stopColor="rgba(0,100,220,0)"/></radialGradient>
    </defs>
    <ellipse id="glow-a" cx="180" cy="210" rx="260" ry="180" fill="url(#violet)"/>
    <ellipse id="glow-b" cx="650" cy="220" rx="240" ry="170" fill="url(#blue)"/>
    <ellipse id="glow-c" cx="440" cy="200" rx="180" ry="130" fill="url(#violet)"/>
  </svg>
  <div style={{ position:'absolute', left:48, top:52, width:96, height:96, borderRadius:48, background:'linear-gradient(135deg,#6622ee,#0088ff)', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <img src={github.user.avatarUrl} width={88} height={88} style={{ borderRadius:44 }}/>
  </div>
  <div style={{ display:'flex', flexDirection:'column', marginLeft:168, gap:8, zIndex:10 }}>
    <div style={{ display:'flex', fontSize:38, fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>Victor Hugo</div>
    <div style={{ display:'flex', fontSize:15, color:'rgba(180,165,255,.85)' }}>Java Developer  |  Backend & Full Stack Developer</div>
    <div style={{ display:'flex', gap:8, marginTop:6 }}>
      {['Java', 'Spring Boot', 'REST APIs', 'Full Stack'].map(function(tag) { return <div key={tag} style={{ display:'flex', padding:'4px 12px', borderRadius:20, background:'rgba(80,40,220,.18)', border:'1px solid rgba(100,70,240,.32)', color:'rgba(205,195,255,.9)', fontSize:12, fontWeight:600 }}>{tag}</div>; })}
    </div>
  </div>
</div>
```

```aura width=860 height=140
(function() {
  var stats = [
    { label:'Repositórios', value:String(github.stats.totalRepos), color:'#a78bfa' },
    { label:'Estrelas', value:String(github.stats.totalStars), color:'#60a5fa' },
    { label:'Commits', value:String(github.stats.totalCommits), color:'#f59e0b' },
  ];
  return <div style={{ width:'100%', height:'100%', background:'#08080c', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter', borderRadius:16, border:'1px solid rgba(110,80,220,.18)', position:'relative', overflow:'hidden' }}>
    {stats.map(function(s,i) { return <div key={s.label} style={{ flexGrow:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px 8px', borderRight:i<stats.length-1?'1px solid rgba(255,255,255,.08)':'none', gap:5 }}><div style={{ display:'flex', fontSize:30, fontWeight:800, color:s.color }}>{s.value}</div><div style={{ display:'flex', fontSize:11, color:'rgba(200,195,225,.6)', fontWeight:600, letterSpacing:'1.5px' }}>{s.label.toUpperCase()}</div></div>; })}
  </div>;
})()
```

```aura width=860 height=168
(function() {
  var topLangs = ['Java', 'Spring Boot', 'MySQL', 'HTML5', 'CSS3', 'JavaScript', 'Docker', 'Git'];
  return <div style={{ width:'100%', height:'100%', background:'#08080c', display:'flex', flexDirection:'column', fontFamily:'Inter', padding:'18px 32px', gap:14, borderRadius:16, border:'1px solid rgba(110,80,220,.18)' }}>
    <div style={{ display:'flex', fontSize:10, fontWeight:700, color:'rgba(180,165,255,.7)', letterSpacing:'3px' }}>TECNOLOGIAS & FERRAMENTAS</div>
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>{topLangs.map(function(item) { return <div key={item} style={{ display:'flex', padding:'6px 14px', borderRadius:8, background:'rgba(110,80,220,.14)', border:'1px solid rgba(110,80,220,.3)', color:'rgba(225,220,255,.9)', fontSize:13, fontWeight:600 }}>{item}</div>; })}</div>
    <div style={{ display:'flex', fontSize:12, color:'rgba(200,195,225,.5)' }}>Desenvolvimento backend, APIs REST e aplicações full stack.</div>
  </div>;
})()
```

```aura width=150 height=44 link="https://github.com/VictorHNL" inline align=center
<SocialMediaButton text="GitHub" backgroundColor="#111111" width={150} height={44}/>
```

```aura width=150 height=44 link="https://www.linkedin.com/" inline align=center
<SocialMediaButton text="LinkedIn" backgroundColor="#111111" width={150} height={44}/>
```

<p align="center"><sub>feito com <a href="https://github.com/collectioneur/readme-aura">readme-aura</a></sub></p>

