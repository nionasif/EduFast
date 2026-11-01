import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{n as t}from"./react-core-D6R8b1rC.js";import{ft as n}from"./lucide-icons-D_XELnsl.js";import{D as r,L as i,R as a,b as o,c as s,h as c}from"./mockData-BOghMRvR.js";var l=e(n(),1),u=t(),d=e=>{if(!e)return`Science`;let t=String(e).trim().toLowerCase();return t.includes(`sci`)||t.includes(`বিজ্ঞান`)?`Science`:t.includes(`comm`)||t.includes(`ব্যবসায়`)||t.includes(`ব্যবসায়`)||t.includes(`business`)?`Commerce`:t.includes(`art`)||t.includes(`hum`)||t.includes(`মানবিক`)?`Arts`:`Science`},f=e=>{let t=d(e);return t===`Science`?`বিজ্ঞান`:t===`Commerce`?`ব্যবসায় শিক্ষা`:t===`Arts`?`মানবিক`:e||`বিজ্ঞান`};function p({user:e,onStartTest:t,submissions:n={}}){let[r,o]=(0,l.useState)(()=>a()),s=d(e?.group||e?.academicGroup),[c,p]=(0,l.useState)(`All`);(0,l.useEffect)(()=>{i().then(e=>{e&&e.length>0&&o(a())});let e=()=>{o(a())};return window.addEventListener(`edufast-mock-tests-update`,e),window.addEventListener(`edufast-data-update`,e),()=>{window.removeEventListener(`edufast-mock-tests-update`,e),window.removeEventListener(`edufast-data-update`,e)}},[]);let m=(0,l.useMemo)(()=>r.filter(e=>d(e.group)===s),[r,s]),h=(0,l.useMemo)(()=>m.filter(e=>!!(e.mentorName||e.mentorId||e.id&&String(e.id).startsWith(`test-mentor-`))),[m]),g=(0,l.useMemo)(()=>m.filter(e=>!e.mentorName&&!e.mentorId&&(!e.id||!String(e.id).startsWith(`test-mentor-`))),[m]),_=(0,l.useMemo)(()=>c===`Mentor`?h:c===`Standard`?g:m,[c,m,h,g]),v={Science:{bg:`#ebf8ff`,color:`#2b6cb0`,border:`#bee3f8`},Commerce:{bg:`#fefcbf`,color:`#744210`,border:`#faf089`},Arts:{bg:`#fff5f5`,color:`#742a2a`,border:`#fed7d7`}};function y({test:e,isRecommended:r}){let i=v[e.group]||v.Arts,a=!!(n&&n[e.id]),o=Array.isArray(e.questions)?e.questions.length:0;return(0,u.jsxs)(`div`,{className:`mock-test-card`,style:{background:`var(--white)`,border:`1px solid var(--gray-200)`,borderRadius:`var(--border-radius-md)`,padding:`1.5rem`,boxShadow:`var(--shadow-sm)`,display:`flex`,flexDirection:`column`,gap:`0.75rem`,transition:`all 0.25s ease`,position:`relative`,overflow:`hidden`},onMouseEnter:e=>{e.currentTarget.style.boxShadow=`var(--shadow-md)`,e.currentTarget.style.transform=`translateY(-3px)`},onMouseLeave:e=>{e.currentTarget.style.boxShadow=`var(--shadow-sm)`,e.currentTarget.style.transform=`translateY(0)`},children:[(0,u.jsx)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:`4px`,background:`linear-gradient(90deg, var(--primary-teal), var(--cta-orange))`}}),(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,marginTop:`0.25rem`},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h4`,{style:{fontSize:`1.05rem`,marginBottom:`0.2rem`,color:`var(--text-charcoal)`},children:e.title}),(0,u.jsx)(`p`,{style:{fontSize:`0.78rem`,color:`var(--gray-500)`,margin:0},children:e.subject})]}),(0,u.jsxs)(`span`,{style:{fontSize:`0.72rem`,fontWeight:600,background:i.bg,color:i.color,border:`1px solid ${i.border}`,borderRadius:`20px`,padding:`0.2rem 0.65rem`,whiteSpace:`nowrap`,marginLeft:`0.5rem`},children:[f(e.group),` বিভাগ`]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`,flexWrap:`wrap`},children:[(0,u.jsx)(`div`,{style:{fontSize:`0.75rem`,color:`var(--gray-500)`},children:e.badge}),e.mentorName&&(0,u.jsxs)(`span`,{style:{fontSize:`0.7rem`,fontWeight:700,background:`#f0fdf4`,color:`#16a34a`,border:`1px solid #bbf7d0`,borderRadius:`12px`,padding:`0.15rem 0.55rem`},children:[`👨‍🏫 `,e.mentorName,` (মেন্টর স্পেশাল)`]}),a&&(0,u.jsx)(`span`,{style:{fontSize:`0.7rem`,fontWeight:700,background:`#ecfdf5`,color:`#047857`,border:`1px solid #a7f3d0`,borderRadius:`12px`,padding:`0.15rem 0.55rem`},children:`✓ পরীক্ষা সম্পন্ন হয়েছে`})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`0.75rem`,flexWrap:`wrap`},children:[(0,u.jsxs)(`div`,{style:{textAlign:`center`,background:`var(--bg-light)`,borderRadius:`var(--border-radius-sm)`,padding:`0.4rem 0.75rem`,flex:1,minWidth:`60px`},children:[(0,u.jsxs)(`div`,{style:{fontSize:`0.95rem`,fontWeight:700,color:`var(--primary-teal)`},children:[`⏱ `,e.duration]}),(0,u.jsx)(`div`,{style:{fontSize:`0.68rem`,color:`var(--gray-500)`},children:`মিনিট`})]}),(0,u.jsxs)(`div`,{style:{textAlign:`center`,background:`var(--bg-light)`,borderRadius:`var(--border-radius-sm)`,padding:`0.4rem 0.75rem`,flex:1,minWidth:`60px`},children:[(0,u.jsxs)(`div`,{style:{fontSize:`0.95rem`,fontWeight:700,color:`var(--text-charcoal)`},children:[`📝 `,o]}),(0,u.jsx)(`div`,{style:{fontSize:`0.68rem`,color:`var(--gray-500)`},children:`প্রশ্ন সংখ্যা`})]}),(0,u.jsxs)(`div`,{style:{textAlign:`center`,background:`var(--bg-light)`,borderRadius:`var(--border-radius-sm)`,padding:`0.4rem 0.75rem`,flex:1,minWidth:`60px`},children:[(0,u.jsxs)(`div`,{style:{fontSize:`0.95rem`,fontWeight:700,color:`var(--cta-orange)`},children:[`🏆 `,e.totalMarks]}),(0,u.jsx)(`div`,{style:{fontSize:`0.68rem`,color:`var(--gray-500)`},children:`মোট নম্বর`})]}),(0,u.jsxs)(`div`,{style:{textAlign:`center`,background:`var(--bg-light)`,borderRadius:`var(--border-radius-sm)`,padding:`0.4rem 0.75rem`,flex:1,minWidth:`60px`},children:[(0,u.jsx)(`div`,{style:{fontSize:`0.95rem`,fontWeight:700,color:`#e53e3e`},children:e.negativeMarking}),(0,u.jsx)(`div`,{style:{fontSize:`0.68rem`,color:`var(--gray-500)`},children:`নেগেটিভ মার্ক`})]})]}),(0,u.jsxs)(`p`,{style:{fontSize:`0.8rem`,color:`var(--gray-600)`,margin:0},children:[`🎯 লক্ষ্য/প্রস্তুতি: `,(0,u.jsx)(`strong`,{children:e.examTarget})]}),(0,u.jsx)(`button`,{className:`btn ${a?`btn-secondary`:`btn-teal`}`,style:{padding:`0.65rem 1.2rem`,fontSize:`0.88rem`,marginTop:`0.25rem`,cursor:`pointer`,fontWeight:600},onClick:()=>t(e),children:a?`📋 ফলাফল ও সমাধান দেখুন`:r?`⚡ টেস্ট শুরু করুন`:`▶ টেস্ট শুরু করুন`})]})}return(0,u.jsxs)(`div`,{className:`container`,style:{padding:`2rem 0`},children:[(0,u.jsxs)(`div`,{style:{marginBottom:`1.75rem`},children:[(0,u.jsxs)(`h1`,{style:{fontSize:`2.2rem`,marginBottom:`0.4rem`},children:[`📝 মক টেস্ট `,(0,u.jsx)(`span`,{style:{color:`var(--primary-teal)`},children:`সেন্টার`})]}),(0,u.jsx)(`p`,{style:{color:`var(--gray-600)`,margin:0},children:`বিশ্ববিদ্যালয় ভর্তি পরীক্ষার আদলে তৈরি লাইভ মক টেস্ট ও আপনার বিভাগের মেন্টরদের বিশেষ প্রশ্নপত্রে অংশ নিন।`})]}),(0,u.jsx)(`div`,{style:{display:`flex`,gap:`0.5rem`,marginBottom:`1.75rem`,flexWrap:`wrap`},children:[{id:`All`,label:`সকল টেস্ট`,count:m.length},{id:`Mentor`,label:`🔥 মেন্টর স্পেশাল প্রশ্নপত্র`,count:h.length},{id:`Standard`,label:`📋 মডেল টেস্ট`,count:g.length}].map(e=>(0,u.jsxs)(`button`,{type:`button`,onClick:()=>p(e.id),style:{padding:`0.55rem 1.15rem`,borderRadius:`20px`,fontSize:`0.88rem`,fontWeight:c===e.id?700:500,background:c===e.id?`var(--primary-teal)`:`var(--white)`,color:c===e.id?`#ffffff`:`var(--text-charcoal)`,border:`1.5px solid ${c===e.id?`var(--primary-teal)`:`var(--gray-300)`}`,cursor:`pointer`,display:`flex`,alignItems:`center`,gap:`0.45rem`,transition:`all 0.2s ease`,boxShadow:c===e.id?`0 2px 6px rgba(13,148,136,0.25)`:`none`},children:[(0,u.jsx)(`span`,{children:e.label}),(0,u.jsx)(`span`,{style:{fontSize:`0.72rem`,padding:`0.1rem 0.45rem`,borderRadius:`10px`,background:c===e.id?`rgba(255,255,255,0.25)`:`var(--gray-200)`,color:c===e.id?`#ffffff`:`var(--gray-600)`},children:e.count})]},e.id))}),(0,u.jsxs)(`div`,{style:{marginBottom:`2.5rem`},children:[(0,u.jsx)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`1.25rem`,flexWrap:`wrap`,gap:`0.5rem`},children:(0,u.jsxs)(`h3`,{style:{color:`var(--primary-teal)`,margin:0,display:`flex`,alignItems:`center`,gap:`0.6rem`},children:[(0,u.jsxs)(`span`,{children:[`⭐ `,c===`Mentor`?`মেন্টর স্পেশাল প্রশ্নপত্র`:c===`Standard`?`সাধারণ মডেল টেস্ট`:`মক টেস্ট প্রশ্নপত্র`]}),(0,u.jsxs)(`span`,{style:{fontSize:`0.72rem`,background:`#e6fffa`,color:`#276749`,border:`1px solid #b2f5ea`,borderRadius:`20px`,padding:`0.2rem 0.65rem`,fontWeight:700},children:[_.length,` টি টেস্ট উপলব্ধ`]})]})}),_.length>0?(0,u.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(320px, 1fr))`,gap:`1.25rem`},children:_.map(e=>(0,u.jsx)(y,{test:e,isRecommended:!0},e.id))}):(0,u.jsxs)(`div`,{style:{padding:`3rem 1.5rem`,textAlign:`center`,background:`var(--white)`,borderRadius:`var(--border-radius-md)`,border:`1px solid var(--gray-200)`},children:[(0,u.jsx)(`div`,{style:{fontSize:`2.5rem`,marginBottom:`0.5rem`},children:`📝`}),(0,u.jsx)(`h4`,{style:{color:`var(--text-charcoal)`,marginBottom:`0.25rem`},children:`কোনো মক টেস্ট পাওয়া যায়নি`}),(0,u.jsx)(`p`,{style:{color:`var(--gray-500)`,fontSize:`0.88rem`,margin:0},children:`আপনার বিভাগের জন্য মেন্টররা নতুন টেস্ট যুক্ত করার সাথে সাথে এখানে প্রদর্শিত হবে।`})]})]})]})}function m({test:e,user:t,onFinish:n}){if(!e||!Array.isArray(e.questions)||e.questions.length===0)return(0,u.jsx)(`div`,{className:`container`,style:{padding:`4rem 1rem`,textAlign:`center`},children:(0,u.jsxs)(`div`,{style:{maxWidth:`480px`,margin:`0 auto`,background:`var(--white)`,padding:`2rem`,borderRadius:`12px`,boxShadow:`var(--shadow-sm)`},children:[(0,u.jsx)(`div`,{style:{fontSize:`3rem`,marginBottom:`1rem`},children:`📝`}),(0,u.jsx)(`h3`,{style:{color:`var(--text-charcoal)`,marginBottom:`0.5rem`},children:`এই মক টেস্টে কোনো প্রশ্ন পাওয়া যায়নি`}),(0,u.jsx)(`p`,{style:{color:`var(--gray-500)`,fontSize:`0.9rem`,marginBottom:`1.5rem`},children:`মেন্টর এখনো এই টেস্টটিতে কোনো প্রশ্ন যুক্ত করেননি অথবা প্রশ্ন লোড হতে সমস্যা হয়েছে।`}),(0,u.jsx)(`button`,{className:`btn btn-teal`,onClick:()=>n(`list`),children:`← টেস্ট তালিকায় ফিরে যান`})]})});let r=e.duration*60,[i,a]=(0,l.useState)(r),[o,s]=(0,l.useState)(0),[c,d]=(0,l.useState)({}),[f,p]=(0,l.useState)({}),[m,h]=(0,l.useState)(!1),[_,v]=(0,l.useState)(`all`),[y,b]=(0,l.useState)(!1),x=(0,l.useRef)(null),S=(0,l.useCallback)(()=>{clearInterval(x.current),typeof window<`u`&&(window.__EDUFAST_ACTIVE_EXAM__=!1),h(!0)},[]);(0,l.useEffect)(()=>{if(typeof window>`u`)return;window.__EDUFAST_ACTIVE_EXAM__=!0,window.history.pushState({inMockTest:!0},``,window.location.href);let e=()=>{window.history.pushState({inMockTest:!0},``,window.location.href),b(!0)},t=e=>(e.preventDefault(),e.returnValue=`⚠️ পরীক্ষা চলমান অবস্থায় পেজ বন্ধ বা রিলোড করা যাবে না!`,e.returnValue);return window.addEventListener(`popstate`,e),window.addEventListener(`beforeunload`,t),()=>{window.__EDUFAST_ACTIVE_EXAM__=!1,window.removeEventListener(`popstate`,e),window.removeEventListener(`beforeunload`,t)}},[]),(0,l.useEffect)(()=>(x.current=setInterval(()=>{a(e=>e<=1?(clearInterval(x.current),h(!0),0):e-1)},1e3),()=>clearInterval(x.current)),[]);let C=e=>`${Math.floor(e/60).toString().padStart(2,`0`)}:${(e%60).toString().padStart(2,`0`)}`,w=i<=120,T=i<=30,E=e.questions[o]||{},D=E.options||[E.optionA,E.optionB,E.optionC,E.optionD],O=Array.isArray(D)&&D.length>0?D:[`অপশন ১`,`অপশন ২`,`অপশন ৩`,`অপশন ৪`],k={id:E.id||`q-${o}`,question:E.question||E.title||`প্রশ্ন বিবরণ পাওয়া যায়নি`,options:O,correct:typeof E.correct==`number`?E.correct:0,explanation:E.explanation||`কোনো ব্যাখ্যা দেওয়া হয়নি।`},A=Object.keys(c).length,j=e.questions.length,M=Object.values(f).filter(Boolean).length,N=j-A,P=Math.round(A/j*100),F=()=>{for(let t=o+1;t<j;t++)if(c[e.questions[t].id]===void 0){s(t);return}},I=e=>{m||c[k.id]===void 0&&(d(t=>({...t,[k.id]:e})),setTimeout(()=>{s(e=>e<j-1?e+1:e)},400))},L=e=>{p(t=>({...t,[e]:!t[e]}))};return m?(0,u.jsx)(g,{test:e,user:t,answers:c,totalSeconds:r,timeUsed:r-i,onFinish:n}):(0,u.jsxs)(`div`,{style:{minHeight:`100vh`,background:`var(--bg-light)`,padding:`0`},children:[(0,u.jsxs)(`div`,{style:{background:`var(--white)`,borderBottom:`3px solid ${T?`#e53e3e`:w?`var(--cta-orange)`:`var(--primary-teal)`}`,padding:`0.85rem 2rem`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,boxShadow:`var(--shadow-sm)`,position:`sticky`,top:0,zIndex:100},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.5rem`},children:[(0,u.jsx)(`span`,{style:{fontWeight:700,fontSize:`1rem`,color:`var(--text-charcoal)`},children:e.title}),(0,u.jsx)(`span`,{style:{fontSize:`0.68rem`,fontWeight:700,backgroundColor:`#fef2f2`,color:`#dc2626`,border:`1px solid #fecaca`,borderRadius:`999px`,padding:`2px 8px`,display:`inline-flex`,alignItems:`center`,gap:`3px`},children:`🔒 পরীক্ষা লক সক্রিয়`})]}),(0,u.jsxs)(`div`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`,marginTop:`2px`},children:[A,`/`,j,` answered`]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`,background:T?`#fff5f5`:w?`#fffaf0`:`#e6fffa`,border:`2px solid ${T?`#fc8181`:w?`var(--cta-orange)`:`var(--primary-teal)`}`,borderRadius:`var(--border-radius-sm)`,padding:`0.4rem 1rem`,animation:T?`pulse 1s infinite`:`none`},children:[(0,u.jsx)(`span`,{style:{fontSize:`1.1rem`},children:T?`🚨`:w?`⚠️`:`⏱`}),(0,u.jsx)(`span`,{style:{fontSize:`1.3rem`,fontWeight:800,fontFamily:`monospace`,color:T?`#e53e3e`:w?`#c05621`:`var(--primary-teal)`},children:C(i)})]}),(0,u.jsx)(`button`,{className:`btn btn-secondary`,style:{padding:`0.45rem 1rem`,fontSize:`0.82rem`,color:`#e53e3e`,borderColor:`#e53e3e`},onClick:()=>{window.confirm(`Are you sure you want to submit the test now?`)&&S()},children:`Submit Test`})]}),(0,u.jsxs)(`div`,{className:`active-test-layout`,style:{display:`flex`,maxWidth:`1100px`,margin:`0 auto`,padding:`1.5rem`,gap:`1.5rem`},children:[(0,u.jsxs)(`div`,{style:{flex:1,minWidth:0},children:[(0,u.jsxs)(`div`,{style:{background:`var(--white)`,borderRadius:`var(--border-radius-md)`,padding:`2rem`,boxShadow:`var(--shadow-sm)`,marginBottom:`1rem`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`1.25rem`},children:[(0,u.jsxs)(`span`,{style:{fontSize:`0.75rem`,fontWeight:600,color:`var(--primary-teal)`,background:`#e6fffa`,borderRadius:`20px`,padding:`0.25rem 0.75rem`},children:[`Question `,o+1,` of `,j]}),(0,u.jsxs)(`span`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`},children:[`+`,(e.totalMarks/j).toFixed(1),` correct | `,e.negativeMarking,` wrong`]})]}),(0,u.jsx)(`p`,{style:{fontSize:`1.1rem`,fontWeight:600,lineHeight:1.6,color:`var(--text-charcoal)`,marginBottom:`1.5rem`},children:k.question}),(0,u.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.75rem`},children:k.options.map((e,t)=>{let n=c[k.id]===t,r=c[k.id]!==void 0;return(0,u.jsxs)(`button`,{onClick:()=>I(t),disabled:r,style:{display:`flex`,alignItems:`center`,gap:`0.85rem`,padding:`0.85rem 1.1rem`,borderRadius:`var(--border-radius-sm)`,border:`2px solid ${n?`var(--primary-teal)`:`var(--gray-200)`}`,background:n?`#e6fffa`:`var(--bg-light)`,cursor:r?`default`:`pointer`,textAlign:`left`,fontSize:`0.95rem`,color:`var(--text-charcoal)`,fontWeight:n?600:400,transition:`all 0.2s ease`,opacity:r&&!n?.6:1},onMouseEnter:e=>{!n&&!r&&(e.currentTarget.style.borderColor=`var(--gray-400)`,e.currentTarget.style.background=`var(--white)`)},onMouseLeave:e=>{!n&&!r&&(e.currentTarget.style.borderColor=`var(--gray-200)`,e.currentTarget.style.background=`var(--bg-light)`)},children:[(0,u.jsx)(`span`,{style:{width:`28px`,height:`28px`,borderRadius:`50%`,flexShrink:0,display:`flex`,alignItems:`center`,justifyContent:`center`,background:n?`var(--primary-teal)`:`var(--white)`,border:`2px solid ${n?`var(--primary-teal)`:`var(--gray-300)`}`,color:n?`white`:`var(--gray-500)`,fontSize:`0.75rem`,fontWeight:700},children:[`A`,`B`,`C`,`D`][t]}),e]},t)})})]}),(0,u.jsxs)(`div`,{className:`test-nav-actions`,style:{display:`flex`,justifyContent:`space-between`,gap:`0.75rem`,flexWrap:`wrap`},children:[(0,u.jsx)(`button`,{className:`btn btn-secondary`,style:{padding:`0.6rem 1.25rem`,opacity:o===0?.5:1,cursor:o===0?`not-allowed`:`pointer`},disabled:o===0,onClick:()=>s(e=>Math.max(0,e-1)),title:o===0?`এটি প্রথম প্রশ্ন`:`পূর্ববর্তী প্রশ্নে ফিরে যান`,children:`← Previous`}),(0,u.jsxs)(`button`,{className:`btn btn-secondary`,style:{padding:`0.6rem 1.25rem`,borderColor:f[k.id]?`#f6ad55`:`var(--gray-300)`,color:f[k.id]?`#7b341e`:`var(--gray-600)`,backgroundColor:f[k.id]?`#feebc8`:`transparent`},onClick:()=>L(k.id),children:[`🚩 `,f[k.id]?`Flagged`:`Flag for Review`]}),o<j-1?(0,u.jsx)(`button`,{className:`btn btn-teal`,style:{padding:`0.6rem 1.25rem`},onClick:()=>s(e=>e+1),title:c[k.id]===void 0?`এই প্রশ্নটি স্কিপ করে পরের প্রশ্নে যান (পরে ফিরে এসে উত্তর দেওয়া যাবে)`:`পরের প্রশ্নে যান`,children:c[k.id]===void 0?`Skip / Next →`:`Next →`}):(0,u.jsx)(`button`,{className:`btn btn-teal`,style:{padding:`0.6rem 1.25rem`,background:`var(--cta-orange)`,border:`none`},onClick:()=>{window.confirm(`Submit the test now?`)&&S()},children:`🏁 Submit Test`})]})]}),(0,u.jsx)(`div`,{className:`test-navigator-sidebar`,children:(0,u.jsxs)(`div`,{className:`q-nav-card`,children:[(0,u.jsxs)(`div`,{className:`q-nav-header`,children:[(0,u.jsxs)(`div`,{className:`q-nav-title-box`,children:[(0,u.jsxs)(`div`,{className:`q-nav-title-row`,children:[(0,u.jsx)(`span`,{className:`q-nav-icon`,children:`🧭`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h4`,{className:`q-nav-title`,children:`Question Navigator`}),(0,u.jsx)(`span`,{className:`q-nav-subtitle`,children:`প্রশ্ন নির্দেশক ও স্ট্যাটাস`})]})]}),(0,u.jsxs)(`span`,{className:`q-nav-progress-badge`,children:[P,`% সম্পন্ন`]})]}),(0,u.jsx)(`div`,{className:`q-nav-progress-track`,children:(0,u.jsx)(`div`,{className:`q-nav-progress-fill`,style:{width:`${P}%`}})})]}),(0,u.jsxs)(`div`,{className:`q-nav-tabs`,children:[(0,u.jsxs)(`button`,{type:`button`,className:`q-nav-tab ${_===`all`?`active`:``}`,onClick:()=>v(`all`),title:`সব প্রশ্ন দেখুন`,children:[(0,u.jsx)(`span`,{children:`সব`}),(0,u.jsx)(`span`,{className:`tab-counter`,children:j})]}),(0,u.jsxs)(`button`,{type:`button`,className:`q-nav-tab answered-tab ${_===`answered`?`active`:``}`,onClick:()=>v(`answered`),title:`শুধু উত্তর দেওয়া প্রশ্ন দেখুন`,children:[(0,u.jsx)(`span`,{children:`উত্তর`}),(0,u.jsx)(`span`,{className:`tab-counter`,children:A})]}),(0,u.jsxs)(`button`,{type:`button`,className:`q-nav-tab flagged-tab ${_===`flagged`?`active`:``}`,onClick:()=>v(`flagged`),title:`রিভিউ ফ্ল্যাগ করা প্রশ্ন দেখুন`,children:[(0,u.jsx)(`span`,{children:`ফ্ল্যাগ`}),(0,u.jsx)(`span`,{className:`tab-counter`,children:M})]}),(0,u.jsxs)(`button`,{type:`button`,className:`q-nav-tab unanswered-tab ${_===`unanswered`?`active`:``}`,onClick:()=>v(`unanswered`),title:`শুধু বাকি প্রশ্নগুলো দেখুন`,children:[(0,u.jsx)(`span`,{children:`বাকি`}),(0,u.jsx)(`span`,{className:`tab-counter`,children:N})]})]}),N>0&&(0,u.jsxs)(`button`,{type:`button`,className:`q-nav-jump-btn`,onClick:F,title:`পরবর্তী বাকি প্রশ্নে সরাসরি যান`,children:[(0,u.jsx)(`span`,{children:`পরবর্তী বাকি প্রশ্ন`}),(0,u.jsx)(`span`,{className:`jump-arrow`,children:`⏩`})]}),(0,u.jsx)(`div`,{className:`q-nav-grid-container`,children:e.questions.map((e,t)=>{let n=c[e.id]!==void 0,r=t===o,i=f[e.id];if(_===`answered`&&!n||_===`unanswered`&&n||_===`flagged`&&!i)return null;let a=`is-unattempted`;return r?a=`is-current`:i&&n?a=`is-flagged is-answered`:i?a=`is-flagged`:n&&(a=`is-answered`),(0,u.jsxs)(`button`,{type:`button`,onClick:()=>s(t),className:`q-nav-btn ${a}`,title:`প্রশ্ন ${t+1}: ${n?`উত্তর দেওয়া হয়েছে`:`উত্তর বাকি (ক্লিক করে উত্তর দিন)`} ${i?`(ফ্ল্যাগ করা)`:``}`,children:[(0,u.jsx)(`span`,{className:`q-num`,children:t+1}),i&&(0,u.jsx)(`span`,{className:`flag-dot`,title:`ফ্ল্যাগড`,children:`🚩`})]},e.id||t)})}),_===`flagged`&&M===0&&(0,u.jsxs)(`div`,{className:`q-nav-empty-state`,children:[(0,u.jsx)(`span`,{children:`🚩`}),` কোনো প্রশ্ন ফ্ল্যাগ করা নেই`]}),_===`unanswered`&&N===0&&(0,u.jsxs)(`div`,{className:`q-nav-empty-state success`,children:[(0,u.jsx)(`span`,{children:`🎉`}),` অসাধারণ! সব প্রশ্নের উত্তর দেওয়া শেষ`]}),(0,u.jsxs)(`div`,{className:`q-nav-legend`,children:[(0,u.jsxs)(`div`,{className:`legend-item`,children:[(0,u.jsx)(`span`,{className:`legend-dot current-dot`}),(0,u.jsx)(`span`,{children:`বর্তমান প্রশ্ন`})]}),(0,u.jsxs)(`div`,{className:`legend-item`,children:[(0,u.jsx)(`span`,{className:`legend-dot answered-dot`}),(0,u.jsxs)(`span`,{children:[`উত্তর দেওয়া (`,A,`)`]})]}),(0,u.jsxs)(`div`,{className:`legend-item`,children:[(0,u.jsx)(`span`,{className:`legend-dot flagged-dot`}),(0,u.jsxs)(`span`,{children:[`ফ্ল্যাগড (`,M,`)`]})]}),(0,u.jsxs)(`div`,{className:`legend-item`,children:[(0,u.jsx)(`span`,{className:`legend-dot pending-dot`}),(0,u.jsxs)(`span`,{children:[`বাকি আছে (`,N,`)`]})]})]})]})})]}),y&&(0,u.jsx)(`div`,{style:{position:`fixed`,top:0,left:0,right:0,bottom:0,backgroundColor:`rgba(15, 23, 42, 0.8)`,display:`flex`,alignItems:`center`,justifyContent:`center`,zIndex:9999,padding:`1.25rem`,backdropFilter:`blur(5px)`,animation:`fadeIn 0.2s ease`},children:(0,u.jsxs)(`div`,{style:{backgroundColor:`#ffffff`,borderRadius:`18px`,maxWidth:`460px`,width:`100%`,padding:`2.25rem 2rem`,textAlign:`center`,boxShadow:`0 25px 50px -12px rgba(0, 0, 0, 0.35)`,border:`2px solid #ef4444`},children:[(0,u.jsx)(`div`,{style:{width:`64px`,height:`64px`,backgroundColor:`#fee2e2`,borderRadius:`50%`,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 1.25rem auto`,fontSize:`2rem`},children:`🛑`}),(0,u.jsx)(`h3`,{style:{color:`#b91c1c`,fontSize:`1.3rem`,fontWeight:800,margin:`0 0 0.5rem 0`},children:`পরীক্ষা চলাকালীন ব্যাকে যাওয়া নিষেধ!`}),(0,u.jsx)(`p`,{style:{color:`#475569`,fontSize:`0.9rem`,lineHeight:`1.6`,margin:`0 0 1.75rem 0`},children:`আপনি বর্তমানে একটি সক্রিয় মক টেস্টে অংশগ্রহণ করছেন। পরীক্ষা শেষ না করে পেজ ত্যাগ করলে বা ব্যাকে গেলে আপনার বর্তমান উত্তরগুলো বাতিল হতে পারে। আপনি কি পরীক্ষায় ফিরে যেতে চান নাকি এখনই সাবমিট করতে চান?`}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`0.75rem`,justifyContent:`center`,flexDirection:`column`},children:[(0,u.jsx)(`button`,{type:`button`,onClick:()=>b(!1),style:{width:`100%`,padding:`0.85rem 1rem`,backgroundColor:`var(--primary-teal, #319795)`,color:`#ffffff`,border:`none`,borderRadius:`10px`,fontWeight:700,fontSize:`0.95rem`,cursor:`pointer`,boxShadow:`0 4px 12px rgba(49, 151, 149, 0.3)`},children:`✍️ পরীক্ষায় ফিরে যান (Continue Exam)`}),(0,u.jsx)(`button`,{type:`button`,onClick:()=>{b(!1),S()},style:{width:`100%`,padding:`0.75rem 1rem`,backgroundColor:`transparent`,color:`#ef4444`,border:`1px solid #fecaca`,borderRadius:`10px`,fontWeight:600,fontSize:`0.88rem`,cursor:`pointer`},children:`🚪 পরীক্ষা সাবমিট করে ফলাফল দেখুন (Submit & Finish)`})]})]})}),(0,u.jsx)(`style`,{children:`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        /* Question Navigator Premium Styles */
        .test-navigator-sidebar {
          width: 290px;
          flex-shrink: 0;
        }
        .q-nav-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 1.25rem;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
          position: sticky;
          top: 85px;
          transition: all 0.2s ease;
        }
        .q-nav-header {
          margin-bottom: 0.85rem;
        }
        .q-nav-title-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.65rem;
        }
        .q-nav-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .q-nav-icon {
          font-size: 1.15rem;
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .q-nav-title {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .q-nav-subtitle {
          font-size: 0.7rem;
          font-weight: 500;
          color: #64748b;
        }
        .q-nav-progress-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          background: #f0fdfa;
          padding: 0.2rem 0.55rem;
          border-radius: 20px;
          border: 1px solid #ccfbf1;
          white-space: nowrap;
        }
        .q-nav-progress-track {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
        }
        .q-nav-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d9488 0%, #10b981 100%);
          border-radius: 10px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Filter Tabs */
        .q-nav-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          background: #f8fafc;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          margin-bottom: 0.75rem;
        }
        .q-nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5px 2px;
          border-radius: 7px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.68rem;
          font-weight: 600;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .q-nav-tab .tab-counter {
          font-size: 0.75rem;
          font-weight: 800;
          margin-top: 1px;
        }
        .q-nav-tab:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .q-nav-tab.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        .q-nav-tab.answered-tab.active .tab-counter { color: #10b981; }
        .q-nav-tab.flagged-tab.active .tab-counter { color: #f59e0b; }
        .q-nav-tab.unanswered-tab.active .tab-counter { color: #64748b; }

        /* Quick Jump Button */
        .q-nav-jump-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: #f0fdfa;
          border: 1.5px dashed #99f6e4;
          border-radius: 10px;
          color: #0f766e;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }
        .q-nav-jump-btn:hover {
          background: #ccfbf1;
          border-color: #0d9488;
          transform: translateY(-1px);
        }
        .q-nav-jump-btn .jump-arrow {
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }
        .q-nav-jump-btn:hover .jump-arrow {
          transform: translateX(3px);
        }

        /* Question Grid Container */
        .q-nav-grid-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          max-height: 270px;
          overflow-y: auto;
          padding: 2px 4px 2px 2px;
          margin-bottom: 0.85rem;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        .q-nav-grid-container::-webkit-scrollbar {
          width: 5px;
        }
        .q-nav-grid-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }

        /* Question Box Button */
        .q-nav-btn {
          height: 38px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .q-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        .q-nav-btn:active {
          transform: scale(0.95);
        }

        /* States */
        .q-nav-btn.is-unattempted {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #64748b;
        }
        .q-nav-btn.is-unattempted:hover {
          border-color: #94a3b8;
          color: #334155;
          background: #f1f5f9;
        }

        .q-nav-btn.is-answered {
          background: #ecfdf5;
          border: 2px solid #10b981;
          color: #047857;
        }
        .q-nav-btn.is-answered:hover {
          background: #d1fae5;
        }

        .q-nav-btn.is-flagged {
          background: #fffbeb;
          border: 2px solid #f59e0b;
          color: #b45309;
        }
        .q-nav-btn.is-flagged.is-answered {
          background: #ecfdf5;
          border: 2px solid #f59e0b;
          color: #047857;
        }
        .q-nav-btn .flag-dot {
          position: absolute;
          top: -4px;
          right: -3px;
          font-size: 0.62rem;
          line-height: 1;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
        }

        .q-nav-btn.is-current {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
          border: 2px solid #0d9488 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.35), 0 4px 10px rgba(13, 148, 136, 0.25) !important;
          transform: scale(1.06);
          z-index: 2;
        }

        /* Empty Filter States */
        .q-nav-empty-state {
          text-align: center;
          padding: 1.25rem 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
          margin-bottom: 0.85rem;
        }
        .q-nav-empty-state.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
        }

        /* Legend */
        .q-nav-legend {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 500;
          color: #475569;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .legend-dot.current-dot {
          background: #0d9488;
          box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25);
        }
        .legend-dot.answered-dot {
          background: #10b981;
        }
        .legend-dot.flagged-dot {
          background: #f59e0b;
        }
        .legend-dot.pending-dot {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }

        /* Tablet & Mobile Responsiveness */
        @media (max-width: 992px) {
          .test-navigator-sidebar {
            width: 100% !important;
          }
          .q-nav-card {
            position: static !important;
            margin-top: 1rem;
          }
          .q-nav-grid-container {
            grid-template-columns: repeat(10, 1fr) !important;
            max-height: 200px;
          }
        }
        @media (max-width: 600px) {
          .q-nav-grid-container {
            grid-template-columns: repeat(6, 1fr) !important;
          }
          .q-nav-tabs {
            font-size: 0.62rem;
          }
        }
      `})]})}function h({test:e,submission:t,onViewResult:n,onViewSolutions:r,onBack:i}){return(0,u.jsx)(`div`,{className:`container`,style:{padding:`3.5rem 1rem`,maxWidth:`650px`,textAlign:`center`},children:(0,u.jsxs)(`div`,{style:{background:`var(--white)`,border:`1px solid var(--gray-200)`,borderRadius:`var(--border-radius-lg, 16px)`,padding:`2.5rem 2rem`,boxShadow:`var(--shadow-md)`},children:[(0,u.jsx)(`div`,{style:{fontSize:`3rem`,marginBottom:`1rem`,lineHeight:1},children:`⚠️`}),(0,u.jsx)(`h2`,{style:{fontSize:`1.55rem`,fontWeight:800,color:`var(--text-charcoal)`,marginBottom:`0.5rem`},children:`আপনি ইতিপূর্বে এই মক টেস্টটি সম্পন্ন করেছেন`}),(0,u.jsxs)(`p`,{style:{fontSize:`0.92rem`,color:`var(--gray-600)`,marginBottom:`1.75rem`,lineHeight:1.5},children:[(0,u.jsx)(`strong`,{children:e.title}),(0,u.jsx)(`br`,{}),`প্রতিটি মক টেস্ট কেবল একবারই দেওয়া যায়। আপনি আপনার পূর্ববর্তী স্কোর এবং বিস্তারিত ব্যাখ্যাসহ সমাধান দেখতে পারেন।`]}),t&&(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`center`,gap:`1.5rem`,background:`var(--bg-light)`,borderRadius:`var(--border-radius-md)`,padding:`1rem 1.5rem`,marginBottom:`2rem`},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsxs)(`div`,{style:{fontSize:`1.25rem`,fontWeight:800,color:`var(--primary-teal)`},children:[t.score===void 0?`0`:Number(t.score).toFixed(1),` / `,t.totalMarks||e.totalMarks]}),(0,u.jsx)(`div`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`},children:`অর্জিত স্কোর`})]}),(0,u.jsx)(`div`,{style:{borderLeft:`1px solid var(--gray-300)`}}),(0,u.jsxs)(`div`,{children:[(0,u.jsxs)(`div`,{style:{fontSize:`1.25rem`,fontWeight:800,color:`var(--cta-orange)`},children:[t.percentage===void 0?`0`:t.percentage,`%`]}),(0,u.jsx)(`div`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`},children:`নির্ভুলতা`})]}),t.timeUsed!==void 0&&t.timeUsed>0&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`div`,{style:{borderLeft:`1px solid var(--gray-300)`}}),(0,u.jsxs)(`div`,{children:[(0,u.jsxs)(`div`,{style:{fontSize:`1.25rem`,fontWeight:800,color:`var(--text-charcoal)`},children:[Math.floor(t.timeUsed/60),`মি `,t.timeUsed%60,`সে`]}),(0,u.jsx)(`div`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`},children:`ব্যয়িত সময়`})]})]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,justifyContent:`center`,flexWrap:`wrap`},children:[(0,u.jsx)(`button`,{type:`button`,className:`btn btn-teal`,style:{padding:`0.75rem 1.6rem`,fontSize:`0.92rem`,fontWeight:700},onClick:n,children:`📊 ফলাফল দেখুন`}),(0,u.jsx)(`button`,{type:`button`,className:`btn btn-secondary`,style:{padding:`0.75rem 1.6rem`,fontSize:`0.92rem`,fontWeight:700},onClick:r,children:`💡 সমাধান ও ব্যাখ্যা`})]}),(0,u.jsx)(`div`,{style:{marginTop:`1.75rem`},children:(0,u.jsx)(`button`,{type:`button`,className:`btn`,style:{background:`transparent`,border:`none`,color:`var(--gray-600)`,fontSize:`0.85rem`,cursor:`pointer`,textDecoration:`underline`},onClick:i,children:`← Back to Test List`})})]})})}function g({test:e,user:t,answers:n={},totalSeconds:i=0,timeUsed:a=0,onFinish:o,isReviewOnly:s=!1,initialTab:c=`result`}){let[d,f]=(0,l.useState)(c||`result`),[p,m]=(0,l.useState)(null),h=(Array.isArray(e?.questions)?e.questions:[]).map((e,t)=>({id:e.id||`q-${t}`,question:e.question||e.title||`Question ${t+1}`,options:Array.isArray(e.options)&&e.options.length>0?e.options:[e.optionA,e.optionB,e.optionC,e.optionD].filter(Boolean),correct:typeof e.correct==`number`?e.correct:0,explanation:e.explanation||`কোনো ব্যাখ্যা দেওয়া হয়নি।`})),g=Math.max(1,h.length),_=e.totalMarks/g,v=0,y=0,b=0;h.forEach(e=>{n[e.id]===void 0?b++:n[e.id]===e.correct?v++:y++});let x=v*_+y*e.negativeMarking,S=Math.max(0,x),C=(S/e.totalMarks*100).toFixed(1),w=Math.floor(a/60),T=a%60;(0,l.useEffect)(()=>{s||r(t,{testId:e.id,score:Number(S.toFixed(2)),totalMarks:e.totalMarks,percentage:Number(C),answers:n,timeUsed:a})},[]);let E=C>=85?{label:`Excellent! 🏆`,color:`#276749`,bg:`#c6f6d5`}:C>=70?{label:`Good Job! 🎯`,color:`#2b6cb0`,bg:`#bee3f8`}:C>=50?{label:`Average 📚`,color:`#744210`,bg:`#fefcbf`}:{label:`Needs Improvement 💪`,color:`#742a2a`,bg:`#fed7d7`},D=120*Math.PI,O=D-Math.min(100,Math.max(0,Number(C)||0))/100*D;return(0,u.jsxs)(`div`,{className:`container`,style:{padding:`2rem 0`,maxWidth:`900px`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`center`,gap:`0.75rem`,marginBottom:`2rem`,background:`var(--white)`,padding:`0.4rem`,borderRadius:`12px`,border:`1px solid var(--gray-200)`,boxShadow:`var(--shadow-sm)`},children:[(0,u.jsx)(`button`,{type:`button`,className:`btn`,style:{flex:1,padding:`0.7rem 1.5rem`,borderRadius:`9px`,border:`none`,fontSize:`0.92rem`,fontWeight:700,cursor:`pointer`,transition:`all 0.2s ease`,background:d===`result`?`var(--primary-teal)`:`transparent`,color:d===`result`?`#ffffff`:`var(--gray-600)`},onClick:()=>f(`result`),children:`📊 View Result`}),(0,u.jsx)(`button`,{type:`button`,className:`btn`,style:{flex:1,padding:`0.7rem 1.5rem`,borderRadius:`9px`,border:`none`,fontSize:`0.92rem`,fontWeight:700,cursor:`pointer`,transition:`all 0.2s ease`,background:d===`solutions`?`var(--primary-teal)`:`transparent`,color:d===`solutions`?`#ffffff`:`var(--gray-600)`},onClick:()=>f(`solutions`),children:`💡 View Solutions`})]}),d===`result`&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`center`,alignItems:`center`,gap:`2.5rem`,flexWrap:`wrap`,background:`linear-gradient(135deg, var(--primary-teal) 0%, #2c7a7b 100%)`,borderRadius:`var(--border-radius-lg)`,padding:`2.5rem 3rem`,color:`white`,textAlign:`center`,marginBottom:`2rem`,position:`relative`,overflow:`hidden`},children:[(0,u.jsx)(`div`,{style:{position:`absolute`,top:`-30px`,right:`-30px`,fontSize:`8rem`,opacity:.07},children:`📝`}),(0,u.jsxs)(`div`,{style:{position:`relative`,width:`150px`,height:`150px`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0},children:[(0,u.jsxs)(`svg`,{height:`150`,width:`150`,style:{transform:`rotate(-90deg)`,display:`block`},children:[(0,u.jsx)(`circle`,{stroke:`rgba(255, 255, 255, 0.2)`,fill:`transparent`,strokeWidth:8,r:60,cx:`75`,cy:`75`}),(0,u.jsx)(`circle`,{stroke:`#ffffff`,fill:`transparent`,strokeWidth:8,strokeDasharray:D+` `+D,style:{strokeDashoffset:O,transition:`stroke-dashoffset 0.8s ease-in-out`},strokeLinecap:`round`,r:60,cx:`75`,cy:`75`})]}),(0,u.jsxs)(`div`,{style:{position:`absolute`,inset:0,display:`flex`,flexDirection:`column`,alignItems:`center`,justifyContent:`center`,textAlign:`center`,pointerEvents:`none`,padding:`0 6px`,boxSizing:`border-box`},children:[(0,u.jsxs)(`span`,{style:{fontSize:C.length>4?`1.55rem`:`1.75rem`,fontWeight:800,lineHeight:1.1,letterSpacing:`-0.02em`,color:`#ffffff`,whiteSpace:`nowrap`},children:[C,`%`]}),(0,u.jsx)(`span`,{style:{fontSize:`0.65rem`,fontWeight:700,textTransform:`uppercase`,color:`rgba(255, 255, 255, 0.85)`,letterSpacing:`0.08em`,marginTop:`3px`},children:`Accuracy`})]})]}),(0,u.jsxs)(`div`,{style:{textAlign:`left`,flex:1,minWidth:`220px`},children:[(0,u.jsx)(`span`,{style:{fontSize:`0.72rem`,background:`rgba(255,255,255,0.18)`,borderRadius:`20px`,padding:`0.2rem 0.65rem`,fontWeight:600,display:`inline-block`,marginBottom:`0.6rem`,letterSpacing:`0.05em`},children:`🎓 EXAM COMPLETED SUMMARY`}),(0,u.jsx)(`h2`,{style:{color:`white`,margin:`0 0 0.5rem 0`,fontSize:`1.75rem`},children:e.title}),(0,u.jsxs)(`p`,{style:{color:`rgba(255, 255, 255, 0.85)`,margin:`0 0 1.25rem 0`,fontSize:`0.9rem`,lineHeight:1.5},children:[`You scored `,(0,u.jsx)(`strong`,{children:S.toFixed(1)}),` out of `,e.totalMarks,` points.`,(0,u.jsx)(`br`,{}),`Time used: `,(0,u.jsxs)(`strong`,{children:[w,`m `,T,`s`]}),` of `,e.duration,` mins.`]}),(0,u.jsx)(`span`,{style:{background:E.bg,color:E.color,borderRadius:`20px`,padding:`0.45rem 1.25rem`,fontWeight:700,fontSize:`0.92rem`,boxShadow:`0 4px 6px rgba(0,0,0,0.05)`},children:E.label})]})]}),(0,u.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(150px, 1fr))`,gap:`1rem`,marginBottom:`2rem`},children:[{icon:`✅`,label:`Correct`,value:v,color:`#276749`,bg:`#c6f6d5`},{icon:`❌`,label:`Wrong`,value:y,color:`#742a2a`,bg:`#fed7d7`},{icon:`⏭`,label:`Skipped`,value:b,color:`#744210`,bg:`#fefcbf`},{icon:`📊`,label:`Percentage`,value:`${C}%`,color:`#2b6cb0`,bg:`#bee3f8`},{icon:`⏱`,label:`Time Used`,value:`${w}m ${T}s`,color:`var(--gray-600)`,bg:`var(--gray-200)`}].map((e,t)=>(0,u.jsxs)(`div`,{style:{background:`var(--white)`,border:`1px solid var(--gray-200)`,borderRadius:`var(--border-radius-md)`,padding:`1.25rem`,textAlign:`center`,boxShadow:`var(--shadow-sm)`},children:[(0,u.jsx)(`div`,{style:{fontSize:`1.5rem`,marginBottom:`0.3rem`},children:e.icon}),(0,u.jsx)(`div`,{style:{fontSize:`1.5rem`,fontWeight:800,color:e.color,background:e.bg,borderRadius:`8px`,padding:`0.2rem 0.5rem`,display:`inline-block`,marginBottom:`0.3rem`},children:e.value}),(0,u.jsx)(`div`,{style:{fontSize:`0.72rem`,color:`var(--gray-500)`},children:e.label})]},t))}),(0,u.jsxs)(`div`,{style:{background:`#fffaf0`,border:`1px solid #faf089`,borderRadius:`var(--border-radius-sm)`,padding:`0.75rem 1rem`,marginBottom:`2rem`,fontSize:`0.8rem`,color:`#744210`},children:[`📌 Marking: +`,_.toFixed(2),` per correct answer, `,e.negativeMarking,` per wrong answer. Final score = max(0, raw score).`]}),(0,u.jsx)(`div`,{style:{textAlign:`center`,marginBottom:`2rem`},children:(0,u.jsx)(`button`,{type:`button`,className:`btn btn-teal`,style:{padding:`0.7rem 1.8rem`},onClick:()=>f(`solutions`),children:`💡 View Detailed Solutions & Explanations →`})})]}),d===`solutions`&&(0,u.jsxs)(u.Fragment,{children:[(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`1.25rem`},children:[(0,u.jsx)(`h3`,{style:{margin:0,color:`var(--text-charcoal)`},children:`📋 Question-wise Review & Solutions`}),(0,u.jsxs)(`span`,{style:{fontSize:`0.8rem`,color:`var(--gray-500)`},children:[`Total `,h.length,` Questions`]})]}),(0,u.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`1rem`,marginBottom:`2rem`},children:h.map((e,t)=>{let r=n[e.id],i=r===e.correct,a=r===void 0?`skipped`:i?`correct`:`wrong`,o={correct:{border:`#68d391`,bg:`#f0fff4`,badge:`#c6f6d5`,badgeText:`#276749`},wrong:{border:`#fc8181`,bg:`#fff5f5`,badge:`#fed7d7`,badgeText:`#742a2a`},skipped:{border:`var(--gray-300)`,bg:`var(--bg-light)`,badge:`var(--gray-200)`,badgeText:`var(--gray-600)`}}[a];return(0,u.jsxs)(`div`,{style:{background:o.bg,border:`1.5px solid ${o.border}`,borderRadius:`var(--border-radius-md)`,padding:`1.25rem`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,marginBottom:`0.75rem`,gap:`0.5rem`},children:[(0,u.jsxs)(`div`,{style:{fontSize:`0.95rem`,fontWeight:600,color:`var(--text-charcoal)`,flex:1},children:[(0,u.jsxs)(`span`,{style:{color:`var(--gray-500)`,fontWeight:400,marginRight:`0.4rem`},children:[`Q`,t+1,`.`]}),e.question]}),(0,u.jsx)(`span`,{style:{flexShrink:0,fontSize:`0.72rem`,background:o.badge,color:o.badgeText,borderRadius:`20px`,padding:`0.2rem 0.6rem`,fontWeight:700},children:a===`correct`?`✅ Correct`:a===`wrong`?`❌ Wrong`:`⏭ Skipped`})]}),(0,u.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.35rem`,marginBottom:`0.75rem`},children:e.options.map((t,n)=>{let i=r===n,a=e.correct===n;return(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.6rem`,padding:`0.45rem 0.75rem`,borderRadius:`6px`,background:a?`#c6f6d5`:i&&!a?`#fed7d7`:`transparent`,border:`1px solid ${a?`#68d391`:i&&!a?`#fc8181`:`transparent`}`,fontSize:`0.85rem`,color:`var(--text-charcoal)`},children:[(0,u.jsx)(`span`,{style:{fontWeight:700,color:a?`#276749`:i&&!a?`#742a2a`:`var(--gray-400)`,minWidth:`20px`},children:a?`✓`:i&&!a?`✗`:[`A`,`B`,`C`,`D`][n]}),t,a&&(0,u.jsx)(`span`,{style:{marginLeft:`auto`,fontSize:`0.7rem`,color:`#276749`,fontWeight:700},children:`Correct Answer`}),i&&!a&&(0,u.jsx)(`span`,{style:{marginLeft:`auto`,fontSize:`0.7rem`,color:`#742a2a`,fontWeight:700},children:`Your Answer`})]},n)})}),(0,u.jsxs)(`button`,{onClick:()=>m(e=>e===t?null:t),style:{background:`none`,border:`none`,color:`var(--primary-teal)`,fontSize:`0.78rem`,fontWeight:600,cursor:`pointer`,padding:`0`,display:`flex`,alignItems:`center`,gap:`0.3rem`},children:[p===t?`▲ Hide`:`▼ Show`,` Explanation`]}),p===t&&(0,u.jsxs)(`div`,{style:{marginTop:`0.6rem`,padding:`0.75rem`,background:`#ebf8ff`,border:`1px solid #bee3f8`,borderRadius:`6px`,fontSize:`0.82rem`,color:`#2b6cb0`,lineHeight:1.6},children:[`💡 `,e.explanation]})]},e.id)})})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,justifyContent:`center`,flexWrap:`wrap`},children:[(0,u.jsx)(`button`,{className:`btn btn-secondary`,style:{padding:`0.7rem 1.5rem`},onClick:()=>o(`list`),children:`← Back to Test List`}),(0,u.jsx)(`button`,{className:`btn btn-teal`,style:{padding:`0.7rem 1.5rem`},onClick:()=>o(`dashboard`),children:`Go to Dashboard`})]})]})}function _({user:e,onNavigate:t}){let[n,r]=(0,l.useState)(null),[i,a]=(0,l.useState)(null),[f,_]=(0,l.useState)(null),[v,y]=(0,l.useState)(()=>o(e));(0,l.useEffect)(()=>{s(e).then(e=>{e&&y(e)});let t=()=>{y(o(e))};return window.addEventListener(`edufast-mock-submissions-update`,t),()=>window.removeEventListener(`edufast-mock-submissions-update`,t)},[e]);let b=t=>{let n=d(e?.group||e?.academicGroup),i=d(t.group);if(n!==i){alert(`এই মক টেস্টটি ${t.group||i} বিভাগের শিক্ষার্থীদের জন্য নির্ধারিত। আপনি শুধুমাত্র ${n} বিভাগের টেস্ট দিতে পারবেন।`);return}let o=c(e,t.id)||v&&v[t.id];if(o){_({test:t,submission:o}),r(null),a(null);return}_(null),a(null),r(t)},x=n=>{r(null),a(null),_(null),y(o(e)),n===`dashboard`&&t(`dashboard`)};return f?(0,u.jsx)(h,{test:f.test,submission:f.submission,onViewResult:()=>{a({test:f.test,submission:f.submission,tab:`result`}),_(null)},onViewSolutions:()=>{a({test:f.test,submission:f.submission,tab:`solutions`}),_(null)},onBack:()=>_(null)}):i?(0,u.jsx)(g,{test:i.test,user:e,answers:i.submission?.answers||{},totalSeconds:i.test.duration*60,timeUsed:i.submission?.timeUsed||0,onFinish:x,isReviewOnly:!0,initialTab:i.tab||`result`}):n?(0,u.jsx)(m,{test:n,user:e,onFinish:x}):(0,u.jsx)(p,{user:e,submissions:v,onStartTest:b})}export{_ as default,f as getBanglaGroup,d as normalizeGroup};