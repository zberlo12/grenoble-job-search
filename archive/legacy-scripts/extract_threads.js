const fs = require('fs');

const files = [
  'C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/876ad50e-a842-4c3a-b279-a78f2e255327/tool-results/mcp-claude_ai_Gmail-get_thread-1785272944190.txt',
  'C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/876ad50e-a842-4c3a-b279-a78f2e255327/tool-results/mcp-claude_ai_Gmail-get_thread-1785272945565.txt',
  'C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/876ad50e-a842-4c3a-b279-a78f2e255327/tool-results/mcp-claude_ai_Gmail-get_thread-1785272945233.txt',
  'C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/876ad50e-a842-4c3a-b279-a78f2e255327/tool-results/mcp-claude_ai_Gmail-get_thread-1785272946237.txt',
  'C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/876ad50e-a842-4c3a-b279-a78f2e255327/tool-results/mcp-claude_ai_Gmail-get_thread-1785272947171.txt',
];

for (const f of files) {
  console.log('=====', f);
  const raw = fs.readFileSync(f, 'utf8');
  let d;
  try { d = JSON.parse(raw); } catch (e) { console.log('PARSE ERROR', e.message, 'len', raw.length); continue; }
  const msg = d.messages[0];
  console.log('SUBJECT:', msg.subject);
  console.log('PLAINTEXT LEN:', (msg.plaintextBody || '').length);
  console.log(msg.plaintextBody);
  console.log('');
}
