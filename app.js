        // PBQ scenarios grounded in the Core 1 Student Guide / 220-1201 objectives.
        const pbqScenarios = [
            {
                id:'t568a', type:'wiring', title:'RJ45 Termination — T568A',
                desc:'You are terminating an Ethernet patch cable. Build the conductor order for the T568A standard, pin 1 through pin 8.',
                objective:'Drag or tap the eight wire colors into pins 1–8. Each conductor can be used only once.',
                hint:'T568A starts with the green pair. The blue pair is on pins 4 and 5.',
                target:['white/green','green','white/orange','blue','white/blue','orange','white/brown','brown']
            },
            {
                id:'t568b', type:'wiring', title:'RJ45 Termination — T568B',
                desc:'You are terminating an Ethernet patch cable. Build the conductor order for the T568B standard, pin 1 through pin 8.',
                objective:'Drag or tap the eight wire colors into pins 1–8. Each conductor can be used only once.',
                hint:'T568B swaps the orange and green pairs compared with T568A. The blue pair remains on pins 4 and 5.',
                target:['white/orange','orange','white/green','blue','white/blue','green','white/brown','brown']
            },
            {
                id:'ports', type:'matching', title:'Match Ports to Protocols',
                desc:'A technician is documenting common network services. Match each service to its standard TCP/UDP port.',
                objective:'Match all five services to the correct port number.',
                rows:[['HTTPS','443'],['SSH','22'],['DNS','53'],['SMB/CIFS','445'],['RDP','3389']],
                options:['22','53','443','445','3389']
            },
            {
                id:'poe', type:'matching', title:'Match PoE Types to PSE Power',
                desc:'A technician is checking whether a PoE switch can provide the required power. Match each PoE type to its PSE power level.',
                objective:'Match PoE Type 1–4 to the PSE figures used in the Core 1 reference.',
                rows:[['Type 1 / 802.3af','15.4 W'],['Type 2 / 802.3at','30 W'],['Type 3 / 802.3bt','60 W'],['Type 4 / 802.3bt','90 W']],
                options:['15.4 W','30 W','60 W','90 W']
            },
            {
                id:'ip', type:'classification', title:'Classify IPv4 Addresses',
                desc:'Classify each address as Private, APIPA, or Public using the Core 1 IPv4 ranges.',
                objective:'Classify all five addresses before submitting the PBQ.',
                rows:[['10.20.30.40','Private'],['172.20.5.10','Private'],['192.168.10.25','Private'],['169.254.22.8','APIPA'],['8.8.8.8','Public']],
                options:['Private','APIPA','Public']
            },
            {
                id:'hardware', type:'matching', title:'Match Network Hardware to Its Role',
                desc:'A small office is being documented. Match each network device to its primary role.',
                objective:'Match all four devices to the correct function.',
                rows:[['Switch','Connects devices within a LAN'],['Router','Connects different networks'],['Access point','Provides wireless LAN connectivity'],['Firewall','Filters network traffic']],
                options:['Connects devices within a LAN','Connects different networks','Provides wireless LAN connectivity','Filters network traffic']
            },
            {
                id:'cable', type:'cablecheck', title:'Copper Cable Termination Check',
                desc:'You are preparing a twisted-pair Ethernet cable for termination. Verify the termination method and installation limits.',
                objective:'Select the correct connector, termination standard, and maximum untwist allowed near the termination.',
                hint:'The Student Guide specifies RJ45 plugs for patch cords and no more than ½ inch (13 mm) untwisted near the termination.',
                fields:[
                    ['Connector','RJ45',['RJ11','RJ45','F-type','LC']],
                    ['Termination standard','T568B',['T568A','T568B','802.11ax','802.3at']],
                    ['Maximum untwist','13 mm (½ inch)',['5 mm','13 mm (½ inch)','25 mm','100 mm']]
                ]
            },
            {
                id:'storage', type:'matching', title:'Match Storage Interfaces to Their Use',
                desc:'A technician is identifying storage interfaces during a PC installation. Match each interface to the description that fits it.',
                objective:'Match all four storage technologies to the correct description.',
                rows:[['NVMe','SSD communication interface'],['SATA','Storage communication interface'],['SAS','Enterprise storage interface'],['RAID 1','Drive configuration for redundancy']],
                options:['SSD communication interface','Storage communication interface','Enterprise storage interface','Drive configuration for redundancy']
            }
        ];

        /**
         * Embedded Questions & Modules Data
         */
        class MainApp {
            constructor() {
                this.state = JSON.parse(localStorage.getItem('c1state_v6')) || {
                    answered: {},
                    wrong: [],
                    starred: [],
                    stats: {},
                    cardsViewed: 0,
                    pbqSolved: 0
                };

                this.currentView = 'home';
                
                // Quiz session state
                this.sessionPool = [];
                this.session = [];
                this.sessionIndex = 0;
                this.sessionAnswers = [];
                this.selectedOption = null;
                this.isAnswered = false;
                this.currentOptions = [];
                this.currentModeLabel = '';
                this.practiceCount = localStorage.getItem('c1_practice_count') || '10';

                // Flashcard State
                this.selectedModuleId = 1;
                this.cardIndex = 0;
                this.isCardFlipped = false;

                // PBQ State
                this.currentPBQIndex = 0;

                this.init();
            }

            init() {
                this.buildHomeControls();
                this.renderModulesGrid();
                this.updateGlobalStats();
                this.populateFlashcardDropdown();
                this.populatePBQDropdown();
                this.renderReference();
                this.updateReadiness();
                this.setPracticeCount(this.practiceCount);
            }

            updateReadiness() {
                let correct=0, attempted=0;
                Object.values(this.state.stats).forEach(s=>{correct+=s.c||0;attempted+=(s.c||0)+(s.w||0);});
                const coverage=DATA.questions.length ? Object.keys(this.state.answered).length/DATA.questions.length : 0;
                const accuracy=attempted ? correct/attempted : 0;
                let sum=0,n=0;
                DATA.modules.forEach(m=>{let c=0,t=0;m.lessons.forEach(l=>{const s=this.state.stats[l];if(s){c+=s.c||0;t+=(s.c||0)+(s.w||0);}});if(t){sum+=c/t;n++;}});
                const consistency=n?sum/n:0;
                const readiness=Math.round((coverage*.30+accuracy*.50+consistency*.20)*100);
                const v=document.getElementById('readiness-value'),b=document.getElementById('readiness-bar');
                if(v)v.textContent=readiness+'%'; if(b)b.style.width=readiness+'%';
            }
            startAllModules(){
                const sel=document.getElementById('all-module-count'); const val=sel?sel.value:'20';
                const pool=[...DATA.questions].sort(()=>Math.random()-.5); const n=val==='all'?pool.length:Math.min(Number(val),pool.length);
                this.startSession(pool.slice(0,n),`All Modules — ${n} Questions`);
            }
            changeFlashcardCount(v){this.flashcardCount=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);}
            populateFlashcardDropdown(){
                const s=document.getElementById('flashcards-module-select');s.innerHTML='<option value="all">All Modules</option>';
                DATA.modules.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`Module ${m.id}: ${m.title}`;s.appendChild(o);});
                s.value='all';this.selectedModuleId='all';this.flashcardCount=20;
            }
            changeFlashcardModule(v){this.selectedModuleId=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);}
            startFlashcardsForModule(v){this.selectedModuleId=v;document.getElementById('flashcards-module-select').value=v;this.navigateTo('flashcards');}
            loadFlashcards(v){
                const all=v==='all'?Object.values(DATA.flashcards).flat():[...(DATA.flashcards[String(v)]||[])];
                const n=this.flashcardCount||20; this.currentCards=[...all].sort(()=>Math.random()-.5).slice(0,n==='all'?all.length:Math.min(n,all.length));
                this.cardIndex=0;this.isCardFlipped=false;
                const m=DATA.modules.find(x=>x.id===Number(v));
                document.getElementById('flashcard-module-badge').textContent=v==='all'?'All Modules':`Module ${m.id}`;
                document.getElementById('flashcard-title').textContent=v==='all'?'Core 1 — Modules 1–10':m.title;
                const av=document.getElementById('flashcards-available');if(av)av.textContent=`${all.length} available`;
                this.renderCard();
            }
            populatePBQDropdown(){
                const existing=document.getElementById('pbq-scenario-select');if(!existing)return;
                existing.innerHTML=pbqScenarios.map((s,i)=>`<option value="${i}">Scenario ${i+1}: ${s.title}</option>`).join('');
            }
            submitPBQ(){
                const input=document.getElementById('terminal-input'),cmd=(input.value||'').trim().toLowerCase(),sc=pbqScenarios[this.currentPBQIndex];if(!cmd)return;
                const ok=sc.expected.some(x=>cmd===x.toLowerCase()||cmd.includes(x.toLowerCase())); const fb=document.getElementById('pbq-feedback');
                if(fb){fb.className=`mb-3 p-3 rounded-xl text-xs border ${ok?'bg-emerald-950/40 border-emerald-800 text-emerald-300':'bg-rose-950/40 border-rose-800 text-rose-300'}`;fb.innerHTML=ok?`<b>✓ Correct</b><div class="mt-1">${sc.success}</div>`:`<b>✗ Not correct</b><div class="mt-1">${sc.failure}</div><div class="mt-1 text-slate-500">Use the hint if needed and submit again.</div>`;}
                if(ok){const key=`pbq-${this.currentPBQIndex}`;this.state.pbqCompleted=this.state.pbqCompleted||{};if(!this.state.pbqCompleted[key]){this.state.pbqCompleted[key]=true;this.state.pbqSolved=(this.state.pbqSolved||0)+1;this.saveState();}}
            }
            startPortsQuiz() {
                const ports = [
                    ['20','FTP data'],['21','FTP control'],['22','SSH'],['23','Telnet'],['25','SMTP'],
                    ['53','DNS'],['67','DHCP server'],['68','DHCP client'],['80','HTTP'],['110','POP'],
                    ['143','IMAP'],['389','LDAP'],['443','HTTPS'],['445','SMB/CIFS'],['3389','RDP'],
                    ['123','NTP'],['161','SNMP'],['162','SNMP Trap'],['514','Syslog'],['1812','RADIUS authentication']
                ];
                const qs = ports.map(([port,name], i) => {
                    const distractors = ports.filter((_,j)=>j!==i).sort(()=>Math.random()-.5).slice(0,3).map(x=>x[0]);
                    const options = [port,...distractors].sort(()=>Math.random()-.5);
                    return {
                        id:`ref-port-${port}-${i}`,
                        module:7, lesson:'7A', difficulty:'Reference',
                        question:`Which port is used by ${name}?`,
                        options,
                        answer:options.indexOf(port),
                        explanation:`${name} uses port ${port} in the Core 1 reference.`
                    };
                });
                this.startSession(qs,'Ports & Protocols Quiz',20);
            }

            startStandardsQuiz() {
                const specs = DATA.questions.filter(q => q.concept === 'specs');
                if (!specs.length) {
                    alert('No Standards questions are available.');
                    return;
                }
                const pool = [...specs].sort(()=>Math.random()-.5).slice(0,Math.min(20,specs.length));
                this.startSession(pool,'Specs & Standards Quiz',pool.length);
            }

            renderReference(){
                const data={
                  'Ports & Protocols':[['20/21','FTP'],['22','SSH'],['23','Telnet'],['25','SMTP'],['53','DNS'],['67/68','DHCP'],['80','HTTP'],['110','POP3'],['143','IMAP'],['137–139','NetBIOS/NetBT'],['389','LDAP'],['443','HTTPS'],['445','SMB/CIFS'],['3389','RDP'],['123','NTP'],['161/162','SNMP / SNMP Trap'],['514','Syslog'],['1812/1813','RADIUS']],
                  'Wireless & IP':[['2.4GHz','Wi-Fi band'],['5GHz','Wi-Fi band'],['6GHz','Wi-Fi 6E band'],['802.11n','Wi-Fi 4'],['802.11ac','Wi-Fi 5'],['802.11ax','Wi-Fi 6'],['802.11be','Wi-Fi 7'],['APIPA','169.254.0.1–169.254.255.254'],['10.0.0.0/8','Private IPv4'],['172.16.0.0/12','Private IPv4'],['192.168.0.0/16','Private IPv4']],
                  'Cables & Standards':[['Cat5e','1Gbps / 100m'],['Cat6','1Gbps / 100m; 10Gbps / 55m'],['Cat6A','10Gbps / 100m'],['Cat7','10Gbps / 100m'],['Cat8','25/40Gbps / 30m'],['USB 3.2 Gen 2x2','20Gbps'],['USB4','Up to 40Gbps'],['Thunderbolt 3/4','Up to 40Gbps']],
                  'Power & PoE':[['802.3af','PoE Type 1 — 15.4W PSE'],['802.3at','PoE Type 2 — 30W PSE'],['802.3bt','PoE Type 3 — 60W PSE'],['802.3bt','PoE Type 4 — 90W PSE'],['USB PD','Up to 100W with suitable connectors/cables']],
                  'Hardware & Displays':[['IPS','LCD panel type'],['TN','LCD panel type'],['VA','LCD panel type'],['OLED','Display technology'],['Mini-LED','Display technology'],['x86/x64','CPU architecture'],['ARM','CPU architecture'],['RAID 0/1/5/6/10','Drive configurations']]
                };
                const root=document.getElementById('reference-content');if(!root)return;
                root.innerHTML=Object.entries(data).map(([title,items])=>`<div class="glass-card rounded-2xl p-5 border border-slate-800"><h3 class="font-bold text-white mb-3">${title}</h3><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${items.map(x=>`<div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><div class="font-mono font-bold text-cyan-300 text-xs">${x[0]}</div><div class="text-xs text-slate-300 mt-1">${x[1]}</div></div>`).join('')}</div></div>`).join('');
            }
            saveState() {
                localStorage.setItem('c1state_v6', JSON.stringify(this.state));
                this.updateGlobalStats();
                this.updateReadiness();
            }

            navigateTo(viewId) {
                this.currentView = viewId;
                ['home', 'flashcards', 'quiz', 'pbq', 'results', 'stats', 'reference'].forEach(v => {
                    const el = document.getElementById(`view-${v}`);
                    if (el) el.classList.add('hidden');
                    const nav = document.getElementById(`nav-${v}`);
                    if (nav) {
                        nav.classList.remove('bg-brand-600', 'text-white');
                        nav.classList.add('text-slate-400');
                    }
                });

                document.getElementById(`view-${viewId}`).classList.remove('hidden');
                const activeNav = document.getElementById(`nav-${viewId}`);
                if (activeNav) {
                    activeNav.classList.add('bg-brand-600', 'text-white');
                    activeNav.classList.remove('text-slate-400');
                }

                if (viewId === 'flashcards') this.loadFlashcards(this.selectedModuleId);
                if (viewId === 'pbq') this.loadPBQScenario(this.currentPBQIndex);
                if (viewId === 'stats') this.renderStatsView();
                if (viewId === 'reference') this.renderReference();

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            getWeakLessons() {
                const scores = {};
                DATA.questions.forEach(q => {
                    const x = this.state.stats[q.lesson];
                    if (x && (x.c + x.w) > 0) scores[q.lesson] = x.c / (x.c + x.w);
                });
                return Object.entries(scores).sort((a,b) => a[1] - b[1]).slice(0, 5).map(x => x[0]);
            }

            updateGlobalStats() {
                const totalQ = DATA.questions.length;
                const answeredKeys = Object.keys(this.state.answered);
                let correctTotal = 0;
                let attemptedTotal = 0;

                Object.values(this.state.stats).forEach(s => {
                    correctTotal += s.c || 0;
                    attemptedTotal += (s.c || 0) + (s.w || 0);
                });

                const accuracy = attemptedTotal > 0 ? Math.round((correctTotal / attemptedTotal) * 100) : 0;
                const weakCount = this.getWeakLessons().length;

                // Home hero stats
                document.getElementById('stat-total-q').textContent = totalQ;
                document.getElementById('stat-accuracy-home').textContent = `${accuracy}%`;
                document.getElementById('stat-wrong-home').textContent = this.state.wrong.length;
                document.getElementById('stat-starred-home').textContent = this.state.starred.length;

                // Feature card badges
                document.getElementById('badge-wrong').textContent = this.state.wrong.length;
                document.getElementById('badge-weak').textContent = weakCount;
                document.getElementById('badge-starred').textContent = this.state.starred.length;
                document.getElementById('badge-new').textContent = DATA.questions.filter(q => !this.state.answered[q.id]).length;
            }

            buildHomeControls() {
                const rs = document.getElementById('rangeSelect');
                const em = document.getElementById('extraModule');
                rs.innerHTML = '';
                em.innerHTML = '<option value="">No extra module</option>';

                for (let i = 1; i <= 8; i++) {
                    const o = document.createElement('option');
                    o.value = `${i}-${i+2}`;
                    o.textContent = `Modules ${i}–${i+2}`;
                    rs.appendChild(o);
                }

                DATA.modules.forEach(m => {
                    const o = document.createElement('option');
                    o.value = m.id;
                    o.textContent = `Module ${m.id}`;
                    em.appendChild(o);
                });
            }

            renderModulesGrid() {
                const grid = document.getElementById('modulesGrid');
                grid.innerHTML = '';

                DATA.modules.forEach(m => {
                    const qCount = DATA.questions.filter(q => q.module === m.id).length;
                    const card = document.createElement('div');
                    card.className = "glass-card rounded-2xl p-5 flex flex-col justify-between border border-slate-800 hover:border-brand-500/60 transition-all";
                    card.innerHTML = `
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white shadow-md">
                                    <i class="fa-solid ${m.icon} text-lg"></i>
                                </div>
                                <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Mod ${m.id}</span>
                            </div>
                            <h4 class="font-bold text-base text-white mb-1">${m.title}</h4>
                            <p class="text-xs text-slate-400 leading-relaxed mb-3">${qCount} Questions Available</p>
                            
                            <div class="flex flex-wrap gap-1 mb-4">
                                ${m.lessons.map(l => `<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-brand-accent border border-slate-700/50">${l}</span>`).join('')}
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-800 flex items-center gap-2">
                            <button onclick="app.startFlashcardsForModule(${m.id})" class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-clone text-brand-accent"></i> Cards
                            </button>
                            <button onclick="app.startModuleQuiz(${m.id})" class="flex-1 py-2 rounded-xl bg-brand-600/90 hover:bg-brand-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-play"></i> Quiz
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }

            setPracticeCount(count) {
                const allowed = ['10','20','30','50','75','100','all'];
                this.practiceCount = allowed.includes(String(count)) ? String(count) : '10';
                localStorage.setItem('c1_practice_count', this.practiceCount);
                const select = document.getElementById('practiceCountSelect');
                if (select) select.value = this.practiceCount;
            }

            startPracticeMode(mode) {
                let pool = [];
                let label = '';

                if (mode === 'final') {
                    pool = [...DATA.questions];
                    label = 'Final Test (Modules 1–10)';
                } else if (mode === 'random') {
                    pool = [...DATA.questions];
                    label = 'Random Practice';
                } else if (mode === 'wrong') {
                    pool = DATA.questions.filter(q => this.state.wrong.includes(q.id));
                    label = 'Wrong Questions Practice';
                } else if (mode === 'weak') {
                    const weak = this.getWeakLessons();
                    pool = DATA.questions.filter(q => weak.includes(q.lesson));
                    label = 'Weak Areas Practice';
                } else if (mode === 'starred') {
                    pool = DATA.questions.filter(q => this.state.starred.includes(q.id));
                    label = 'Starred Questions Review';
                } else if (mode === 'new') {
                    pool = DATA.questions.filter(q => !this.state.answered[q.id]);
                    label = 'New Unanswered Questions';
                }

                if (!pool.length) {
                    alert("No questions available in this practice set yet!");
                    return;
                }

                this.startSession(pool, label, this.practiceCount);
            }

            startChallenge() {
                const rs = document.getElementById('rangeSelect').value.split('-').map(Number);
                const extra = document.getElementById('extraModule').value;
                
                let pool = DATA.questions.filter(q => q.module >= rs[0] && q.module <= rs[1]);
                if (extra) {
                    pool = pool.concat(DATA.questions.filter(q => q.module === Number(extra)));
                }

                // De-duplicate
                pool = [...new Map(pool.map(q => [q.id, q])).values()];

                this.startSession(pool, `Challenge Modules ${rs[0]}–${rs[1]}${extra ? ` + Mod ${extra}` : ''}`);
            }

            startModuleQuiz(modId) {
                const pool = DATA.questions.filter(q => q.module === modId);
                const mod = DATA.modules.find(m => m.id === modId);
                this.startSession(pool, `Module ${modId}: ${mod.title}`);
            }

            startSession(pool, label, countOverride = null) {
                const countVal = document.getElementById('countSelect')?.value || '10';
                const requested = countOverride !== null
                    ? (String(countOverride) === 'all' ? pool.length : Math.min(Number(countOverride), pool.length))
                    : (countVal === 'All available' ? pool.length : parseInt(countVal));

                // Shuffle pool
                const shuffled = [...pool].sort(() => Math.random() - 0.5);
                this.sessionPool = pool;
                this.session = shuffled.slice(0, Math.min(requested, shuffled.length));
                this.sessionIndex = 0;
                this.sessionAnswers = [];
                this.currentModeLabel = label;

                this.navigateTo('quiz');
                this.renderQuizQuestion();
            }

            retrySession() {
                this.startSession(this.sessionPool, `${this.currentModeLabel} (Retry)`);
            }

            renderQuizQuestion() {
                const q = this.session[this.sessionIndex];
                if (!q) return;

                this.selectedOption = null;
                this.isAnswered = false;
                this.currentOptions = [];

                document.getElementById('quizLabel').textContent = this.currentModeLabel;
                document.getElementById('lessonTag').textContent = q.lesson;
                document.getElementById('difficultyTag').textContent = q.difficulty || 'Core 1';
                document.getElementById('questionText').textContent = q.question;
                document.getElementById('quizProgress').textContent = `${this.sessionIndex + 1} / ${this.session.length}`;
                
                const pct = (this.sessionIndex / this.session.length) * 100;
                document.getElementById('progressBar').style.width = `${pct}%`;

                // Star Button State
                const starBtn = document.getElementById('starBtn');
                const isStarred = this.state.starred.includes(q.id);
                starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;

                // Render Answers
                const ansDiv = document.getElementById('answers');
                ansDiv.innerHTML = '';
                this.currentOptions = q.options.map((text, idx) => ({text, correct: idx === q.answer})).sort(() => Math.random() - 0.5);
                this.currentOptions.forEach((opt, idx) => {
                    const optText = opt.text;
                    const btn = document.createElement('button');
                    btn.className = "w-full text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-sm font-medium text-slate-200 transition-all flex items-center justify-between group";
                    btn.onclick = () => this.selectOption(idx);
                    btn.id = `opt-${idx}`;
                    btn.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-lg bg-slate-900 text-slate-400 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center font-mono text-xs font-bold transition-all">${String.fromCharCode(65 + idx)}</span>
                            <span>${optText}</span>
                        </div>
                        <i class="fa-regular fa-circle text-slate-600 group-hover:text-brand-400 text-lg"></i>
                    `;
                    ansDiv.appendChild(btn);
                });

                // Reset feedback and action buttons
                document.getElementById('feedback').className = "hidden p-4 rounded-2xl border space-y-2";
                document.getElementById('confirmBtn').classList.remove('hidden');
                document.getElementById('nextBtn').classList.add('hidden');
            }

            selectOption(idx) {
                if (this.isAnswered) return;
                this.selectedOption = idx;

                const ansDiv = document.getElementById('answers');
                Array.from(ansDiv.children).forEach((child, i) => {
                    if (i === idx) {
                        child.className = "w-full text-left p-4 rounded-xl bg-brand-600/20 border-2 border-brand-500 text-sm font-medium text-white flex items-center justify-between";
                        child.querySelector('i').className = "fa-solid fa-circle-dot text-brand-accent text-lg";
                    } else {
                        child.className = "w-full text-left p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-sm font-medium text-slate-400 flex items-center justify-between opacity-60";
                        child.querySelector('i').className = "fa-regular fa-circle text-slate-600 text-lg";
                    }
                });
            }

            confirmAnswer() {
                if (this.selectedOption === null || this.isAnswered) {
                    alert("Please select an answer first.");
                    return;
                }

                this.isAnswered = true;
                const q = this.session[this.sessionIndex];
                const isCorrect = !!(this.currentOptions[this.selectedOption] && this.currentOptions[this.selectedOption].correct);

                this.sessionAnswers[this.sessionIndex] = isCorrect;

                // Update Local Storage stats
                if (!this.state.stats[q.lesson]) this.state.stats[q.lesson] = { c: 0, w: 0 };
                this.state.stats[q.lesson][isCorrect ? 'c' : 'w']++;
                this.state.answered[q.id] = true;

                if (!isCorrect && !this.state.wrong.includes(q.id)) {
                    this.state.wrong.push(q.id);
                } else if (isCorrect) {
                    this.state.wrong = this.state.wrong.filter(id => id !== q.id);
                }

                this.saveState();

                // Highlight Options
                const ansDiv = document.getElementById('answers');
                Array.from(ansDiv.children).forEach((child, i) => {
                    if (this.currentOptions[i] && this.currentOptions[i].correct) {
                        child.className = "w-full text-left p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-sm font-medium text-emerald-200 flex items-center justify-between";
                    } else if (i === this.selectedOption && !isCorrect) {
                        child.className = "w-full text-left p-4 rounded-xl bg-rose-500/20 border-2 border-rose-500 text-sm font-medium text-rose-200 flex items-center justify-between";
                    }
                });

                // Show Feedback
                const fb = document.getElementById('feedback');
                fb.classList.remove('hidden');
                if (isCorrect) {
                    fb.className = "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1";
                    fb.innerHTML = `<b class="text-emerald-400 text-sm block"><i class="fa-solid fa-circle-check"></i> Correct!</b> ${q.explanation}`;
                } else {
                    fb.className = "p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 space-y-1";
                    fb.innerHTML = `<b class="text-rose-400 text-sm block"><i class="fa-solid fa-circle-xmark"></i> Incorrect. Correct: ${q.options[q.answer]}</b> ${q.explanation}`;
                }

                document.getElementById('confirmBtn').classList.add('hidden');
                document.getElementById('nextBtn').classList.remove('hidden');
            }

            nextQuestion() {
                if (this.sessionIndex < this.session.length - 1) {
                    this.sessionIndex++;
                    this.renderQuizQuestion();
                } else {
                    this.showResults();
                }
            }

            toggleStarCurrentQuestion() {
                const q = this.session[this.sessionIndex];
                if (!q) return;

                if (this.state.starred.includes(q.id)) {
                    this.state.starred = this.state.starred.filter(id => id !== q.id);
                } else {
                    this.state.starred.push(q.id);
                }

                this.saveState();
                const starBtn = document.getElementById('starBtn');
                const isStarred = this.state.starred.includes(q.id);
                starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;
            }

            showResults() {
                const correctCount = this.sessionAnswers.filter(Boolean).length;
                const total = this.session.length;
                const pct = Math.round((correctCount / total) * 100);

                this.navigateTo('results');

                document.getElementById('resultTitle').textContent = pct >= 80 ? "Session Completed! Excellent Work!" : "Session Completed! Keep Training!";
                document.getElementById('resultScore').textContent = `${correctCount}/${total}`;
                document.getElementById('resultPct').textContent = `${pct}% Score`;

                document.getElementById('resultDetails').innerHTML = `
                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <b class="text-white text-base block">${pct}%</b>
                        <span class="text-slate-400">Accuracy</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <b class="text-rose-400 text-base block">${total - correctCount}</b>
                        <span class="text-slate-400">Missed</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <b class="text-amber-400 text-base block">${this.state.starred.length}</b>
                        <span class="text-slate-400">Starred Total</span>
                    </div>
                `;
            }

            /* Flashcards logic */
            populateFlashcardDropdown() {
                const select = document.getElementById('flashcards-module-select');
                select.innerHTML = '';
                DATA.modules.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = `Module ${m.id}: ${m.title}`;
                    select.appendChild(opt);
                });
            }

            startFlashcardsForModule(modId) {
                this.selectedModuleId = modId;
                document.getElementById('flashcards-module-select').value = modId;
                this.navigateTo('flashcards');
            }

            changeFlashcardModule(modId) {
                this.selectedModuleId = parseInt(modId);
                this.loadFlashcards(this.selectedModuleId);
            }

            loadFlashcards(modId) {
                const mod = DATA.modules.find(m => m.id === parseInt(modId));
                const cards = DATA.flashcards[modId] || [
                    { term: "Standard Concept", def: "Flashcards content available in primary guide." }
                ];

                this.currentCards = cards;
                this.cardIndex = 0;
                this.isCardFlipped = false;

                document.getElementById('flashcard-module-badge').textContent = `Module ${mod.id}`;
                document.getElementById('flashcard-title').textContent = mod.title;
                this.renderCard();
            }

            renderCard() {
                const inner = document.getElementById('flashcard-inner');
                if (this.isCardFlipped) {
                    inner.classList.remove('rotate-y-180');
                    this.isCardFlipped = false;
                }

                const card = this.currentCards[this.cardIndex];
                document.getElementById('card-front-text').textContent = card.term;
                document.getElementById('card-back-text').textContent = card.def;
                document.getElementById('card-progress-count').textContent = `${this.cardIndex + 1} / ${this.currentCards.length}`;
            }

            flipCard() {
                const inner = document.getElementById('flashcard-inner');
                this.isCardFlipped = !this.isCardFlipped;
                if (this.isCardFlipped) {
                    inner.classList.add('rotate-y-180');
                    this.state.cardsViewed = (this.state.cardsViewed || 0) + 1;
                    this.saveState();
                } else {
                    inner.classList.remove('rotate-y-180');
                }
            }

            nextCard() {
                this.cardIndex = (this.cardIndex + 1) % this.currentCards.length;
                this.renderCard();
            }

            prevCard() {
                this.cardIndex = (this.cardIndex - 1 + this.currentCards.length) % this.currentCards.length;
                this.renderCard();
            }

            shuffleCards() {
                this.currentCards.sort(() => Math.random() - 0.5);
                this.cardIndex = 0;
                this.renderCard();
            }

            /* Interactive PBQ logic */
            updatePBQProgress() {
                const completed=Object.keys(this.state.pbqCompleted||{}).length;
                const total=pbqScenarios.length;
                const el=document.getElementById('pbq-total-count'), ec=document.getElementById('pbq-completed-count'), ep=document.getElementById('pbq-progress-count');
                if(el)el.textContent=total; if(ec)ec.textContent=Math.min(completed,total); if(ep)ep.textContent=(total?Math.round(Math.min(completed,total)/total*100):0)+'%';
            }
            startRandomPBQ() { this.loadPBQScenario(Math.floor(Math.random()*pbqScenarios.length)); }

            loadPBQScenario(index) {
                this.currentPBQIndex = Math.max(0, Math.min(index, pbqScenarios.length - 1));
                this.updatePBQProgress();
                const sc = pbqScenarios[this.currentPBQIndex];
                const workspace = document.getElementById('pbq-workspace');
                if (!workspace) return;

                document.getElementById('pbq-scenario-title').textContent = sc.title;
                document.getElementById('pbq-scenario-desc').textContent = sc.desc;
                document.getElementById('pbq-scenario-objective').textContent = sc.objective;
                document.getElementById('pbq-hint-text').textContent = sc.hint;
                document.getElementById('pbq-hint-box').classList.add('hidden');

                workspace.innerHTML = this.renderPBQWorkspace(sc);
            }

            renderPBQWorkspace(sc) {
                if (sc.type === 'wiring') {
                    const colors = ['white/green','green','white/orange','orange','white/blue','blue','white/brown','brown'];
                    const labels = {'white/green':'White/Green','green':'Green','white/orange':'White/Orange','orange':'Orange','white/blue':'White/Blue','blue':'Blue','white/brown':'White/Brown','brown':'Brown'};
                    const swatch = {'white/green':'linear-gradient(135deg,#fff 0 50%,#22c55e 50%)','green':'#22c55e','white/orange':'linear-gradient(135deg,#fff 0 50%,#f97316 50%)','orange':'#f97316','white/blue':'linear-gradient(135deg,#fff 0 50%,#3b82f6 50%)','blue':'#3b82f6','white/brown':'linear-gradient(135deg,#fff 0 50%,#a16207 50%)','brown':'#a16207'};
                    return `
                        <div class="glass-card rounded-2xl p-5 space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div><h3 class="font-bold text-white">RJ45 pinout builder</h3><p class="text-xs text-slate-400">Drag a conductor to a pin, or tap a conductor and then a pin on mobile.</p></div>
                                <span class="px-2 py-1 rounded-lg bg-brand-500/10 text-brand-accent text-[10px] font-bold">T568${sc.id.endsWith('a')?'A':'B'}</span>
                            </div>
                            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">Build the cable <b class="text-slate-200">pin 1 → pin 8</b>. The same conductor cannot be used twice.</div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="wire-palette">
                                ${colors.map(c=>`<button type="button" draggable="true" data-wire="${c}" onclick="app.selectWire('${c}')" ondragstart="app.dragWire(event,'${c}')" class="wire-chip flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-brand-500 text-left text-[10px] text-slate-200 transition-all"><span class="w-5 h-5 rounded-full border border-slate-600 shrink-0" style="background:${swatch[c]}"></span><span>${labels[c]}</span></button>`).join('')}
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="wire-slots">
                                ${sc.target.map((_,i)=>`<button type="button" data-pin="${i}" ondragover="event.preventDefault();this.classList.add('border-brand-400')" ondragleave="this.classList.remove('border-brand-400')" ondrop="app.dropWire(event,${i})" onclick="app.placeSelectedWire(${i})" class="wire-slot flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-left min-h-[52px] transition-all"><span class="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">${i+1}</span><span class="wire-value text-xs text-slate-500">Drop or tap a wire</span></button>`).join('')}
                            </div>
                            <div id="pbq-inline-feedback" class="hidden"></div>
                            <div class="flex gap-2"><button onclick="app.checkWiringPBQ()" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Submit PBQ</button><button onclick="app.loadPBQScenario(app.currentPBQIndex)" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">Clear</button></div>
                        </div>`;
                }
                if (sc.type === 'cablecheck') {
                    return `<div class="glass-card rounded-2xl p-5 space-y-4"><div><h3 class="font-bold text-white">Cable installation check</h3><p class="text-xs text-slate-400">Choose the correct value for each installation requirement.</p></div><div class="space-y-3">${sc.fields.map((f,i)=>`<label class="block p-3 rounded-xl bg-slate-900 border border-slate-800"><span class="text-xs font-semibold text-slate-200">${f[0]}</span><select data-cable-field="${i}" class="mt-2 w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2"><option value="">Select...</option>${f[2].map(o=>`<option value="${o}">${o}</option>`).join('')}</select></label>`).join('')}</div><div id="pbq-inline-feedback" class="hidden"></div><button onclick="app.checkCablePBQ()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Submit PBQ</button></div>`;
                }
                return `<div class="glass-card rounded-2xl p-5 space-y-4"><div><h3 class="font-bold text-white">Complete the matching task</h3><p class="text-xs text-slate-400">Match every item, then submit the whole PBQ.</p></div><div class="space-y-2" id="pbq-match-rows">${sc.rows.map((r,i)=>`<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-2 items-center p-3 rounded-xl bg-slate-900 border border-slate-800"><div class="text-sm text-slate-200 font-medium">${r[0]}</div><select data-row="${i}" class="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2"><option value="">Select...</option>${sc.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`).join('')}</div><div id="pbq-inline-feedback" class="hidden"></div><button onclick="app.checkMatchingPBQ()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Submit PBQ</button></div>`;
            }

            selectWire(wire) {
                this.selectedWire = wire;
                document.querySelectorAll('.wire-chip').forEach(b=>b.classList.toggle('ring-2', b.dataset.wire===wire));
            }
            dragWire(event, wire) { this.selectedWire = wire; event.dataTransfer.setData('text/plain', wire); }
            dropWire(event, pin) { event.preventDefault(); event.currentTarget.classList.remove('border-brand-400'); this.selectedWire=event.dataTransfer.getData('text/plain')||this.selectedWire; this.placeSelectedWire(pin); }
            placeSelectedWire(pin) {
                if (!this.selectedWire) return;
                const slots=[...document.querySelectorAll('#wire-slots .wire-slot')];
                const existing=slots.findIndex(x=>x.dataset.wire===this.selectedWire);
                if(existing>=0) slots[existing].querySelector('.wire-value').textContent='Drop or tap a wire';
                const slot=slots[pin]; if(!slot)return;
                slot.dataset.wire=this.selectedWire;
                slot.querySelector('.wire-value').innerHTML=`<span class="font-semibold text-white">${this.selectedWire.replace('/', ' / ')}</span>`;
                this.selectedWire=null; document.querySelectorAll('.wire-chip').forEach(b=>b.classList.remove('ring-2'));
            }

            showPBQFeedback(ok, message) {
                const el = document.getElementById('pbq-inline-feedback');
                if (!el) return;
                el.className = `p-3 rounded-xl text-xs border ${ok
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'}`;
                el.innerHTML = message;
            }

            markPBQComplete() {
                const key = `pbq-${this.currentPBQIndex}`;
                this.state.pbqCompleted = this.state.pbqCompleted || {};
                if (!this.state.pbqCompleted[key]) {
                    this.state.pbqCompleted[key] = true;
                    this.state.pbqSolved = (this.state.pbqSolved || 0) + 1;
                    this.saveState();
                    this.updatePBQProgress();
                }
            }

            checkWiringPBQ() {
                const sc = pbqScenarios[this.currentPBQIndex];
                const values = [...document.querySelectorAll('#wire-slots .wire-slot')].map(x => x.dataset.wire || '');
                const complete = values.every(Boolean);
                if (!complete) {
                    this.showPBQFeedback(false, 'Fill all eight pins before submitting.');
                    return;
                }
                const correct = values.every((v,i) => v === sc.target[i]);
                if (correct) {
                    this.markPBQComplete();
                    this.showPBQFeedback(true, '<b>✓ Correct.</b><div class="mt-1">The eight conductors are in the correct T568 termination order.</div>');
                } else {
                    const firstWrong = values.findIndex((v,i) => v !== sc.target[i]);
                    this.showPBQFeedback(false, `<b>Not quite.</b><div class="mt-1">Check pin ${firstWrong + 1} and compare the green/orange pair positions with the selected standard.</div>`);
                }
            }

            checkMatchingPBQ() {
                const sc = pbqScenarios[this.currentPBQIndex];
                const values = [...document.querySelectorAll('#pbq-match-rows select')].map(x => x.value);
                if (values.some(v => !v)) {
                    this.showPBQFeedback(false, 'Complete every row before submitting.');
                    return;
                }
                const correct = values.every((v,i) => v === sc.rows[i][1]);
                if (correct) {
                    this.markPBQComplete();
                    this.showPBQFeedback(true, '<b>✓ Correct.</b><div class="mt-1">Every item is matched correctly.</div>');
                } else {
                    const firstWrong = values.findIndex((v,i) => v !== sc.rows[i][1]);
                    this.showPBQFeedback(false, `<b>Not quite.</b><div class="mt-1">At least one row is incorrect. Re-check row ${firstWrong + 1} and submit again.</div>`);
                }
            }

            checkCablePBQ() {
                const sc=pbqScenarios[this.currentPBQIndex];
                const values=[...document.querySelectorAll('[data-cable-field]')].map(x=>x.value);
                if(values.some(v=>!v)){this.showPBQFeedback(false,'Complete every field before submitting.');return;}
                const correct=values.every((v,i)=>v===sc.fields[i][1]);
                if(correct){this.markPBQComplete();this.showPBQFeedback(true,'<b>✓ Correct.</b><div class="mt-1">The cable installation choices match the task.</div>');}
                else {const i=values.findIndex((v,j)=>v!==sc.fields[j][1]);this.showPBQFeedback(false,`<b>Not quite.</b><div class="mt-1">Review <b>${sc.fields[i][0]}</b> and try again.</div>`);}
            }

            selectPBQScenario(idx) {
                this.loadPBQScenario(idx);
            }

            togglePBQHint() {
                document.getElementById('pbq-hint-box').classList.toggle('hidden');
            }

            /* Render Stats Page */
            renderStatsView() {
                const list = document.getElementById('module-stats-list');
                list.innerHTML = '';
                
                DATA.modules.forEach(m => {
                    const lessons = m.lessons;
                    let modCorrect = 0;
                    let modTotal = 0;

                    lessons.forEach(l => {
                        const s = this.state.stats[l];
                        if (s) {
                            modCorrect += s.c || 0;
                            modTotal += (s.c || 0) + (s.w || 0);
                        }
                    });

                    const pct = modTotal > 0 ? Math.round((modCorrect / modTotal) * 100) : 0;

                    const row = document.createElement('div');
                    row.className = "p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs";
                    row.innerHTML = `
                        <div>
                            <span class="font-bold text-white">Module ${m.id}: ${m.title}</span>
                            <span class="text-slate-400 block text-[10px]">${m.lessons.join(' · ')}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-emerald-400 font-bold font-mono">${pct}% Accuracy</span>
                            <span class="text-slate-400 font-mono">(${modTotal} attempted)</span>
                        </div>
                    `;
                    list.appendChild(row);
                });
            }

            resetProgress() {
                if (confirm("Are you sure you want to reset all quiz progress and stats?")) {
                    this.state = { answered: {}, wrong: [], starred: [], stats: {}, cardsViewed: 0, pbqSolved: 0, pbqCompleted: {} };
                    this.saveState();
                    this.renderStatsView();
                }
            }
        }

        // Feature overrides for the original Gemini design.
        MainApp.prototype.populateFlashcardDropdown = function(){const s=document.getElementById('flashcards-module-select');s.innerHTML='<option value="all">All Modules</option>';DATA.modules.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`Module ${m.id}: ${m.title}`;s.appendChild(o);});s.value='all';this.selectedModuleId='all';this.flashcardCount=20;};
        MainApp.prototype.changeFlashcardModule=function(v){this.selectedModuleId=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);};
        MainApp.prototype.changeFlashcardCount=function(v){this.flashcardCount=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);};
        MainApp.prototype.startFlashcardsForModule=function(v){this.selectedModuleId=v;document.getElementById('flashcards-module-select').value=v;this.navigateTo('flashcards');};
        MainApp.prototype.loadFlashcards=function(v){const all=v==='all'?Object.values(DATA.flashcards).flat():[...(DATA.flashcards[String(v)]||[])];const n=this.flashcardCount||20;this.currentCards=[...all].sort(()=>Math.random()-.5).slice(0,n==='all'?all.length:Math.min(n,all.length));this.cardIndex=0;this.isCardFlipped=false;const m=DATA.modules.find(x=>x.id===Number(v));document.getElementById('flashcard-module-badge').textContent=v==='all'?'All Modules':`Module ${m.id}`;document.getElementById('flashcard-title').textContent=v==='all'?'Core 1 — Modules 1–10':m.title;const av=document.getElementById('flashcards-available');if(av)av.textContent=`${all.length} available`;this.renderCard();};
        MainApp.prototype.updateReadiness=function(){let c=0,a=0;Object.values(this.state.stats).forEach(s=>{c+=s.c||0;a+=(s.c||0)+(s.w||0);});const coverage=DATA.questions.length?Math.min(Object.keys(this.state.answered).length,DATA.questions.length)/DATA.questions.length:0;const accuracy=a?c/a:0;let sum=0,n=0;DATA.modules.forEach(m=>{let mc=0,mt=0;m.lessons.forEach(l=>{const s=this.state.stats[l];if(s){mc+=s.c||0;mt+=(s.c||0)+(s.w||0);}});if(mt){sum+=mc/mt;n++;}});const consistency=n?sum/n:0;const r=Math.round((coverage*.30+accuracy*.50+consistency*.20)*100);const v=document.getElementById('readiness-value'),b=document.getElementById('readiness-bar');if(v)v.textContent=r+'%';if(b)b.style.width=r+'%';};
        MainApp.prototype.startAllModules=function(){const val=document.getElementById('all-module-count')?.value||'20';const pool=[...DATA.questions].sort(()=>Math.random()-.5);const n=val==='all'?pool.length:Math.min(Number(val),pool.length);this.startSession(pool.slice(0,n),`All Modules — ${n} Questions`);};
        MainApp.prototype.navigateTo=function(viewId){this.currentView=viewId;['home','flashcards','quiz','pbq','results','stats','reference'].forEach(v=>{const e=document.getElementById(`view-${v}`);if(e)e.classList.add('hidden');const n=document.getElementById(`nav-${v}`);if(n){n.classList.remove('bg-brand-600','text-white');n.classList.add('text-slate-400');}});const e=document.getElementById(`view-${viewId}`);if(e)e.classList.remove('hidden');const n=document.getElementById(`nav-${viewId}`);if(n){n.classList.add('bg-brand-600','text-white');n.classList.remove('text-slate-400');}if(viewId==='flashcards')this.loadFlashcards(this.selectedModuleId);if(viewId==='pbq')this.loadPBQScenario(this.currentPBQIndex);if(viewId==='stats')this.renderStatsView();if(viewId==='reference')this.renderReference();window.scrollTo({top:0,behavior:'smooth'});};
        MainApp.prototype.populatePBQDropdown=function(){const s=document.getElementById('pbq-scenario-select');if(!s)return;s.innerHTML=pbqScenarios.map((x,i)=>`<option value="${i}">Scenario ${i+1}: ${x.title}</option>`).join('');};
        MainApp.prototype.submitPBQ=function(){const input=document.getElementById('terminal-input'),cmd=(input?.value||'').trim().toLowerCase(),sc=pbqScenarios[this.currentPBQIndex];if(!cmd)return;const ok=sc.expected.some(x=>cmd===x.toLowerCase()||cmd.includes(x.toLowerCase()));const fb=document.getElementById('pbq-feedback');if(fb){fb.className=`mb-3 p-3 rounded-xl text-xs border ${ok?'bg-emerald-950/40 border-emerald-800 text-emerald-300':'bg-rose-950/40 border-rose-800 text-rose-300'}`;fb.innerHTML=ok?`<b>✓ Correct</b><div class="mt-1">${sc.success}</div>`:`<b>✗ Not correct</b><div class="mt-1">${sc.failure}</div><div class="mt-1 text-slate-500">Use the hint if needed and submit again.</div>`;}if(ok){const key=`pbq-${this.currentPBQIndex}`;this.state.pbqCompleted=this.state.pbqCompleted||{};if(!this.state.pbqCompleted[key]){this.state.pbqCompleted[key]=true;this.state.pbqSolved=(this.state.pbqSolved||0)+1;this.saveState();}}input.value='';};
        let app;
        window.onload = function() {
            app = new MainApp();
        };
