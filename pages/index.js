import { useState, useRef, useCallback } from "react";

const TOOLS = [
  { id: "enhance",  icon: "✦", label: "Авто жақсарту", desc: "AI барлығын өзі анықтайды",   color: "#f59e0b", api: "cloudinary" },
  { id: "upscale",  icon: "◈", label: "HD Upscale",    desc: "4× үлкейту, кристалдай анық", color: "#3b82f6", api: "cloudinary" },
  { id: "removebg", icon: "◻", label: "Фон алу",       desc: "Бір секундта фон жоғалады",   color: "#10b981", api: "clipdrop"   },
  { id: "relight",  icon: "☼", label: "Жарық түзету",  desc: "Кәсіби студия жарығы",        color: "#f97316", api: "clipdrop"   },
  { id: "cleanup",  icon: "⌫", label: "Тазалау",       desc: "Артық заттарды жою",          color: "#8b5cf6", api: "clipdrop"   },
  { id: "sharpen",  icon: "◎", label: "Анықтау",       desc: "Blur суретті өткір қылу",     color: "#ec4899", api: "cloudinary" },
];

export default function App() {
  const [image, setImage]       = useState(null);
  const [fileName, setFileName] = useState("");
  const [tool, setTool]         = useState(TOOLS[0]);
  const [loading, setLoading]   = useState(false);
  const [loadMsg, setLoadMsg]   = useState("");
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [compare, setCompare]   = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target.result); setResult(null); setError(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const process = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setLoadMsg("Сурет жіберілуде...");
      await sleep(600);
      setLoadMsg("AI өңдеп жатыр...");
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image, tool: tool.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLoadMsg("Дайындалуда...");
      await sleep(400);
      setResult(data.imageUrl || data.imageBase64);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false); setLoadMsg("");
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = result;
    a.download = `photomaster-${tool.id}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080809", color:"#fff", fontFamily:"'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#080809;--surface:#111113;--border:rgba(255,255,255,0.06);--text-dim:rgba(255,255,255,0.35)}
        .upload-zone{border:1.5px dashed rgba(255,255,255,0.1);border-radius:20px;cursor:pointer;transition:all 0.25s;background:var(--surface);position:relative;overflow:hidden}
        .upload-zone:hover{border-color:rgba(245,158,11,0.3)}
        .upload-zone.drag{border-color:rgba(245,158,11,0.5);background:rgba(245,158,11,0.04)}
        .tool-card{border:1.5px solid var(--border);border-radius:14px;padding:14px 12px;cursor:pointer;transition:all 0.2s;background:var(--surface);position:relative;overflow:hidden}
        .tool-card:hover{transform:translateY(-2px)}
        .tool-card.sel{border-color:var(--accent)}
        .proc-btn{width:100%;padding:17px;border-radius:14px;border:none;color:#000;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.3s;letter-spacing:-0.2px}
        .proc-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 48px rgba(245,158,11,0.3)}
        .proc-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
        .ghost-btn{padding:13px 20px;border-radius:12px;border:1.5px solid var(--border);background:transparent;color:var(--text-dim);font-family:'Outfit',sans-serif;font-weight:500;font-size:14px;cursor:pointer;transition:all 0.2s}
        .ghost-btn:hover{border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7)}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.04em}
        .img-wrap{border-radius:16px;overflow:hidden;background:#111;position:relative}
        .img-wrap img{width:100%;max-height:360px;object-fit:contain;display:block}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .fu{animation:fadeUp 0.35s ease forwards}
      `}</style>

      <header style={{padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"rgba(8,8,9,0.9)",backdropFilter:"blur(16px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#000"}}>P</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,letterSpacing:"-0.5px"}}>PhotoMaster</div>
            <div style={{fontSize:10,color:"var(--text-dim)",fontFamily:"'JetBrains Mono',monospace"}}>Cloudinary · Clipdrop AI</div>
          </div>
        </div>
        <span className="badge" style={{background:"rgba(16,185,129,0.1)",color:"#34d399",border:"1px solid rgba(16,185,129,0.15)"}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:"#34d399",display:"inline-block"}}/>Онлайн
        </span>
      </header>

      <main style={{maxWidth:500,margin:"0 auto",padding:"24px 16px 48px"}}>

        {!image ? (
          <div className={`upload-zone fu ${dragging?"drag":""}`} style={{padding:"52px 24px",textAlign:"center"}}
            onClick={()=>fileRef.current.click()}
            onDragOver={(e)=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop}
          >
            <div style={{width:64,height:64,borderRadius:16,background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 20px"}}>📸</div>
            <div style={{fontWeight:700,fontSize:18,marginBottom:8,letterSpacing:"-0.4px"}}>Суретті жүктеңіз</div>
            <div style={{color:"var(--text-dim)",fontSize:13,lineHeight:1.7}}>
              Drag & drop немесе басыңыз<br/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,opacity:0.6}}>JPG · PNG · WEBP · max 10MB</span>
            </div>
          </div>
        ) : (
          <div className="fu">
            <div className="img-wrap">
              <img src={result&&compare?image:result||image} alt="photo"/>
              <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
                {result&&(
                  <button onMouseDown={()=>setCompare(true)} onMouseUp={()=>setCompare(false)} onTouchStart={()=>setCompare(true)} onTouchEnd={()=>setCompare(false)} className="ghost-btn" style={{padding:"6px 12px",fontSize:11,borderRadius:8}}>👁 Салыстыру</button>
                )}
                <button onClick={()=>{setImage(null);setResult(null);setError(null);}} className="ghost-btn" style={{padding:"6px 12px",fontSize:11,borderRadius:8}}>✕</button>
              </div>
              <div style={{position:"absolute",bottom:10,left:10}}>
                {result
                  ?<span className="badge" style={{background:"rgba(16,185,129,0.85)",color:"#fff",backdropFilter:"blur(8px)"}}>✓ Дайын</span>
                  :<span className="badge" style={{background:"rgba(0,0,0,0.6)",color:"rgba(255,255,255,0.6)",backdropFilter:"blur(8px)",fontFamily:"'JetBrains Mono',monospace"}}>{fileName||"сурет"}</span>
                }
              </div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>handleFile(e.target.files[0])}/>

        {image&&!loading&&(
          <div className="fu" style={{marginTop:20}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>Өңдеу түрін таңдаңыз</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {TOOLS.map((t)=>(
                <div key={t.id} className={`tool-card ${tool.id===t.id?"sel":""}`} style={{"--accent":t.color}} onClick={()=>{setTool(t);setResult(null);}}>
                  <div style={{fontSize:20,marginBottom:6,color:tool.id===t.id?t.color:"rgba(255,255,255,0.4)"}}>{t.icon}</div>
                  <div style={{fontWeight:600,fontSize:11,marginBottom:3,color:tool.id===t.id?"#fff":"rgba(255,255,255,0.7)"}}>{t.label}</div>
                  <div style={{fontSize:10,color:"var(--text-dim)",lineHeight:1.4}}>{t.desc}</div>
                  <div style={{marginTop:6,fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:tool.id===t.id?t.color:"var(--text-dim)",opacity:0.7}}>{t.api}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading&&(
          <div className="fu" style={{marginTop:20,background:"var(--surface)",borderRadius:18,padding:28,textAlign:"center",border:"1px solid var(--border)"}}>
            <div style={{width:48,height:48,borderRadius:"50%",border:"2px solid rgba(245,158,11,0.15)",borderTopColor:"#f59e0b",margin:"0 auto 18px",animation:"spin 0.9s linear infinite"}}/>
            <div style={{fontWeight:600,fontSize:15,marginBottom:6,letterSpacing:"-0.3px"}}>{loadMsg}</div>
            <div style={{fontSize:11,color:"var(--text-dim)",fontFamily:"'JetBrains Mono',monospace"}}>{tool.api} · {tool.label}</div>
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:6}}>
              {[0.9,0.6,0.4].map((op,i)=>(
                <div key={i} style={{height:6,borderRadius:4,background:"linear-gradient(90deg,rgba(245,158,11,0.15) 0%,rgba(245,158,11,0.3) 50%,rgba(245,158,11,0.15) 100%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",opacity:op}}/>
              ))}
            </div>
          </div>
        )}

        {error&&(
          <div className="fu" style={{marginTop:16,background:"rgba(239,68,68,0.05)",borderRadius:14,padding:16,border:"1px solid rgba(239,68,68,0.12)"}}>
            <div style={{fontWeight:700,color:"#f87171",fontSize:13,marginBottom:6}}>⚠ Қате</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.6}}>{error}</div>
          </div>
        )}

        {result&&!loading&&(
          <div className="fu" style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button className="proc-btn" onClick={download} style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",fontSize:14}}>⬇ Жүктеп алу</button>
            <button className="ghost-btn" onClick={()=>setResult(null)} style={{textAlign:"center"}}>🔄 Қайтадан</button>
          </div>
        )}

        {image&&!loading&&!result&&(
          <button className="proc-btn fu" onClick={process} style={{marginTop:16,background:"linear-gradient(135deg,#f59e0b,#f97316)"}}>
            {tool.icon} {tool.label} — Бастау
          </button>
        )}

        {!image&&(
          <div className="fu" style={{marginTop:36}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.12em",textAlign:"center",marginBottom:18}}>Мүмкіндіктер</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {TOOLS.map((t)=>(
                <div key={t.id} style={{padding:"14px",background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{fontSize:20,color:t.color,flexShrink:0,marginTop:1}}>{t.icon}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,letterSpacing:"-0.2px",marginBottom:3}}>{t.label}</div>
                    <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.5}}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:"16px",background:"rgba(245,158,11,0.04)",borderRadius:14,border:"1px solid rgba(245,158,11,0.1)",textAlign:"center"}}>
              <div style={{fontSize:12,color:"rgba(245,158,11,0.7)",fontWeight:600,marginBottom:4}}>Тегін лимит</div>
              <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.6}}>
                Cloudinary: 25,000 трансформация/ай<br/>
                Clipdrop: 100 сурет/ай
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
