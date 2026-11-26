// Reading marks are explicit and independent of exercise output checks.
(() => {
  const prefix='c-foundry:lesson-done:v1:';
  const chapters=COURSE.chapters.filter(chapter=>chapter.status==='ready');
  const ids=new Set(chapters.flatMap(chapter=>chapter.topics.map(topic=>chapter.id+'/'+topic.id)));
  const completed=new Set(),unsaved=new Set();
  function read(id){
    try{if(localStorage.getItem(prefix+id)==='true')completed.add(id);else completed.delete(id);unsaved.delete(id);}catch(_){}
  }
  ids.forEach(read);
  function publish(){window.dispatchEvent(new Event('lessoncompletionchange'));}
  function mark(id,done){
    if(!ids.has(id))return;
    if(done)completed.add(id);else completed.delete(id);
    try{localStorage.setItem(prefix+id,String(done));unsaved.delete(id);}catch(_){unsaved.add(id);}
    publish();
  }
  window.addEventListener('storage',event=>{
    try{if(event.storageArea&&event.storageArea!==localStorage)return;}catch(_){return;}
    if(event.key===null)ids.forEach(read);
    else if(event.key.startsWith(prefix)&&ids.has(event.key.slice(prefix.length)))read(event.key.slice(prefix.length));
    else return;
    publish();
  });
  window.lessonCompletion={
    valid:id=>ids.has(id),
    isDone:id=>completed.has(id),
    isUnsaved:id=>unsaved.has(id),
    count:chapter=>chapter.topics.filter(topic=>completed.has(chapter.id+'/'+topic.id)).length,
    total:()=>({done:completed.size,available:ids.size,unsaved:unsaved.size}),
    mark
  };
})();

// Practice completion is a learner choice, separate from reading and output checks.
(() => {
  const prefix='c-foundry:practice-done:v1:',ids=new Set(COURSE.chapters.flatMap(c=>c.labs));
  const completed=new Set(),unsaved=new Set();
  function read(id){try{if(localStorage.getItem(prefix+id)==='true')completed.add(id);else completed.delete(id);unsaved.delete(id);}catch(_){}}
  ids.forEach(read);
  function publish(){window.dispatchEvent(new Event('practicecompletionchange'));}
  function mark(id,done){if(!ids.has(id))return;if(done)completed.add(id);else completed.delete(id);try{localStorage.setItem(prefix+id,String(done));unsaved.delete(id);}catch(_){unsaved.add(id);}publish();}
  window.addEventListener('storage',event=>{try{if(event.storageArea&&event.storageArea!==localStorage)return;}catch(_){return;}if(event.key===null)ids.forEach(read);else if(event.key.startsWith(prefix)&&ids.has(event.key.slice(prefix.length)))read(event.key.slice(prefix.length));else return;publish();});
  window.practiceCompletion={register(values){for(const id of values)if(!ids.has(id)){ids.add(id);read(id);}},valid:id=>ids.has(id),isDone:id=>completed.has(id),isUnsaved:id=>unsaved.has(id),total:()=>({done:completed.size,available:ids.size,unsaved:unsaved.size}),mark};
})();
