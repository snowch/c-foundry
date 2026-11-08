(() => {
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const content={...PART_ONE,...PART_TWO};
  for(const chapter of COURSE.chapters.filter(c=>c.status==='ready')){
    for(const topic of chapter.topics){
      const t=content[chapter.id].topics[topic.id];
      if(t.runtime==='native')continue;
      LESSONS.push({id:`example-${chapter.id}-${topic.id}`,isExample:true,chapterId:chapter.id,topicId:topic.id,section:chapter.part,
        title:topic.title,time:'Worked example',tag:`Part ${chapter.part+1}`,concept:'Read, run, and change a complete program.',body:t.intro,
        detail:`This is an ungraded worked example. <a href="#/chapter/${chapter.id}/${topic.id}">Return to its explanation and question</a>.`,
        task:t.tryit,hint:'Run the unchanged example first. Change one thing at a time, predict the result, then run again.',
        code:t.code,solution:t.code,input:t.input,tests:[{name:'Original example output',input:t.input,expected:t.expected}],
        assessment:'Checking an example compares it with the original output; it does not add to practice progress.',
        example:{code:t.code,html:'<pre>'+escape(t.expected)+'</pre>',question:t.question,choices:t.choices,answer:t.answer,why:t.why}});
    }
  }
  function practice(chapter,data){
    if(data.practice){const l=LESSONS.find(l=>l.id===data.practice);return `<section class="chapter-practice"><h2>Chapter practice</h2><p>Build the chapter project, then check both its results and the reasoning behind it.</p><a class="primary-link" href="#/lesson/${data.practice}">${escape(l.title)} →</a>${chapter.labs.filter(id=>id!==data.practice).map(id=>`<p><a href="#/lesson/${id}">${escape(LESSONS.find(l=>l.id===id).title)} →</a></p>`).join('')}</section>`;}
    const project=data.nativePractice;
    return `<section class="chapter-practice"><h2>${escape(project.title)}</h2><p>This is an unfinished native project with TODOs, executable checks, and a separate reference. Its initial failure is expected; complete the implementation before checking your work.</p>${courseExecution.panel({...chapter,status:'ready',nativeDemo:null,command:`make project PROJECT=${project.id}`,workspace:`native/projects/${project.id}`,execution:{mode:'codespaces',reason:'This project uses multiple C source files and native checks. Edit its student module, then run the tests in Linux.'}})}</section>`;
  }
  function nativeExample(chapter,topic,t){
    const files=t.files||{'main.c':t.code};
    const listing=Object.entries(files).sort(([a],[b])=>a==='main.c'?-1:b==='main.c'?1:a.localeCompare(b)).map(([name,code])=>name==='main.c'?`<h3>${escape(name)}</h3><pre><code>${escape(code)}</code></pre>`:`<details><summary>${escape(name)}</summary><pre><code>${escape(code)}</code></pre></details>`).join('');
    const id=chapter.id+'-'+topic.id;
    return `<div class="native-example" data-native-example="${id}">${listing}${courseExecution.panel({...chapter,status:'ready',nativeDemo:null,command:`make example EXAMPLE=${id}`,workspace:`native/examples/${id}`,execution:{mode:'codespaces',reason:t.files?'Compile these source files together using the repository command.':'Run this native example with the Linux toolchain; the chapter also uses files and native diagnostics.'}})}</div>`;
  }
  function render(chapter,topic){
    const data=content[chapter.id],part=chapter.part+1;
    const position=topic?chapter.topics.indexOf(topic):-1;
    const previous=position>0?chapter.topics[position-1]:null;
    const following=position>=0?chapter.topics[position+1]:chapter.topics[0];
    const header=`<nav class="reading-breadcrumb" aria-label="Breadcrumb"><a href="#/course">Course</a><span aria-hidden="true">/</span><a href="#/chapter/${chapter.id}">Chapter ${chapter.number}</a><span>Part ${part}</span></nav><nav class="chapter-controls" aria-label="Chapter navigation"><label for="chapter-jump">In this chapter<select id="chapter-jump"><option value="/chapter/${chapter.id}" ${!topic?'selected':''}>Chapter overview</option>${chapter.topics.map((item,index)=>`<option value="/chapter/${chapter.id}/${item.id}" ${topic?.id===item.id?'selected':''}>${index+1}. ${escape(item.title)}</option>`).join('')}${chapter.labs.map(id=>`<option value="/lesson/${id}">Practice: ${escape(LESSONS.find(l=>l.id===id).title)}</option>`).join('')}</select></label><div class="reading-shortcuts">${previous?`<a href="#/chapter/${chapter.id}/${previous.id}" aria-label="Previous: ${escape(previous.title)}">← Previous</a>`:''}${following?`<a href="#/chapter/${chapter.id}/${following.id}" aria-label="${topic?'Next':'Start'}: ${escape(following.title)}">${topic?'Next':'Start chapter'} →</a>`:data.practice?`<a href="#/lesson/${data.practice}">Practice →</a>`:''}</div></nav><p class="eyebrow">${topic?`Lesson ${position+1} of ${chapter.topics.length}`:`Chapter ${chapter.number} · ${chapter.topics.length} lessons`}</p><h1 tabindex="-1">${escape(topic?topic.title:chapter.title)}</h1>`;
    if(!topic)return header+`<p class="lesson-deck">${escape(data.intro)}</p><h2>What you will learn</h2><ul>${data.outcomes.map(s=>'<li>'+escape(s)+'</li>').join('')}</ul><h2>Read in order</h2><ol class="topic-list">${chapter.topics.map(t=>`<li><a href="#/chapter/${chapter.id}/${t.id}">${escape(t.title)}</a></li>`).join('')}</ol>${practice(chapter,data)}<p class="supporting">Teaching baseline: C17. ${chapter.execution.mode==='browser'?'These examples run in the page.':'Read here and use the Codespaces commands for native work.'} <a href="#/setup">Execution and setup guide</a>.</p><nav class="page-navigation"><a href="#/chapter/${chapter.id}/1">Start the chapter →</a>${chapter.number>1?`<a href="#/chapter/${COURSE.chapters[chapter.number-2].id}">Previous chapter</a>`:''}</nav>`;
    const t=data.topics[topic.id],i=chapter.topics.indexOf(topic),next=chapter.topics[i+1],prev=chapter.topics[i-1],nextChapter=COURSE.chapters[chapter.number];
    return header+`<article class="topic-content"><p class="lesson-deck">${escape(t.intro)}</p><p>${t.explanation}</p><section class="worked-example"><h2>Worked example</h2>${t.runtime==='native'?nativeExample(chapter,topic,t):'<p class="example-note">Edit and run here. Your changes are saved; Reset restores the original.</p><div id="inline-editor-host"></div>'}<details class="original-output"><summary>Expected output of the original program</summary><pre>${escape(t.expected)}</pre></details><p class="example-walkthrough"><strong>Original program:</strong> ${t.walkthrough}</p><h3>Try a change</h3><p>${escape(t.tryit)}</p></section><h2>Watch for this</h2><p>${t.pitfall}</p><section class="prediction"><h2>Check your understanding</h2><fieldset><legend>${escape(t.question)}</legend>${t.choices.map((s,j)=>`<label><input type="radio" name="topic-check" value="${j}"> ${escape(s)}</label>`).join('')}</fieldset><button data-topic-check data-chapter="${chapter.id}" data-topic="${topic.id}">Check answer</button><p id="topic-feedback" role="status"></p></section>${!next?practice(chapter,data):''}</article><nav class="page-navigation">${prev?`<a href="#/chapter/${chapter.id}/${prev.id}">← Previous topic</a>`:`<a href="#/chapter/${chapter.id}">← Chapter overview</a>`}${next?`<a href="#/chapter/${chapter.id}/${next.id}">Next: ${escape(next.title)} →</a>`:nextChapter?`<a href="#/chapter/${nextChapter.id}${nextChapter.status==='ready'?'/1':''}">Next chapter: ${escape(nextChapter.title)} →</a>`:'<a href="#/course">Course map →</a>'}</nav>`;
  }
  document.addEventListener('click',event=>{const b=event.target.closest('[data-topic-check]');if(!b)return;const t=content[b.dataset.chapter].topics[b.dataset.topic],selected=document.querySelector('input[name="topic-check"]:checked');document.getElementById('topic-feedback').textContent=selected?`${Number(selected.value)===t.answer?'Correct.':'Not quite.'} ${t.why}`:'Choose an answer first.';});
  window.authoredLessons={render,content};
})();
