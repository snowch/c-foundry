(() => {
  const $ = id => document.getElementById(id);
  const cell = (value,label='',state='') => `<div class="viz-cell ${state}"><span>${label}</span><strong>${value}</strong></div>`;
  const flow = (labels,active) => `<div class="viz-flow">${labels.map((label,i)=>`${i?'<span class="flow-arrow" aria-hidden="true">→</span>':''}<div class="flow-node ${i===active?'current':''}"><span>0${i+1}</span><strong>${label}</strong></div>`).join('')}</div>`;
  const scenes = {
    hello: {title:'From source to something you can see',steps:[
      {caption:'Your C source describes what the program should do.',html:flow(['C source','Wasm program','Console'],0),code:'printf("Hello, C!\\n");'},
      {caption:'Clang compiles the source and the linker produces a WebAssembly module.',html:flow(['C source','Wasm program','Console'],1),code:'main.c → main.o → main.wasm'},
      {caption:'The browser executes the module. printf writes your message to the console.',html:flow(['C source','Wasm program','Console'],2),code:'Hello, C!'}
    ]},
    loops:{title:'Watch the accumulator grow',complexity:'O(n) time · O(1) extra space',steps:Array.from({length:6},(_,i)=>({caption:i?`Add ${i} to the running total. ${i===5?'All five integers have been added.':'The earlier sum stays in total.'}`:'Start with zero, before adding any integers.',html:`<div class="viz-cells">${[1,2,3,4,5].map(v=>cell(v,`i = ${v}`,v===i?'current':v<i?'visited':'')).join('')}<span class="flow-arrow">→</span>${cell(i*(i+1)/2,'total','result')}</div>`,code:i?`total = ${i*(i-1)/2} + ${i};`:'int total = 0;'}))},
    pointers:{title:'The address stays. The value changes.',complexity:'O(1) time · O(1) extra space',steps:[
      {caption:'The pointers a and b refer to two separate integers. These addresses are illustrative.',values:[10,42,'—'],code:'swap(&x, &y);'},
      {caption:'Save the original value of x so it is not lost.',values:[10,42,10],code:'int temp = *a;'},
      {caption:'Write the value at b into the location pointed to by a.',values:[42,42,10],code:'*a = *b;'},
      {caption:'Copy the saved value into the location pointed to by b. The swap is complete.',values:[42,10,10],code:'*b = temp;'}
    ].map(s=>({...s,html:`<div class="memory-viz"><div><span class="pointer-label">a → &x</span>${cell(s.values[0],'x · 0x100','current')}</div><div><span class="pointer-label">b → &y</span>${cell(s.values[1],'y · 0x104','current')}</div><div><span class="pointer-label">saved value</span>${cell(s.values[2],'temp','result')}</div></div>`}))},
    heap:{title:'Allocate → initialize → release',complexity:'O(n) time · O(n) allocated space',steps:[
      {caption:'malloc reserves five integers. Their values are not initialized yet; do not read them.',html:`<div class="viz-cells">${[0,1,2,3,4].map(i=>cell('?',`[${i}]`,'')).join('')}</div>`,code:'int *values = malloc(5 * sizeof *values);'},
      {caption:'Check that allocation succeeded, then initialize every element before reading it.',html:`<div class="viz-cells">${[1,4,9,16,25].map((v,i)=>cell(v,`[${i}]`,'current')).join('')}</div>`,code:'values[i] = (i + 1) * (i + 1);'},
      {caption:'free releases the allocation. These cells are no longer valid to access through values.',html:`<div class="viz-cells">${[0,1,2,3,4].map(i=>cell('×',`released`,'discarded')).join('')}</div>`,code:'free(values);'}
    ]},
    search:{title:'Find 23 by halving the search range',complexity:'O(log n) worst-case time · O(1) extra space',steps:[
      {lo:0,hi:7,mid:-1,caption:'Start with eight sorted values. The target is 23.',code:'lo = 0; hi = 7;'},
      {lo:0,hi:7,mid:3,caption:'The middle value is 12. Since 23 is larger, discard indices 0 through 3.',code:'mid = 0 + (7 - 0) / 2;  // 3'},
      {lo:4,hi:7,mid:5,caption:'Now only four candidates remain. The middle value is 23: found at index 5.',code:'a[5] == 23;  // return 5'}
    ].map(s=>({...s,html:`<div class="viz-cells search-cells">${[2,5,8,12,16,23,38,56].map((v,i)=>cell(v,i===s.mid?'mid':`[${i}]`,i<s.lo||i>s.hi?'discarded':i===s.mid?'current':'')).join('')}</div>`}))},
    sort:{title:'Build a sorted prefix',complexity:'O(n²) worst-case time · O(1) extra space',steps:[
      {a:[9,2,7,1,5],prefix:1,caption:'A one-element prefix is already sorted. Now insert each remaining value into it.',code:'for (int i = 1; i < n; i++)'},
      {a:[2,9,7,1,5],prefix:2,caption:'Save 2, shift 9 to the right, and insert 2 at the beginning.',code:'[9] + 2 → [2, 9]'},
      {a:[2,7,9,1,5],prefix:3,caption:'Insert 7 between 2 and 9. The sorted prefix now contains three elements.',code:'[2, 9] + 7 → [2, 7, 9]'},
      {a:[1,2,7,9,5],prefix:4,caption:'Insert 1 at the front. All three earlier elements shift right.',code:'[2, 7, 9] + 1 → [1, 2, 7, 9]'},
      {a:[1,2,5,7,9],prefix:5,caption:'Insert 5. Repeated shifting can add up to quadratic work in the worst case.',code:'sorted: [1, 2, 5, 7, 9]'}
    ].map(s=>({...s,html:`<div class="sort-bars">${s.a.map((v,i)=>`<div class="sort-column ${i<s.prefix?'sorted':''}"><div style="height:${v*7+18}px">${v}</div><small>[${i}]</small></div>`).join('')}<span class="sort-key">Green = sorted prefix</span></div>`}))},
    rows:{title:'One row, two fields',steps:[
      {caption:'A struct groups an integer ID and a character array into one record.',html:`<div class="row-viz">${cell('int','id','')}${cell('char[32]','name','')}<span class="struct-brace">Row</span></div>`,code:'typedef struct { int id; char name[32]; } Row;'},
      {caption:'Read into the fields. The string needs a zero terminator after the final character.',html:`<div class="row-viz">${cell(1,'id','current')}<div class="string-cells"><span>name[32]</span><div>${['A','d','a','\\0','…'].map(c=>`<b>${c}</b>`).join('')}</div></div></div>`,code:'scanf("%d %31s", &row.id, row.name);'},
      {caption:'Access each field with the dot operator to display the record.',html:'<div class="table-viz"><table><thead><tr><th>id</th><th>name</th></tr></thead><tbody><tr class="found"><td>1</td><td>Ada</td></tr></tbody></table><span class="query-result">→ 1 | Ada</span></div>',code:'printf("%d | %s\\n", row.id, row.name);'}
    ]},
    query:{title:'A table scan, one row at a time',complexity:'O(n) worst-case lookup · O(1) extra space',steps:[
      {at:-1,caption:'Two insert commands populate the table. Select ID 2 to search for Grace.',code:'select 2',result:'target id = 2'},
      {at:0,caption:'Inspect the first row. ID 1 does not match the requested ID 2.',code:'rows[0].id == 2  // false',result:'keep scanning →'},
      {at:1,caption:'The second row matches. Return its index and display the record.',code:'rows[1].id == 2  // true',result:'2 | Grace'}
    ].map(s=>({...s,html:`<div class="table-viz"><table><thead><tr><th>index</th><th>id</th><th>name</th></tr></thead><tbody>${['Ada','Grace'].map((v,i)=>`<tr class="${i===s.at?'found':''}"><td>${i}</td><td>${i+1}</td><td>${v}</td></tr>`).join('')}</tbody></table><span class="query-result">${s.result}</span></div>`}))}
  };
  let id='hello', step=0;
  function render(){
    const scene=scenes[id], frame=scene.steps[step];
    $('visual-content').innerHTML=`<div class="visual-explanation"><h3>${scene.title}</h3><p>${frame.caption}</p>${scene.complexity?`<button class="complexity-pill" data-explore-complexity>${scene.complexity} ↗</button>`:''}</div><div class="visual-stage">${frame.html}<code class="visual-code">${frame.code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></div>`;
    $('visual-step-label').textContent=`${step+1} / ${scene.steps.length} · ${step===scene.steps.length-1?'Example complete':'Step through the idea'}`;
    $('visual-back').disabled=step===0;$('visual-next').disabled=step===scene.steps.length-1;
  }
  $('visual-back').onclick=()=>{step=Math.max(0,step-1);render();};
  $('visual-next').onclick=()=>{step=Math.min(scenes[id].steps.length-1,step+1);render();};
  $('visual-reset').onclick=()=>{step=0;render();};
  $('visual-toggle').onclick=()=>{const hide=!$('visual-body').hidden;$('visual-body').hidden=hide;$('visual-toggle').setAttribute('aria-expanded',String(!hide));$('visual-toggle').textContent=hide?'Show illustration +':'Hide illustration −';};
  function updateComplexity(){
    const n=2**Number($('complexity-size').value);$('complexity-n').textContent=`${n.toLocaleString()} items`;
    const rows=[['O(1)','Access an array element',1],['O(log n)','Binary search',Math.log2(n)],['O(n)','Scan an array',n],['O(n log n)','Merge sort',n*Math.log2(n)],['O(n²)','Insertion sort · worst case',n*n]];
    $('complexity-bars').innerHTML=rows.map(([label,example,value],i)=>`<div class="complexity-row"><div><strong>${label}</strong><span>${example}</span><b>${value.toLocaleString()}</b></div><div class="growth-track"><div class="growth-bar growth-${i}" style="width:${Math.log10(value)/Math.log10(1024**2)*100}%"></div></div></div>`).join('');
  }
  $('complexity-size').oninput=updateComplexity;
  window.lessonVisuals={show(next){id=next;step=0;render();},updateComplexity};
})();
