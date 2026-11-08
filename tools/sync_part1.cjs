// Export the authored browser examples and chapter readings for native use.
// This maintainer command does not overwrite students' editable exercise starters.
const fs=require('fs'),vm=require('vm'),path=require('path');
const context={document:{addEventListener(){}}};context.window=context;vm.createContext(context);
for(const file of ['lessons','course','part1'])vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);
const tests={};fs.mkdirSync('native/examples',{recursive:true});
for(const chapter of context.COURSE.chapters.filter(c=>c.part===0)){
 const content=context.PART_ONE[chapter.id];
 let markdown=`# Chapter ${chapter.number}: ${chapter.title}\n\nPart 1: Learn the language. Teaching baseline: C17.\n\n${content.intro}\n\n## Outcomes\n\n`+content.outcomes.map(x=>'- '+x).join('\n')+'\n\n';
 for(const topic of chapter.topics){const t=content.topics[topic.id],id=chapter.id+'-'+topic.id;fs.writeFileSync('native/examples/'+id+'.c',t.code);tests[id]=[{name:topic.title,input:t.input,expected:t.expected}];
  const text=x=>x.replace(/<code>(.*?)<\/code>/g,'`$1`').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  markdown+=`## ${chapter.number}.${topic.id} ${topic.title}\n\n${t.intro}\n\n${text(t.explanation)}\n\n\`\`\`c\n${t.code}\`\`\`\n\n`+(t.input?`Input: \`${t.input.trim()}\`\n\n`:'')+`Output:\n\n\`\`\`text\n${t.expected}\n\`\`\`\n\n${text(t.walkthrough)}\n\n**Watch for:** ${text(t.pitfall)}\n\n**Check:** ${t.question}\n\n`+t.choices.map((s,i)=>`${i+1}. ${s}`).join('\n')+`\n\n<details><summary>Answer</summary>\n\n${t.choices[t.answer]}. ${t.why}\n\n</details>\n\n**Try:** ${t.tryit}\n\nRun the complete example:\n\n\`\`\`sh\nmake example EXAMPLE=${id}\n\`\`\`\n\n`;
 }
 markdown+=`## Chapter practice\n\nEdit \`native/exercises/${content.practice}.c\`, then run:\n\n\`\`\`sh\nmake exercise EXERCISE=${content.practice}\n\`\`\`\n\nChapter workspace command: \`${chapter.command}\`.\n\nGenerated from dist/part1.js by tools/sync_part1.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/${chapter.id}\n`;
 fs.writeFileSync(path.join(chapter.workspace,'README.md'),markdown);
}
fs.writeFileSync('native/examples/tests.json',JSON.stringify(tests,null,2)+'\n');
console.log('Exported 25 complete examples and five chapter readings.');
