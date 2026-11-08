(() => {
  const CODESPACES='https://codespaces.new/snowch/c-foundry?quickstart=1';
  const BILLING='https://docs.github.com/en/billing/concepts/product-billing/github-codespaces';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function label(chapter){return {browser:'Browser lab',both:'Browser + Codespaces',codespaces:'Codespaces lab'}[chapter.execution.mode];}
  function panel(chapter){
    const mode=chapter.execution.mode;
    if(mode==='browser')return `<section class="execution-panel"><h2>Where this lab runs</h2><p>Reading and planned practice: in your browser.</p><p>${escape(chapter.execution.reason)}</p></section>`;
    const demo=chapter.nativeDemo;
    return `<section class="execution-panel" aria-label="Execution environment"><h2>Where this lab runs</h2><p><strong>Read here. ${mode==='both'?'Explore here or build the project in Linux.':'Run the planned native lab in Codespaces or a local dev container.'}</strong></p><p>${escape(chapter.execution.reason)}</p><p>The chapter is still a preview. Its repository workspace contains the plan${demo?' and links to a runnable foundation':''}.</p><pre class="launch-command"><code>${escape(chapter.command)}</code></pre><div class="launch-actions"><a class="primary-link" data-codespaces-command="${escape(chapter.command)}" href="${CODESPACES}" target="_blank" rel="noopener noreferrer">Open in Codespaces</a><button data-copy-command="${escape(chapter.command)}">Copy command</button><a href="https://github.com/snowch/c-foundry/blob/main/${chapter.workspace}/README.md" target="_blank" rel="noopener noreferrer">View chapter files</a></div><p class="launch-feedback" role="status"></p><p class="supporting">Once your editor opens, paste the command into its terminal. If you already have a Codespace, reuse it from <a href="https://github.com/codespaces" target="_blank" rel="noopener noreferrer">your Codespaces list</a>.</p>${demo?`<details><summary>Available native foundation</summary><p><code>make ${demo}</code> runs ${escape({hello:'a native C greeting',standards:'a compiler and binary-format probe',counter:'mutex-protected and atomic counters',queue:'a bounded producer–consumer queue',tinydb:'a coarse-lock, in-memory TinyDB table'}[demo])}. This is a starting point, not the completed chapter project.</p></details>`:''}<p class="codespaces-cost">Codespaces runs on your own GitHub account and uses its compute and storage allowance. <a href="${BILLING}" target="_blank" rel="noopener noreferrer">Check GitHub’s current terms</a>. Stop it when finished; delete it to release stored workspace usage.</p><p><a href="#/setup">Setup, local development, and saving your work →</a></p></section>`;
  }
  document.addEventListener('click',async event=>{
    const control=event.target.closest('[data-copy-command], [data-codespaces-command]');if(!control)return;
    const command=control.dataset.copyCommand||control.dataset.codespacesCommand;
    const status=control.closest('.execution-panel').querySelector('.launch-feedback');
    try{await navigator.clipboard.writeText(command);status.textContent='Command copied. Paste it into the Codespaces terminal after startup.';}
    catch(_){status.textContent='Copy the command shown above and paste it into the Codespaces terminal after startup.';}
    // The anchor opens normally in the original click gesture; no popup is delayed by clipboard access.
  });
  window.courseExecution={label,panel,url:CODESPACES};
})();
