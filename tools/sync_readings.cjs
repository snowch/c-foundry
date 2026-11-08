// Export authored readings and runnable examples without overwriting student exercises.
const fs=require('fs'),vm=require('vm'),path=require('path');
const context={document:{addEventListener(){}}};context.window=context;vm.createContext(context);
for(const file of ['lessons','course','part1','part2','part3','part4','part5','part6','part7','part8','part9','readings'])vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);
const tests={};fs.mkdirSync('native/examples',{recursive:true});
const text=x=>x.replace(/<code>(.*?)<\/code>/g,'`$1`').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
for(const chapter of context.COURSE.chapters.filter(c=>c.status==='ready')){
 const content=context.authoredLessons.content[chapter.id];
 let markdown=`# Chapter ${chapter.number}: ${chapter.title}\n\nPart ${chapter.part+1}: ${context.COURSE.parts[chapter.part]}. Teaching baseline: C17.\n\n${content.intro}\n\n## Outcomes\n\n`+content.outcomes.map(x=>'- '+x).join('\n')+'\n\n';
 for(const topic of chapter.topics){
  const t=content.topics[topic.id],id=chapter.id+'-'+topic.id;
  const files=t.files||{'main.c':t.code},native=t.runtime==='native';
  const listing=Object.entries(files).map(([name,code])=>`### ${name}\n\n\`\`\`c\n${code}\`\`\`\n\n`).join('');
  const command=t.command||`make example EXAMPLE=${id}`;
  const lab=t.lab?`## ${t.lab.title} (optional)\n\nRun in Codespaces or local Linux with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: \`${t.lab.workspace}\`.\n\n\`\`\`sh\n${t.lab.command}\n\`\`\`\n\n`+t.lab.steps.map(step=>`### ${step.title}\n\n${step.body}\n\n\`\`\`text\n${step.command}\n\`\`\`\n\n`).join('')+`<details><summary>Hint and separate reference</summary>\n\n${t.lab.hint}\n\n</details>\n\n`:'';
  const reading=`## ${chapter.number}.${topic.id} ${topic.title}\n\n${t.intro}\n\n${text(t.explanation)}\n\n${lab}${listing}`+(t.input?`Input: \`${t.input.trim()}\`\n\n`:'')+`Output:\n\n\`\`\`text\n${t.expected}\n\`\`\`\n\n${text(t.walkthrough)}\n\n**Watch for:** ${text(t.pitfall)}\n\n**Check:** ${t.question}\n\n`+t.choices.map((s,i)=>`${i+1}. ${s}`).join('\n')+`\n\n<details><summary>Answer</summary>\n\n${t.choices[t.answer]}. ${t.why}\n\n</details>\n\n**Try:** ${t.tryit}\n\nRun from the repository root:\n\n\`\`\`sh\n${command}\n\`\`\`\n\n`;
  tests[id]=[{name:topic.title,input:t.input,expected:t.expected}];if(t.flags)tests[id][0].flags=t.flags;
  if(native){const dir='native/examples/'+id;fs.mkdirSync(dir,{recursive:true});for(const [name,code] of Object.entries(files))fs.writeFileSync(path.join(dir,name),code);tests[id][0].sources=Object.keys(files).filter(f=>f.endsWith('.c')).map(f=>id+'/'+f);fs.writeFileSync(dir+'/README.md',`# ${topic.title}\n\nComplete native example, ready to edit and run in Codespaces or locally.\n\n${reading}`);}
  else fs.writeFileSync('native/examples/'+id+'.c',t.code);
  markdown+=reading;
 }
 if(content.practice){markdown+=`## Chapter practice\n\nEdit \`native/exercises/${content.practice}.c\`, then run:\n\n\`\`\`sh\nmake exercise EXERCISE=${content.practice}\n\`\`\`\n\n`;}
 else if(content.nativePractice){markdown+=`## Chapter practice\n\nComplete the TODOs in \`native/projects/${content.nativePractice.id}\`. Initial failure is expected; see the project README.\n\n\`\`\`sh\nmake project PROJECT=${content.nativePractice.id}\n\`\`\`\n\n`;}
 if(content.practicePlan){const p=content.practicePlan;markdown+=`## Build it yourself\n\n${p.goal}\n\n`+p.tasks.map((x,i)=>`${i+1}. ${x}`).join('\n')+'\n\n### Check your work\n\n'+p.checks.map(x=>'- '+x).join('\n')+`\n\nBaseline command (checks original output, not every extension):\n\n\`\`\`sh\nmake example EXAMPLE=${p.example}\n\`\`\`\n\n`;}
 markdown+=`Chapter workspace command: \`${chapter.command}\`.\n\nGenerated from dist/part${chapter.part+1}.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/${chapter.id}\n`;
 fs.writeFileSync(path.join(chapter.workspace,'README.md'),markdown);
}
fs.writeFileSync('native/examples/tests.json',JSON.stringify(tests,null,2)+'\n');
console.log(`Exported ${Object.keys(tests).length} complete examples and ${context.COURSE.chapters.length} chapter readings.`);

fs.mkdirSync('dist/assets',{recursive:true});const sample=Buffer.alloc(88);Buffer.from([0x54,0x44,0x42,0x31,1,40,2,0]).copy(sample);for(const [i,id,name,score] of [[0,1,'Ada',90],[1,2,'Grace',80]]){const at=8+i*40;sample.writeUInt32LE(id,at);sample.write(name,at+4,'ascii');sample.writeUInt32LE(score,at+36);}fs.writeFileSync('dist/assets/tinydb-sample.tdb',sample);
