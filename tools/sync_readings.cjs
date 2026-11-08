// Export authored readings and runnable examples without overwriting student exercises.
const fs=require('fs'),vm=require('vm'),path=require('path');
const context={document:{addEventListener(){}}};context.window=context;vm.createContext(context);
for(const file of ['lessons','course','part1','part2','readings'])vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);
const tests={};fs.mkdirSync('native/examples',{recursive:true});
const text=x=>x.replace(/<code>(.*?)<\/code>/g,'`$1`').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
for(const chapter of context.COURSE.chapters.filter(c=>c.status==='ready')){
 const content=context.authoredLessons.content[chapter.id];
 let markdown=`# Chapter ${chapter.number}: ${chapter.title}\n\nPart ${chapter.part+1}: ${context.COURSE.parts[chapter.part]}. Teaching baseline: C17.\n\n${content.intro}\n\n## Outcomes\n\n`+content.outcomes.map(x=>'- '+x).join('\n')+'\n\n';
 for(const topic of chapter.topics){
  const t=content.topics[topic.id],id=chapter.id+'-'+topic.id;
  const files=t.files||{'main.c':t.code},native=t.runtime==='native';
  const listing=Object.entries(files).map(([name,code])=>`### ${name}\n\n\`\`\`c\n${code}\`\`\`\n\n`).join('');
  const command=`make example EXAMPLE=${id}`;
  const reading=`## ${chapter.number}.${topic.id} ${topic.title}\n\n${t.intro}\n\n${text(t.explanation)}\n\n${listing}`+(t.input?`Input: \`${t.input.trim()}\`\n\n`:'')+`Output:\n\n\`\`\`text\n${t.expected}\n\`\`\`\n\n${text(t.walkthrough)}\n\n**Watch for:** ${text(t.pitfall)}\n\n**Check:** ${t.question}\n\n`+t.choices.map((s,i)=>`${i+1}. ${s}`).join('\n')+`\n\n<details><summary>Answer</summary>\n\n${t.choices[t.answer]}. ${t.why}\n\n</details>\n\n**Try:** ${t.tryit}\n\nRun from the repository root:\n\n\`\`\`sh\n${command}\n\`\`\`\n\n`;
  tests[id]=[{name:topic.title,input:t.input,expected:t.expected}];
  if(native){const dir='native/examples/'+id;fs.mkdirSync(dir,{recursive:true});for(const [name,code] of Object.entries(files))fs.writeFileSync(path.join(dir,name),code);tests[id][0].sources=Object.keys(files).filter(f=>f.endsWith('.c')).map(f=>id+'/'+f);fs.writeFileSync(dir+'/README.md',`# ${topic.title}\n\nComplete native example, ready to edit and run in Codespaces or locally.\n\n${reading}`);}
  else fs.writeFileSync('native/examples/'+id+'.c',t.code);
  markdown+=reading;
 }
 const command=content.practice?`make exercise EXERCISE=${content.practice}`:`make project PROJECT=${content.nativePractice.id}`;
 markdown+=`## Chapter practice\n\n${content.practice?`Edit \`native/exercises/${content.practice}.c\`.`:`Complete the TODOs in \`native/projects/${content.nativePractice.id}\`. The initial student code intentionally fails its checks; consult the project README for requirements.`}\n\n\`\`\`sh\n${command}\n\`\`\`\n\nChapter workspace command: \`${chapter.command}\`.\n\nGenerated from dist/part${chapter.part+1}.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/${chapter.id}\n`;
 fs.writeFileSync(path.join(chapter.workspace,'README.md'),markdown);
}
fs.writeFileSync('native/examples/tests.json',JSON.stringify(tests,null,2)+'\n');
console.log(`Exported ${Object.keys(tests).length} complete examples and ten chapter readings.`);
