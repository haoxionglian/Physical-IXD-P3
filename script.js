async function searchAnime(){
  const query=document.getElementById('searchInput').value.trim();
  if(!query)return;

  const out=document.getElementById('results');
  out.innerHTML='<div style="text-align:center;color:#666">Searching...</div>';

  try{
    const res=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`);
    const data=await res.json();
    if(!data.data||data.data.length===0){out.innerHTML='<p>No anime found.</p>';return;}

    let html='';
    for(const anime of data.data){
      html+=`
        <div class="anime-card">
          <h3>${anime.title}</h3>
          <img src="${anime.images.jpg.image_url}" alt="Poster">
          <p>Type: ${anime.type||'N/A'}</p>
          <button onclick="loadThemes(${anime.mal_id},this)">Load OP/ED</button>
          <div id="songs-${anime.mal_id}" class="songs"></div>
        </div>`;
    }
    out.innerHTML=html;
  }catch(err){
    console.error(err);
    document.getElementById('results').innerHTML='<p>Network error.</p>';
  }
}

async function loadThemes(id,btn){
  btn.disabled=true;
  btn.innerText='Loading...';
  const target=document.getElementById(`songs-${id}`);

  try{
    const infoRes=await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const anime=(await infoRes.json()).data;
    if(!anime)throw new Error('Not found');

    const themesRes=await fetch(`https://api.jikan.moe/v4/anime/${id}/themes`);
    const themes=(await themesRes.json()).data;

    let html='';
    html+='<h4>Opening Themes</h4>';
    if(!themes||!themes.openings||themes.openings.length===0)html+='<p>No OP found.</p>';
    else themes.openings.forEach(t=>html+=formatSong(t));

    html+='<h4>Ending Themes</h4>';
    if(!themes||!themes.endings||themes.endings.length===0)html+='<p>No ED found.</p>';
    else themes.endings.forEach(t=>html+=formatSong(t));

    target.innerHTML=html;
    btn.innerText='Loaded';
  }catch(err){
    console.error(err);
    target.innerHTML='<p>Failed to load themes.</p>';
    btn.innerText='Error';
  }finally{
    btn.disabled=false;
  }
}

function formatSong(text){
  const [rawTitle,rawArtist]=text.split(' by ');
  let title=rawTitle
    .replace(/^\d+:\s*/,'')
    .replace(/^["']|["']$/g,'')
    .trim();
  const artist=(rawArtist||'').replace(/^["']|["']$/g,'').trim();
  const cleanTitle=title.replace(/(\s*\(.*?\)\s*)|(\s*\[.*?\]\s*)/g,'').trim();

  const dzQuery=`${cleanTitle} ${artist}`;
  const dzSearch=`https://www.deezer.com/search/${encodeURIComponent(cleanTitle)}`;
  const dzEmbed=`https://widget.deezer.com/widget/auto/track?query=${encodeURIComponent(dzQuery)}&widget_type=track&format=classic`;

  return`
    <div class="song-item">
      <div class="song-info">
        <b>${title}</b> — ${artist}
        <br><a href="${dzSearch}" target="_blank" rel="noopener noreferrer" class="listen">🔍 Deezer</a>
      </div>
      <iframe src="${dzEmbed}" class="deez"></iframe>
    </div>`;
}
