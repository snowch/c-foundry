// Offline documentation reader. No compiler, guest, storage or network required.
(() => {
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pages=()=>window.C_MANUAL_PAGES||{};
  const aliases={'printf-man':'printf.3','pthread':'pthread_create.3','mutex':'pthread_cond_wait.3','fsync':'fsync.2','ctype':'isspace.3','io':'stdio.3','memory':'malloc.3','strings':'strlen.3','locale':'setlocale.3','fenv':'fenv.3','math':'sqrt.3'};
  function entry(id){return aliases[id]||Object.keys(pages()).find(key=>key===id+'.3'||key===id+'.2');}
  function href(id){const key=entry(id);return key?'#/manual/'+key:'#/reference/'+id;}
  const online=link=>`<a href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">Full online reference (internet required, new tab)</a>`;
  function render(key){
    const all=pages();
    if(!key)return `<a href="#/chapter/first-program/6">← Finding and reading C documentation</a><article class="manual-reader"><h1 tabindex="-1">C manual pages</h1><p>These ${Object.keys(all).length} bundled Linux manual entries work after you download the course for offline use. Search by function name or a word in its description.</p><label for="manual-search">Find a manual page</label><input id="manual-search" type="search" placeholder="For example: printf, fgets, allocate" autocomplete="off"><p id="manual-count" role="status">${Object.keys(all).length} entries</p><ul id="manual-index">${Object.entries(all).map(([id,p])=>`<li data-manual-search="${escape((id+' '+p.summary).toLowerCase())}"><a href="#/manual/${id}">${escape(p.name)}(${escape(p.section)})</a><p>${escape(p.summary)}</p></li>`).join('')}</ul><p><a href="manuals/NOTICE.md">Sources and licences</a></p></article>`;
    const p=all[key];if(!p)return '<h1 tabindex="-1">Manual page not bundled</h1><p><a href="#/manual">Search the included C manual pages →</a></p>';
    return `<a href="#/manual">← C manual pages</a><article class="manual-reader"><h1 tabindex="-1">${escape(p.name)}(${escape(p.section)})</h1><p class="manual-scope">Bundled Linux manual. C17 is the teaching baseline; check STANDARDS for ISO C, POSIX and Linux extensions. These pages describe Linux/glibc; an extension may be unavailable in the inline compiler or Browser Linux’s musl library.</p>${p.html}<footer><p>Linux man-pages 6.16 · <a href="manuals/source/${escape(key)}" download>Original source and copyright notice</a> · <a href="manuals/NOTICE.md">Licences and provenance</a></p></footer></article>`;
  }
  function reference(id){
    const link=window.lessonReferences.catalog[id];if(!link)return '<h1 tabindex="-1">Reference not found</h1><p><a href="#/manual">C manual pages →</a></p>';
    const related=[];
    for(const chapter of COURSE.chapters)for(const topic of chapter.topics){
      const content=authoredLessons.content[chapter.id]?.topics[topic.id];if(!content)continue;
      if(lessonReferences.get(chapter,topic,content).links.some(ref=>ref.id===id))related.push({chapter,topic,content});
    }
    return `<article class="manual-reader"><a href="#/manual">C manual pages →</a><h1 tabindex="-1">Course notes: ${escape(link.title)}</h1><p>${escape(link.note)}</p><p>The explanations below are included with the course and work offline. ${online(link)}.</p>${related.map(({chapter,topic,content})=>`<section><h2><a href="#/chapter/${chapter.id}/${topic.id}">${escape(topic.title)}</a></h2><p>${content.explanation}</p><details><summary>Documentation question and answer</summary><p>${escape(lessonReferences.chapters[chapter.id].exercise.question)}</p><p>${escape(lessonReferences.chapters[chapter.id].exercise.answer)}</p></details></section>`).join('')}</article>`;
  }
  document.addEventListener('input',e=>{if(e.target.id!=='manual-search')return;const query=e.target.value.trim().toLowerCase();let n=0;document.querySelectorAll('[data-manual-search]').forEach(li=>{li.hidden=!li.dataset.manualSearch.includes(query);if(!li.hidden)n++;});document.getElementById('manual-count').textContent=n+' entries';});
  window.cManuals={entry,href,render,reference};
})();
