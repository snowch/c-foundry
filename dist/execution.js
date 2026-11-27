(() => {
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function label(chapter){return {browser:'Browser lab',both:'Browser lab + Linux terminal',linux:'Browser Linux'}[chapter.execution.mode];}
  function link(chapter,command=chapter.command){return '#/linux/'+chapter.id+'/'+encodeURIComponent(command)+(chapter.execution.kind==='practice'?'/practice':'');}
  function panel(chapter){
    if(chapter.execution.mode==='browser')return `<section class="execution-panel"><h2>Where this lab runs</h2><p>Edit and run the examples directly in this browser.</p></section>`;
    return `<section class="execution-panel" aria-label="Execution environment"><h2>Run in Browser Linux</h2><p>Choose <strong>Open Browser Linux</strong>, then <strong>Run lab in Linux</strong> on that page. The course prepares the tools and files automatically and sends the selected command to the terminal. Wait for <strong>Linux is ready</strong>, then inspect the terminal output. No account or local installation is required.</p><p>${escape(chapter.execution.reason)}</p><pre class="launch-command"><code>${escape(chapter.command)}</code></pre><div class="launch-actions"><a class="primary-link" data-linux-command="${escape(chapter.command)}" href="${escape(link(chapter))}">Open Browser Linux</a><button data-copy-command="${escape(chapter.command)}">Copy command</button><a href="https://github.com/snowch/c-foundry/blob/main/${escape(chapter.workspace)}/README.md" target="_blank" rel="noopener noreferrer">View source and instructions</a></div><p class="launch-feedback" role="status"></p><p class="supporting">The Linux system loads when you start it. Its files are temporary; export a work archive before closing or reloading the terminal. <a href="#/setup">Browser environments and saving work →</a></p></section>`;
  }
  document.addEventListener('click',async event=>{
    const control=event.target.closest('[data-copy-command]');if(!control)return;
    const status=control.closest('.execution-panel').querySelector('.launch-feedback');
    try{await navigator.clipboard.writeText(control.dataset.copyCommand);status.textContent='Command copied. Paste it into the Browser Linux terminal after importing the course bundle.';}
    catch(_){status.textContent='Copy the command shown above and paste it into Browser Linux after importing the course bundle.';}
  });
  window.courseExecution={label,panel,link,url:'#/linux'};
})();
