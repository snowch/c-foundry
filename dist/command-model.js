/* Shared by the command workspace, compiler worker, and Node checks. */
(function(root){
  const limits={files:32,fileBytes:2*1024*1024,totalBytes:8*1024*1024,sourceBytes:256*1024,output:100000};
  const reserved=new Set(['include','lib','tmp','dev','cc','clang','lld']);
  function validName(name){return typeof name==='string'&&/^[A-Za-z0-9][A-Za-z0-9._ -]{0,79}$/.test(name)&&name.trim()===name&&!reserved.has(name);}
  function validateFiles(files){
    if(!Array.isArray(files)||files.length>limits.files)throw Error(`A workspace holds at most ${limits.files} files.`);
    const seen=new Set();let total=0;
    for(const file of files){
      if(!file||!validName(file.name)||seen.has(file.name))throw Error('Use unique, flat filenames beginning with a letter or number (up to 80 characters).');
      if(!(file.data instanceof Uint8Array))throw Error('File contents must be bytes.');
      if(file.data.byteLength>limits.fileBytes)throw Error('A file exceeds the 2 MB workspace limit.');
      total+=file.data.byteLength;seen.add(file.name);
    }
    if(total>limits.totalBytes)throw Error('The workspace exceeds its 8 MB limit.');
    return total;
  }
  function tokenize(text){
    if(typeof text!=='string'||text.length>4096)throw Error('Commands may contain at most 4096 characters.');
    const words=[];let word='',quote='',active=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='\0'||ch==='\n'||ch==='\r')throw Error('Run one command at a time.');
      if(ch==='\\'&&quote!=="'"){if(i+1===text.length)throw Error('The command ends with an unfinished escape.');word+=text[++i];active=true;continue;}
      if(quote){if(ch===quote)quote='';else word+=ch;active=true;continue;}
      if(ch==='"'||ch==="'"){quote=ch;active=true;continue;}
      if(/\s/.test(ch)){if(active){words.push(word);word='';active=false;}continue;}
      if(/[|&<>;]/.test(ch))throw Error('This command runner does not expand shell operators. Quote an argument containing punctuation.');
      word+=ch;active=true;
    }
    if(quote)throw Error('Close the quoted argument before running.');
    if(active)words.push(word);
    return words;
  }
  function compileCommand(words){
    if(words[0]!=='cc')return null;
    const sources=[];let output='';
    for(let i=1;i<words.length;i++){
      if(words[i]==='-o'){if(output||!words[i+1])throw Error('Supply one output name after -o.');output=words[++i];}
      else if(validName(words[i])&&words[i].endsWith('.c'))sources.push(words[i]);
      else throw Error('Build with cc source.c [other.c] -o program. Compiler flags are fixed to the course C17 baseline.');
    }
    if(!sources.length||sources.length>8||new Set(sources).size!==sources.length||!validName(output)||sources.includes(output))throw Error('Choose 1–8 unique C sources and a different valid output name: cc main.c -o program.');
    return {sources,output};
  }
  function isWasm(data){return data.length>=8&&data[0]===0&&data[1]===97&&data[2]===115&&data[3]===109;}
  function quote(word){return /[^A-Za-z0-9._/-]/.test(word)?'"'+word.replace(/["\\]/g,'\\$&')+'"':word;}
  root.commandModel={limits,validName,validateFiles,tokenize,compileCommand,isWasm,quote};
})(typeof self==='undefined'?globalThis:self);
