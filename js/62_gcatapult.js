// 62_gcatapult.js — v3.31 1장 거치 무기: 고블린 투석기
//  방 왼쪽 · 오른쪽 가장자리에 고정해 방 안쪽을 봄 (옆에서 본 그림이라 탄이 옆으로 날아가게). 플레이어가 투석기 뒤(벽 쪽)로 돌아가면 쏘지 않고 기다림.
//  고블린 사수 둘이 밧줄을 두 번 끊어 당겨 → 팽팽하게 버텼다가 → 놓으면 돌을 포물선으로 날림 (떨어질 자리 예고 원)
//  세 번째 발마다 점액탄(밟으면 느려지는 웅덩이 5초) · 같은 방에 고블린 폭탄병이 살아 있으면 가끔 폭탄(오폭 그대로)
//  방에 들어가면 투석기는 처음부터 빈 채로 놓여 있고, 해당 웨이브가 시작되면 사수 고블린 둘이 달려와 붙어서 쏘기 시작함 (그 전에 부수거나 사수를 끊을 수 있음)
//  사수가 하나면 당김이 두 배 느림 · 둘 다 쓰러지면 멈춤 · 투석기를 부수면 부서진 채 남음 · 사수 말고는 적이 다 쓰러지면 버려져 부서짐
const GCAT = (() => {
  const D = {"F":{"w_l0":{"r":["....aaaaaa....","...abbbbbba...","aaabbbbbbbbbaa","accbdbbbdbbcca","..aabcccbbaa..","....aabbaa....","....eeeeee....","...aeeeeeeeaa.","..abefeefeabba",".ab.aefeea.aa.",".ac.aeefea....",".aa.affffa....","...aaca.acaa..","...aaaa.aaaa.."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":7,"ay":14},"w_l1":{"r":["....aaaaaa.....","...abbbbbba....","aaabbbbbbbbbaa.","accbdbbbdbbcca.","..aabcccbbaa...","....aabbaa.....",".....eeeeee....","....aeeeeeeeaa.","...abefeefeabba","..ab.aefeea.aa.","..ac.aeefea....","..aa.affffa....","....aaca.acaa..","....aaaa.aaaa.."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":8,"ay":14},"w_l2":{"r":["....aaaaaa.....","...abbbbbba....","aaabbbbbbbbbaa.","accbdbbbdbbcca.","..aabcccbbaa...","....aabbaa.....",".....eeeeee....","....aeeeeeeeaa.","...abefeefeabba","..ab.aefeea.aa.","..ac.aeefea....","..aa.affffa....","....aaca.acaa..","....aaaa.aaaa.."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":9,"ay":13},"w_fall":{"r":["....aaaaaa.....","...abbbbbba....","aaabbbbbbbbbaa.","accbdbbbdbbcca.","..aabcccbbaa...","....aabbaaee...",".....aeeeeeeea.","....abefeefeaba","...ab.aefeea.a.","...ac.aeefea...","...aa.affffa...",".....aaca.acaa.",".....aaaa.aaaa."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":10,"ay":12},"w_cheer":{"r":["....aaaaaa....","...abbbbbba...","aaabbbbbbbbbaa","accbdbbbdbbcca",".aaabcccbbaaa.","aba.aabbaa.aba","aba.eeeeee.aba",".abaeeeeeeeba.","..aaefeefeaa..","....aefeea....","....aeefea....","....affffa....","...aaca.acaa..","...aaaa.aaaa.."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":7,"ay":14},"a_rock":{"r":["...aa....","..abcaa..",".abcccda.","abbcccdda","accccddea","acddddeea",".addeeea.","..aaaaa.."],"p":{"a":"#0e120a","b":"#b0aca4","c":"#8a8680","d":"#5a5650","e":"#3a3834"},"ax":4,"ay":5},"a_slime":{"r":["...aaa...","..abbba..",".acbbbba.","acbbbbbda","abbbbbdda",".abdddda.","..aaaaa.."],"p":{"a":"#0e120a","b":"#7ab040","c":"#b8f080","d":"#4a7a28"},"ax":4,"ay":5},"a_puddle":{"r":["......a.a.a.a.a.a.a.a......","...a.a.babababababab.a.a...","..a.aabbbccbbabbbabbbaa.a..",".a.aabababababababababaa.a.","a.aabbbabbbabbbacbbabbbaa.a",".a.aabababababababababaa.a.","..a.aabbbabbbabbbabbbaa.a..","...a.a.babababababab.a.a...","......a.a.a.a.a.a.a.a......"],"p":{"a":"#3a7a26","b":"#62b03a","c":"#b8f080"},"ax":13,"ay":4},"c_base":{"r":["......................a.a.a.....................",".....................abababa....................","....................accccccca...................","..................aaadddddddaa..................","................aaeeefeeeeefeeaaaa..............",".............aaagahijkhhhhijkhallla.............","............ammmnaojpooooojpooalqlqa............","............ammna.akhoaaaekoaaalllla............","............amnanaaehoa..aehoa.alala............","............ana.a.aehoa..aehoa..a.a.............",".............a....aehoa..aehoa..................",".................aehoa...aehoa..................",".................afhoa....afhoa.................",".................aehoa....aehoa.................","................aehoa.....aehoa.................","................aehoa.....aehoa.................","................aehoa.....aehoa.................","................aehoa......aehoa................","...............afhoa.......afhoa................","...............aehoa.......aehoa................",".............aaaehoaaaaaaaaaehoa................","............agrsrfeeeeefeeegrsra................",".............asrsghhhhhhhhhhsrsga...............",".............aeehoaaaaaaaaaaaehoa...............","............afhfhoa.........afhoa...............","...........aehehorsr..o.....aehoa...............","..........aehaehrsrsro......aehoa...............",".........aehaaehsrtks........aehoa..............","........aehaaehorsrsr........aehoa..............",".......aeha.aeooarsr.........aehoa..............","......afha..afhoa............afhoa..............","....aaeha...aehoa.............aehoa.............","...aijka...aehoa..............aehoa.............",".aaajpaaaaaaehoaaaaaaaaaaaaaaaaehoaaaa..........","aijkkeeeeefeeeeefeeeeefeeeeefeeeeefijka.........","ajphhhhjjjhhhthhhhhhhhhhhthhhjjjhhhjpha.........","akooojjjgjjkooooooooooooooojjjgjjkokooa....a....",".aaeejghghgkfeeeeefeeeeefeejghghgkeeaa....aua...","..ahjjhegghkkhhhhhhhhhhhhhjjhegghkkha....avuwa..","...ajgggigggkaaaaaaaaaaaaajgggigggka....auvuwwa.","...ajjhggghkka...........ajjhggghkka...auwuvuwxa","....ajghghgka.............ajghghgka.....aaaaaaa.","....akkkgkkka.............akkkgkkka.............",".....aakkkaa...............aakkkaa..............",".......aaa...................aaa................"],"p":{"a":"#0e120a","b":"#d8c070","c":"#c8a860","d":"#a88840","e":"#a87c4c","f":"#c09060","g":"#7a6a4a","h":"#8a6034","i":"#a8a6b6","j":"#7c7a8a","k":"#4a4856","l":"#e8e0cc","m":"#9a2a24","n":"#6a1a18","o":"#5a3a1e","p":"#2a2830","q":"#1a1410","r":"#d8c8a0","s":"#a89870","t":"#3e2814","u":"#8a8680","v":"#b0aca4","w":"#5a5650","x":"#3a3834"},"ax":19,"ay":43},"c_broken":{"r":["................aaa........................","..............aabcda.......................",".............aefgfda.......................","..............agfgea.......................","..............ahcda.........aaa............","..............abcda........abcda...........",".............abcda.........abcda...........",".............abcda..........abcda..........",".............abcda..........abcda..........",".....aaaaaaaabcdaa..........abcda..........","....abbbhbbbbbhbbbaaaaaaaaaaaahcda.........","....acccccccccccccbbhibbbbhbbbbbda.........",".....aaaaaaabcdaaacccccccccccccccda........",".aaaaaaaaaaabcdaaaaiaaaaaaaaaaabcdiaaa.....","abbbhbbbbbhbbbbbhbbbbbhbbbbbhbbbbbhbbba....","accccccjjjcccccccccccccccccccccccccccca....","addddjjjejjkddddddddddddddddddddddddida....",".aaaajececekaaaaaaaaaaaaaaaaaaaaaaaaaa.aa..","...ajjcbeeckka........................alma.","...ajeeeneeeka.........................aaia","...ajjceeeckka...........................a.","....ajececeka..............................","....akkkekkka..............................",".....aakkkaa...............................",".......aaa................................."],"p":{"a":"#0e120a","b":"#a87c4c","c":"#8a6034","d":"#5a3a1e","e":"#7a6a4a","f":"#d8c8a0","g":"#a89870","h":"#c09060","i":"#2a2018","j":"#7c7a8a","k":"#4a4856","l":"#5a5650","m":"#8a8680","n":"#a8a6b6"},"ax":19,"ay":23},"c_p1_1_rock":{"r":["...aa....................","..abca...................",".abccda..................","abcccdda.................","accdddea.................","afddeeafa................","afghghgfa................","afhghghfa................",".affhffa.................","..aaahffa................",".....ahiia...............","......ajjfa..............",".......aahfaa............",".........ahfka...........","..........ahffa..........","...........aahia.........",".............ajia........","..............ajfa.......","...............ahfa......","................ahfa.....",".................ahfa....","..................ahfa...","...................ahfa..","....................ahfa.",".....................ahfa","......................aa."],"p":{"a":"#0e120a","b":"#b0aca4","c":"#8a8680","d":"#5a5650","e":"#3a3834","f":"#5a3a1e","g":"#c09060","h":"#8a6034","i":"#a8a6b6","j":"#4a4856","k":"#a87c4c"},"ax":23,"ay":39},"c_p1_1_slime":{"r":["...aa....................","..abba...................",".acbbba..................","abbbbbda.................","aebdddaea................","aefgfgfea................","aegfgfgea................",".aeegeea.................","..aaageea................",".....aghha...............","......aiiea..............",".......aageaa............",".........ageja...........","..........ageea..........","...........aagha.........",".............aiha........","..............aiea.......","...............agea......","................agea.....",".................agea....","..................agea...","...................agea..","....................agea.",".....................agea","......................aa."],"p":{"a":"#0e120a","b":"#7ab040","c":"#b8f080","d":"#4a7a28","e":"#5a3a1e","f":"#c09060","g":"#8a6034","h":"#a8a6b6","i":"#4a4856","j":"#a87c4c"},"ax":23,"ay":38},"c_p1_1_bomb":{"r":["......a..................",".....aba.................","....aca..................","...aca...................","..addda..................",".adeddfa.................",".adddffa.................","agafffaga................","aghihihga................","agihihiga................",".aggigga.................","..aaaigga................",".....aijja...............","......akkga..............",".......aaigaa............",".........aigca...........","..........aigga..........","...........aaija.........",".............akja........","..............akga.......","...............aiga......","................aiga.....",".................aiga....","..................aiga...","...................aiga..","....................aiga.",".....................aiga","......................aa."],"p":{"a":"#0e120a","b":"#ffd23a","c":"#a87c4c","d":"#3a3640","e":"#7c7a8a","f":"#26252b","g":"#5a3a1e","h":"#c09060","i":"#8a6034","j":"#a8a6b6","k":"#4a4856"},"ax":23,"ay":41},"c_p2_1_rock":{"r":["...aa........................","..abca.......................",".abccda......................","abcccdda.....................","accdddea.....................","afddeeafa....................","afghghgfa....................","afhghghfa....................",".affhffigaaa.................","..aaaahfffijaaa..............","......aaahfkjigaa............",".........aaakfffiaaa.........","............aahfffija........","..............aaahfkfaaa.....",".................aakffiiaa...","...................aahfffia..",".....................aaahffa.","........................ahffa",".........................aaa."],"p":{"a":"#0e120a","b":"#b0aca4","c":"#8a8680","d":"#5a5650","e":"#3a3834","f":"#5a3a1e","g":"#c09060","h":"#8a6034","i":"#a87c4c","j":"#a8a6b6","k":"#4a4856"},"ax":27,"ay":32},"c_p2_1_slime":{"r":["...aa........................","..abba.......................",".acbbba......................","abbbbbda.....................","aebdddaea....................","aefgfgfea....................","aegfgfgea....................",".aeegeehfaaa.................","..aaaageeehiaaa..............","......aaagejihfaa............",".........aaajeeehaaa.........","............aageeehia........","..............aaagejeaaa.....",".................aajeehhaa...","...................aageeeha..",".....................aaageea.","........................ageea",".........................aaa."],"p":{"a":"#0e120a","b":"#7ab040","c":"#b8f080","d":"#4a7a28","e":"#5a3a1e","f":"#c09060","g":"#8a6034","h":"#a87c4c","i":"#a8a6b6","j":"#4a4856"},"ax":27,"ay":31},"c_p2_1_bomb":{"r":["......a......................",".....aba.....................","....aca......................","...aca.......................","..addda......................",".adeddfa.....................",".adddffa.....................","agafffaga....................","aghihihga....................","agihihiga....................",".aggiggchaaa.................","..aaaaigggcjaaa..............","......aaaigkjchaa............",".........aaakgggcaaa.........","............aaigggcja........","..............aaaigkgaaa.....",".................aakggccaa...","...................aaigggca..",".....................aaaigga.","........................aigga",".........................aaa."],"p":{"a":"#0e120a","b":"#ffd23a","c":"#a87c4c","d":"#3a3640","e":"#7c7a8a","f":"#26252b","g":"#5a3a1e","h":"#c09060","i":"#8a6034","j":"#a8a6b6","k":"#4a4856"},"ax":27,"ay":34},"c_load_2_rock":{"r":["...aa..........................","..abca.........................",".abccda........................","abcccdda.......................","accdddea....aaaaaaaaaaaaaaaaa..","afddeeafaaaaghiiiiiggiiiihiiia.","afhjhjhfiiigkffffffkkfffffffffa","afjhjhjffffkfaaaaaaaaaaaaaaaaa.",".affjfffaaaaa..................","..aaaaaa......................."],"p":{"a":"#0e120a","b":"#b0aca4","c":"#8a8680","d":"#5a5650","e":"#3a3834","f":"#5a3a1e","g":"#a8a6b6","h":"#c09060","i":"#a87c4c","j":"#8a6034","k":"#4a4856"},"ax":29,"ay":21},"c_load_2_slime":{"r":["...aa..........................","..abba.........................",".acbbba........................","abbbbbda....aaaaaaaaaaaaaaaaa..","aebdddaeaaaafghhhhhffhhhhghhha.","aegigigehhhfjeeeeeejjeeeeeeeeea","aeigigieeeejeaaaaaaaaaaaaaaaaa.",".aeeieeeaaaaa..................","..aaaaaa......................."],"p":{"a":"#0e120a","b":"#7ab040","c":"#b8f080","d":"#4a7a28","e":"#5a3a1e","f":"#a8a6b6","g":"#c09060","h":"#a87c4c","i":"#8a6034","j":"#4a4856"},"ax":29,"ay":20},"c_load_2_bomb":{"r":["......a........................",".....aba.......................","....aca........................","...aca.........................","..addda........................",".adeddfa.......................",".adddffa....aaaaaaaaaaaaaaaaa..","agafffagaaaahiccccchhcccciccca.","agijijigccchkggggggkkggggggggga","agjijijggggkgaaaaaaaaaaaaaaaaa.",".aggjgggaaaaa..................","..aaaaaa......................."],"p":{"a":"#0e120a","b":"#ffd23a","c":"#a87c4c","d":"#3a3640","e":"#7c7a8a","f":"#26252b","g":"#5a3a1e","h":"#a8a6b6","i":"#c09060","j":"#8a6034","k":"#4a4856"},"ax":29,"ay":23},"c_p2_-3_none":{"r":[".a.a.a.a.....................","abacacaba....................","abcdcdcba....................","abdcdcdba....................",".abbdbba.....................","..aaadbbaa...................",".....adbbeaa.................","......aadfegaa...............","........aafbbcaa.............","..........aadbbgaaaa.........","............aadbbgeeaaaa.....","..............aadbffbgggaaa..","................aaadbbbbbgga.","...................aaaadbbbba",".......................aaaaa."],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a8a6b6","f":"#4a4856","g":"#a87c4c"},"ax":27,"ay":28},"c_mid_-5_none":{"r":[".a.a.a.a..","abacacaba.","abcdcdcba.","abdcdcdba.",".abbdbba..","..aedba...","..adba....","..adba....","..adba....","..adba....","..adba....","..afba....","..agba....","..agba....","..adba....","..adba....","..adba....","..adba....","..adba....","..adfba...","...agba...","...agba...","...adba...","....adba..","....adba..","....adbba.",".....adba.",".....adbba","......adba",".......aa."],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a87c4c","f":"#a8a6b6","g":"#4a4856"},"ax":8,"ay":43},"c_up_1_none":{"r":[".......a.a.a.a.","......abacacaba","......abcdcdcba","......abdcdcdba",".......abbdbba.","........aedba..","........adba...","........adba...",".......aedba...",".......adba....",".......afba....","......afgba....","......agba.....",".....aedba.....",".....addba.....",".....adba......","....aedba......","....adba.......","...affba.......","...aggba.......","..aedba........","..adba.........","..adba.........",".acdba.........","aedba..........","addba..........","adba...........",".aa............"],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a87c4c","f":"#a8a6b6","g":"#4a4856"},"ax":2,"ay":41},"c_up_0_none":{"r":[".......a.a.a.a.","......abacacaba","......abcdcdcba","......abdcdcdba",".......abbdbba.","........addba..","........adba...",".......aedba...",".......adba....","......afdba....","......agdba....","......agba.....",".....aedba.....",".....adba......","....aedba......","....addba......","....adba.......","...afdba.......","...agba........","..aegba........","..addba........","..adba.........",".aedba.........",".adba..........","aedba..........","addba..........","adba...........",".aa............"],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a87c4c","f":"#a8a6b6","g":"#4a4856"},"ax":2,"ay":41},"c_ov_6_none":{"r":[".............a.a.a.a.","............abacacaba","............abcdcdcba","............abdcdcdba",".............abbdbba.","..............acdba..","..............adba...","..............adba...",".............aedba...",".............adba....",".............adba....","............afdba....","...........afgba.....","..........aegba......",".........aeddba......","........aeddba.......",".......aeddba........","......affdba.........","....aaeggba..........","..aaeeddba...........",".aecdddba............","aedddbaa.............","addbaa...............",".aaa................."],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a87c4c","f":"#a8a6b6","g":"#4a4856"},"ax":2,"ay":37},"c_up_-3_none":{"r":[".......a.a.a.a.","......abacacaba","......abcdcdcba","......abdcdcdba",".......abbdbba.",".......aeddba..",".......addba...","......aedba....","......afba.....",".....afgba.....",".....agba......","....aedba......","....adba.......","...aedba.......","...adba........","..aedba........","..adba.........","..afba.........",".aegba.........",".adgba.........",".adba..........",".adba..........","acdba..........","addba..........","adba...........","adba...........","adba...........",".aa............"],"p":{"a":"#0e120a","b":"#5a3a1e","c":"#c09060","d":"#8a6034","e":"#a87c4c","f":"#a8a6b6","g":"#4a4856"},"ax":2,"ay":41},"w_sit":{"r":["....aaaaaa....","...abbbbbba...","aaabbbbbbbbbaa","accbdbbbdbbcca","..aabcccbbaa..","....aabbaa....","....eeeeee....","..abefeefeba..",".ab.aefeea.ba.","abc.affffa.cba","abc.affffa.cba",".a..abaaba..a.","....abaaba....","....aa..aa...."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":7,"ay":14},"w_sit2":{"r":["....aaaaaa....","...abbbbbba...","aaabbbbbbbbbaa","accbdbbbdbbcca","..aabcccbbaa..","....aabbaa....","....eeeeee....","..abefeefeba..",".ab.aefeea.ba.","abc.affffa.cba","abc.affffa.cba",".a..abaaba..a.","...aba..aba...","...aa....aa..."],"p":{"a":"#0e120a","b":"#6e9a3a","c":"#46682a","d":"#ffd23a","e":"#5a4030","f":"#3a2a1e"},"ax":7,"ay":14}},"TIPS":{"ov":[29,-67],"up":[17,-75],"mid":[-7,-79],"p1":[-37,-63],"p2":[-45,-49],"load":[-49,-27]},"HANDS":{"l0":[11,-11],"l1":[11,-11],"l2":[9,-9],"fall":[7,-9],"cheer":[11,-17]},"POST":[[-82,0],[-66,0]],"SEAT":[[30,-20],[6,-78]]}, F = D.F, TIPS = D.TIPS, HANDS = D.HANDS;
  const CV = {}, CW = {};
  const cv = k => CV[k] || (CV[k] = gCanvas(fromRows(F[k].r), F[k].p));
  const cw = k => { if (CW[k]) return CW[k]; const s = cv(k), [c, g] = mkCanvas(s.width, s.height); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return (CW[k] = c); };
  function put(k, x, y, flip, white, alpha) {
    const f = F[k], s = white ? cw(k) : cv(k), X = Math.round(x / 2) * 2, Y = Math.round(y / 2) * 2;
    ctx.save(); if (alpha != null && alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); ctx.drawImage(s, -f.ax * 2, -f.ay * 2); } else ctx.drawImage(s, X - f.ax * 2, Y - f.ay * 2);
    ctx.restore();
  }
  const POST = D.POST; // 사수 자리 (뒤 · 앞) — 투석기 기준점에서
  const PULL = 1.0, HOLD = 0.55, FLY = 1.0;
  const sn = v => Math.round(v / 2) * 2;
  // 놓일 자리: 플레이어 반대쪽 옆 벽 가장자리 — 받침 전체 · 사수 자리가 물(연못 · 저수지) · 구조물에 걸리지 않는 곳만
  function fits(x, y, f) {
    if (typeof obsHitL !== 'function') return true;
    for (let dx = -44; dx <= 44; dx += 8) if (obsHitL(G.obs, x + dx, y - 4, 7) || obsHitL(G.obs, x + dx, y - 20, 6)) return false;
    for (const q of POST) if (obsHitL(G.obs, x + q[0] * f, y, 10)) return false;
    if (typeof ROOMSTYLE !== 'undefined' && ROOMSTYLE && ROOMSTYLE.path === 'brook' && typeof meadowCurves === 'function') { // 개울 (다리 자리 포함) 위에도 놓지 않음
      const bc = meadowCurves()[0]; if (bc) { const near = (px, py) => bc.vert ? Math.abs(px - bc.at(py)) < 34 : Math.abs(py - bc.at(px)) < 34;
        for (let dx = -52; dx <= 52; dx += 8) for (const dy of [-30, -12, 4]) if (near(x + dx, y + dy)) return false;
        for (const q of POST) if (near(x + q[0] * f, y)) return false; } }
    return x - 100 > A.x0 - 4 && x + 100 < A.x1 + 4;
  }
  function spot() {
    const P = G.player, pref = P.x > CX ? 1 : -1;
    for (const f of [pref, -pref]) for (let i = 0; i < 40; i++) {
      const x = f > 0 ? A.x0 + rand(100, 140) : A.x1 - rand(100, 140), y = i < 20 ? clamp(P.y + rand(-70, 70), A.y0 + 70, A.y1 - 40) : rand(A.y0 + 70, A.y1 - 40);
      if (fits(x, y, f)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 };
    }
    return null; // 놓을 데가 없으면 투석기 없이
  }
  function addCrew(e) {
    e.crew = [];
    for (let i = 0; i < 2; i++) { const g = makeEnemy('goblin', e.x + POST[i][0] * e.face, e.y + POST[i][1]); g.crewOf = e; g.post = i; g.face = e.face; g.rise = 0.35; e.crew.push(g); G.enemies.push(g); }
  }
  const manned = e => (e.crew || []).filter(g => !g.dead && g.crewOf === e && g.atPost);
  function update(e, dt) {
    e.x = e.px; e.y = e.py; e.vx = e.vy = 0;
    e.ph = e.ph || 'idle'; e.pt = (e.pt || 0) + dt;
    const m = manned(e).length;
    if (e.ph === 'idle') { e.wait = (e.wait == null ? rand(0.8, 1.6) : e.wait) - dt;
      if (m > 0 && e.wait <= 0 && (G.player.x - e.x) * e.face > 24) { /* 플레이어가 앞쪽에 있을 때만 */ e.ph = 'pull'; e.pt = 0; e.slow = m < 2 ? 2 : 1; e.n = (e.n || 0) + 1;
        const bomber = G.enemies.some(o => !o.dead && o.type === 'gbomber'), thrown = G.enemies.filter(o => !o.dead && o.thrownBy === e).length;
        e.ammo = bomber && e.n % 4 === 0 ? 'bomb' : e.n % 3 === 0 && thrown < 3 ? 'slime' : 'rock'; } return; } // v3.38 슬라임은 던진 것이 3마리 넘게 살아 있으면 돌로
    if ((e.ph === 'pull' || e.ph === 'hold') && m === 0) { e.ph = 'idle'; e.pt = 0; e.wait = 0.6; return; } // 사수가 없으면 장전이 풀림
    if (e.ph === 'pull') { if (e.pt >= PULL * e.slow) { e.ph = 'hold'; e.pt = 0; } return; }
    if (e.ph === 'hold') { if (e.pt >= HOLD) { e.ph = 'fire'; e.pt = 0; fire(e); } return; }
    if (e.ph === 'fire') { if (e.pt >= 0.3) { e.ph = 'rec'; e.pt = 0; } return; }
    if (e.ph === 'rec') { if (e.pt >= 0.18) { e.ph = 'cheer'; e.pt = 0; } return; }
    if (e.ph === 'cheer') { if (e.pt >= 0.47) { e.ph = 'idle'; e.pt = 0; e.wait = rand(0.9, 1.6); } return; }
  }
  function fire(e) {
    const P = G.player, tx = clamp(P.x + rand(-10, 10), A.x0 + 14, A.x1 - 14), ty = clamp(P.y + rand(-8, 8), A.y0 + 14, A.y1 - 14);
    const t = TIPS.up, x0 = e.x + t[0] * e.face, y0 = e.y + t[1], am = e.ammo, own = { catapult: e }, atk = e.atk;
    G.fx.push({ kind: 'lob', cat: am, x0, y0, gy0: e.y, x1: tx, y1: ty, h: 130, d0: 0, t: FLY, max: FLY, owner: own });
    G.tele.push({ shape: 'circle', x: tx, y: ty, r: am === 'bomb' ? 32 : am === 'slime' ? 34 : 54, t: 0, dur: FLY, owner: own, heavy: am !== 'slime', // v3.38 큰 돌은 범위 54
      onFire: tt => {
        if (am === 'bomb') { GSEMI.blast(tt.x, tt.y, tt.r, atk * 1.1, null, false); return; }
        hitShape({ shape: 'circle', x: tt.x, y: tt.y, r: tt.r }, am === 'slime' ? atk * 0.5 : atk);
        if (am === 'slime') { // v3.38 점액 웅덩이 대신 진짜 슬라임이 떨어져 싸움
          if (!e.dead || true) { const s = makeEnemy('slime', tt.x, tt.y); if (s) { s.rise = 0; s.thrownBy = e; s.squash = 0.18; G.enemies.push(s); } }
          splat(tt.x, tt.y, 12, '60,120,30'); sfx('hit'); }
        else { debris(tt.x, tt.y, 16); sfx('blast', 1.25); }
        dust(tt.x, tt.y, 8); addShake(3);
        for (let i = 0; i < 16; i++) { const a = rand(0, TAU), s = rand(40, 130); G.parts.push({ x: tt.x, y: tt.y - 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 - 60, t: rand(0.4, 0.8), c: am === 'slime' ? pick(['#62b03a', '#b8f080', '#3a7a26']) : pick(['#8a8680', '#5a5650', '#6e5a40', '#9a8a6a']), g: 260, floor: tt.y + rand(-4, 8) }); }
      } });
    for (let i = 0; i < 12; i++) G.parts.push({ x: e.x + rand(-36, 36), y: e.y - 2, vx: rand(-40, 40), vy: -rand(20, 50), t: rand(0.4, 0.7), c: pick(['#6e5a40', '#8a7a5a', '#5a4a34']), g: 60 });
    sfx('swing', 0.6); sfx('heavy', 0.7);
  }
  // 한 발 흐름에 따른 팔 · 사수 자세 (움짤 시안03과 같음)
  function pose(e) { // a: 팔 자세 · b: 팔 휨(만화 연출 — 당길 땐 살짝 버팀, 놓으면 뒤로 휘었다가 앞으로 튕기고 출렁)
    const t = e.pt || 0, ph = e.ph, s = e.slow || 1, u = t / s;
    if (ph === 'pull') { if (u < 0.15) return { c: 'l1', a: 'up', b: 0, taut: 1 }; if (u < 0.30) return { c: 'l2', a: 'p1', b: 1, taut: 1, jolt: 1 }; if (u < 0.45) return { c: 'l1', a: 'p1', b: 1, taut: 1 }; if (u < 0.60) return { c: 'l2', a: 'p2', b: 1, taut: 1, jolt: 1 }; if (u < 0.75) return { c: 'l1', a: 'p2', b: 1, taut: 1 }; return { c: 'l2', a: 'load', b: 2, taut: 1 }; }
    if (ph === 'hold') return { c: 'l2', a: 'load', b: 2, taut: 1, shiver: 1 };
    if (ph === 'fire') { const f = t < 0.035 ? ['p2', -3] : t < 0.07 ? ['mid', -5] : t < 0.12 ? ['ov', 6] : t < 0.17 ? ['up', -3] : t < 0.22 ? ['up', 1] : ['up', 0]; /* 뒤로 휘며 올라가 → 멈춤대를 지나 앞으로 확 휨 → 되튀며 출렁 */ return { c: 'fall', a: f[0], b: f[1], slack: 1, rec: t < 0.08 }; }
    if (ph === 'rec') return { c: 'l0', a: 'up', b: 0 };
    if (ph === 'cheer') return { c: 'cheer', a: 'up', b: 0, hop: Math.floor(t * 8) % 2 };
    return { c: null, a: 'up', b: 0 };
  }
  function rope(x0, y0, x1, y1, sag, taut) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag;
      ctx.fillStyle = '#0e120a'; ctx.fillRect(sn(x), sn(y) + 2, 2, 2);
      ctx.fillStyle = taut ? (i % 3 ? '#efe2bc' : '#c8b890') : (i % 3 ? '#d8c8a0' : '#a89870'); ctx.fillRect(sn(x), sn(y), 2, 2); }
  }
  const crewPos = (g, P) => { const f = g.crewOf.face, sh = P.shiver && Math.floor(time * 22) % 2 ? -2 : 0, jo = P.jolt && ((g.crewOf.pt || 0) % 0.15) < 0.05 ? -2 : 0, hp = P.hop ? -2 : 0; return [g.x + (sh + jo) * f, g.y + 2 + hp]; };
  // v3.38 큰 국자 · 큰 돌 · 진짜 슬라임 (팔 그림의 작은 국자 위에 덮어 그림 — TIPS가 국자 가운데)
  const BIG = {
    basket: { r: ["..aaaaaaaaaaa..", ".aqqqqqqqqqqqa.", "aghhhhhhhhhhhda", "ahlglllllllldda", "ahllllllllllDda", ".ahlllllllldda.", "..adllllllDda..", "...aaddddDaa...", ".....aaaaa.....", "......aka......"], p: { a: '#0e120a', q: '#2a1a10', h: '#c09060', l: '#a87c4c', d: '#8a6034', D: '#5a3a1e', g: '#d8b078', k: '#4a4856' }, ax: 7.5, ay: 8 }, // v3.39 B안: 통나무를 파낸 깊고 둥근 국자 · 아래 쇠 고리
    rock: { r: ["....aaaaa....", "..aabbbccaa..", ".abbcccccdda.", ".abccccccdda.", "abcccccccddea", "abccccccdddea", "acccccddddeea", "acdcddddeeea.", ".adddddeeea..", "..aaeeeeaa...", "....aaaa....."], p: { a: '#0e120a', b: '#b0aca4', c: '#8a8680', d: '#5a5650', e: '#3a3834' }, ax: 6.5, ay: 11 } };
  const BIGC = {}, BIGW = {};
  function bigPut(k, x, y, flip, white, alpha) { const f = BIG[k], s = white ? (BIGW[k] || (BIGW[k] = (() => { const c0 = BIGC[k] || (BIGC[k] = gCanvas(fromRows(f.r), f.p)), [c, g] = mkCanvas(c0.width, c0.height); g.drawImage(c0, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return c; })())) : (BIGC[k] || (BIGC[k] = gCanvas(fromRows(f.r), f.p)));
    const X = Math.round((x - f.ax * 2) / 2) * 2, Y = Math.round((y - f.ay * 2) / 2) * 2; ctx.save(); if (alpha != null && alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(X + s.width, Y); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); } else ctx.drawImage(s, X, Y); ctx.restore(); }
  const FAKE = { type: 'slime', x: 0, y: 0, z: 0, flash: 0, state: 'chase', squash: 0, t: 0, holdMax: 1, face: 1, walk: 0, hp: 1, maxHp: 1 };
  function slimeAt(x, gy, z, shadow, white, al) { // 게임의 일반 슬라임 그림 그대로 (공중이면 늘어남)
    if (typeof drawSlime !== 'function') return GCAT_PUT_SLIME(x, gy - z);
    FAKE.x = x; FAKE.y = gy; FAKE.z = z; FAKE.flash = white ? 1 : 0; const ds = drawShadow;
    if (!shadow) drawShadow = () => {}; try { drawSlime(FAKE, 0, al == null ? 1 : al); } finally { drawShadow = ds; } }
  function GCAT_PUT_SLIME(x, y) { put('a_slime', x, y, false, false, 1); }
  function bigBasket(x, y, flip, white, al, am) { // x, y: 국자 바닥 가운데
    if (am === 'rock') bigPut('rock', x, y - 6, flip, white, al);
    else if (am === 'slime') slimeAt(x, y - 6, 0, false, white, al);
    else if (am === 'bomb' && typeof GSEMI !== 'undefined') GSEMI.drawBombLob({ x0: x, y0: y - 14, gy0: y - 8, x1: x + (flip ? -1 : 1), y1: y - 14, h: 0 }, 0);
    bigPut('basket', x, y + 4, flip, white, al);
  }
  function draw(e, ya, al) {
    const white = e.flash > 0, P = pose(e), rec = P.rec ? -2 : 0, X = e.px, Y = e.py + 2 + ya + rec, f = e.face, fl = f < 0;
    dshEll(ctx, X, e.py + 1, 40, 8, 0.5);
    put('c_base', X, Y, fl, white, al);
    const am = P.b > 0 && (P.a === 'p1' || P.a === 'p2' || P.a === 'load') ? (e.ammo || 'rock') : 'none';
    put('c_' + P.a + '_' + P.b + '_' + am, X, Y, fl, white, al);
    { const tp = TIPS[P.a]; if (tp) bigBasket(X + tp[0] * f, Y + tp[1] + 2, fl, white, al, am); } // v3.38 큰 국자 · 큰 돌
    // 투석기에 앉아 구경하는 고블린 둘 (아래칸 · 위칸) — 다리를 흔들다가, 쏘면 들썩 · 환호 때 깡충 (v3.38 큰 국자 다음에 그림)
    if (e.sit) for (let i = 0; i < 2; i++) { const q = D.SEAT[i], sv = e.sit[i];
      const jolt = e.ph === 'fire' && (e.pt || 0) < 0.25 ? (i ? 4 : 2) * (Math.floor(time * 30) % 2 ? 1 : -1) : 0, hop = e.ph === 'cheer' && Math.floor(time * 8 + i) % 2 ? -2 : 0;
      drawW(Math.floor(time * 2.5 + i * 1.3) % 2 ? 'w_sit2' : 'w_sit', X + q[0] * f + jolt * f, Y + q[1] + 8 + hop, fl, sv.gv, white, al); }
    // 밧줄: 사수 손 → 팔 끝
    const tip = TIPS[P.a], tx = X + tip[0] * f, ty = Y + tip[1] + 2, cr = manned(e);
    if (!white && cr.length && (P.taut || P.slack)) {
      const hands = cr.map(g => { const [gx, gy] = crewPos(g, P), h = HANDS[P.c] || HANDS.l0; return [gx + h[0] * f, gy + h[1]]; }).sort((a, b) => (a[0] - b[0]) * f);
      if (P.taut) { for (let i = 0; i < hands.length - 1; i++) rope(hands[i][0], hands[i][1], hands[i + 1][0], hands[i + 1][1], 0, 1); const h2 = hands[hands.length - 1]; rope(h2[0], h2[1], tx, ty, 0, 1); }
      else { const h2 = hands[hands.length - 1]; rope(h2[0], h2[1], tx - 2 * f, ty + 10, 6 + Math.sin(time * 60) * 3, 0); }
    }
  }
  // 사수 고블린: 자리로 가서 붙음 (플레이어가 바싹 붙으면 일반 고블린처럼 싸움)
  function updCrew(g, dt, d, a, moveTo) {
    const c = g.crewOf; if (!c || c.dead) { g.crewOf = null; g.atPost = false; return false; }
    if (d < 30) { g.atPost = false; return false; }
    const px = c.px + POST[g.post][0] * c.face, py = c.py + POST[g.post][1], dd = Math.hypot(px - g.x, py - g.y);
    if (dd > 3) { g.atPost = false; if (g.state === 'chase') moveTo(Math.atan2(py - g.y, px - g.x), g.spd * 1.6); return true; } // 자리로 달려감
    g.x = px; g.y = py; g.atPost = true; g.face = c.face; return true;
  }
  // 사수가 다 쓰러지면 근처 고블린이 와서 자리를 채움
  function recruit(e) { if (!e.armed) return; // 사수 웨이브가 오기 전에는 빈 채로
    for (let i = 0; i < 2; i++) { if (e.crew[i] && !e.crew[i].dead && e.crew[i].crewOf === e) continue;
      const g = G.enemies.filter(o => !o.dead && o.type === 'goblin' && !o.crewOf && !o.helm).sort((p, q) => Math.hypot(p.x - e.px, p.y - e.py) - Math.hypot(q.x - e.px, q.y - e.py))[0];
      if (g && Math.hypot(g.x - e.px, g.y - e.py) < 360) { g.crewOf = e; g.post = i; e.crew[i] = g; } }
  }
  // 사수 자세 그림을 그 고블린 피부색(4색)으로 — 걸을 때 몸 색과 같게
  const SKIN = ['#6e9a3a', '#46682a'], CVV = {};
  function cvv(k, gv) { if (!gv) return null; const key = k + '|' + gv; if (CVV[key]) return CVV[key];
    const pal = PAL['goblin_v' + gv], f = F[k], p2 = {}; for (const ch in f.p) p2[ch] = f.p[ch] === SKIN[0] ? pal.s : f.p[ch] === SKIN[1] ? pal.S : f.p[ch];
    return (CVV[key] = gCanvas(fromRows(f.r), p2)); }
  function drawW(k, x, y, flip, gv, white, al) { const v = white ? null : cvv(k, gv); if (!v) return put(k, x, y, flip, white, al);
    const f = F[k], X = Math.round(x / 2) * 2, Y = Math.round(y / 2) * 2; ctx.save(); if (al != null && al !== 1) ctx.globalAlpha = al;
    if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); ctx.drawImage(v, -f.ax * 2, -f.ay * 2); } else ctx.drawImage(v, X - f.ax * 2, Y - f.ay * 2); ctx.restore(); }
  function crewDraw(g, ya, al) {
    const c = g.crewOf; if (!c || c.dead || !g.atPost || g.state !== 'chase') return false;
    const P = pose(c); if (!P.c) return false;
    const [x, y] = crewPos(g, P); drawShadow(g.x, g.y + 1, 8);
    const k = 'w_' + P.c, v = g.flash > 0 ? null : cvv(k, g.gv);
    if (!v) put(k, x, y + ya, c.face < 0, g.flash > 0, al);
    else { const f = F[k], X = Math.round(x / 2) * 2, Y = Math.round((y + ya) / 2) * 2; ctx.save(); if (al != null && al !== 1) ctx.globalAlpha = al;
      if (c.face < 0) { ctx.translate(X, Y); ctx.scale(-1, 1); ctx.drawImage(v, -f.ax * 2, -f.ay * 2); } else ctx.drawImage(v, X - f.ax * 2, Y - f.ay * 2); ctx.restore(); }
    return true;
  }
  return { F, TIPS, POST, SEAT: D.SEAT, put, spot, addCrew, update, draw, updCrew, recruit, crewDraw, bigPut, slimeAt };
})();

// ---- 연결
{ const o = queueSpawn; queueSpawn = function (type, at) {
    if (type === 'gcatapult') { const c = G.enemies.find(e => !e.dead && e.type === 'gcatapult' && !e.armed); // 미리 놓인 투석기 → 사수 둘이 달려옴
      if (c) c.armed = true;
      if (c || G.catPlaced) { o.call(this, 'gcrew'); return o.call(this, 'gcrew'); } // 미리 놓인 투석기를 부숴 뒀으면 일반 고블린 둘만
      if (!at) at = GCAT.spot(); if (!at) { o.call(this, 'goblin'); return o.call(this, 'goblin'); } }
    return o.call(this, type, at); }; }
let GCAT_PLACE = false;
{ const o = makeEnemy; makeEnemy = function (type, x, y) {
    if (type === 'gcrew') { // 사수: 일반 고블린 + 빈 자리 배정
      const g = o.call(this, 'goblin', x, y), c = G.enemies.find(e => !e.dead && e.type === 'gcatapult' && e.armed);
      if (g && c) { c.crew = c.crew || []; const i = [0, 1].find(k => !c.crew[k] || c.crew[k].dead || c.crew[k].crewOf !== c); if (i != null) { g.crewOf = c; g.post = i; c.crew[i] = g; } }
      return g; }
    const e = o.apply(this, arguments);
    if (e && e.type === 'gcatapult') { e.px = e.x; e.py = e.y; e.r = 22; e.tall = 92; e.face = e.x < CX ? 1 : -1; e.rise = 0; e.grogiMax = 0; e.recruitT = 0;
      e.sit = [{ gv: randi(0, 3) }, { gv: randi(0, 3) }]; // 앉아 있는 고블린 둘 (기능 없음 · 투석기와 같이 죽음)
      if (GCAT_PLACE) { e.crew = []; e.armed = false; } else { e.armed = true; GCAT.addCrew(e); } }
    return e; }; }
{ const o = killEnemy; killEnemy = function (e, silent) {
    if (e && e.type === 'gcatapult') { const r = o.apply(this, arguments); // 부서진 채 남음 (날아가는 시체 대신)
      if (G.corpses) G.corpses = G.corpses.filter(c => c.e !== e);
      (G.gbroken = G.gbroken || []).push({ x: e.px, y: e.py, f: e.face }); debris(e.px, e.py - 10, 16); dust(e.px, e.py, 14); sfx('crunch', 0.7); addShake(4);
      for (const g of e.crew || []) if (g && g.crewOf === e) { g.crewOf = null; g.atPost = false; }
      if (e.sit) { const S = GCAT.SEAT; e.sit.forEach((sv, i) => { // 앉아 있던 고블린도 같이 날아가 쓰러짐
        const g = makeEnemy('goblin', e.px + S[i][0] * e.face, e.py + 2); g.gv = sv.gv; g.dead = true; g.rise = 0; burst(g.x, g.y - 8, bloodOf(g), 8);
        const ka = rand(-2.4, -0.7), sp = rand(120, 180);
        (G.corpses = G.corpses || []).push({ e: g, keep: false, t: 0.7, max: 0.7, vx: Math.cos(ka) * sp * (Math.random() < 0.5 ? 1 : -1), vy: Math.sin(ka) * sp * 0.4, z: -S[i][1] - 8, vz: 140, rot: 0, vr: rand(9, 13) * (Math.random() < 0.5 ? 1 : -1), bounced: false }); });
        e.sit = null; }
      return r; }
    return o.apply(this, arguments); }; }
// 점액 웅덩이: 밟으면 느려짐 (재 구름과 같은 둔화)
{ const o = updateAshClouds; updateAshClouds = function (dt) { o.apply(this, arguments); const P = G.player; if (!G.gpuds) return;
    for (const p of G.gpuds) { p.t -= dt; if (Math.hypot(P.x - p.x, (P.y - p.y) * 2.4) < 30) P.ashSlow = true; }
    G.gpuds = G.gpuds.filter(p => p.t > 0); }; }
{ const o = drawAshClouds; drawAshClouds = function () {
    if (G.gbroken) for (const b of G.gbroken) GCAT.put('c_broken', b.x, b.y + 2, b.f < 0, false, 1);
    if (G.gpuds) for (const p of G.gpuds) GCAT.put('a_puddle', p.x, p.y, false, false, Math.min(1, p.t / 0.6));
    return o.apply(this, arguments); }; }
{ const o = drawLob; drawLob = function (f, p) { if (!f.cat) return o.apply(this, arguments);
    const k = p, x = f.x0 + (f.x1 - f.x0) * k, gy = f.gy0 + (f.y1 - f.gy0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h;
    dshEll(ctx, x, gy, 6, 2, 0.5);
    if (f.cat === 'bomb') GSEMI.drawBombLob({ x0: f.x0, y0: f.y0, gy0: f.gy0, x1: f.x1, y1: f.y1, h: f.h }, p);
    else if (f.cat === 'slime') GCAT.slimeAt(x, gy, Math.max(0, gy - y - 4), true, false, 1);
    else GCAT.bigPut('rock', x, y + 11, false, false, 1); }; } // v3.38 큰 돌 · 진짜 슬라임
// 방을 나가면 부서진 투석기 · 웅덩이 정리
{ const o = enterRoom; enterRoom = function (R) { G.gbroken = []; G.gpuds = []; G.catPlaced = false; G.catCrewDone = false; const r = o.apply(this, arguments);
    if (G.stage === 1 && R && !R.cleared && R.type === 'combat' && R.waves && R.waves.some(w => w.some(q => q[0] === 'gcatapult'))) { // 처음부터 빈 투석기가 놓여 있음
      const pt = GCAT.spot(); G.catPlaced = true; if (pt) { GCAT_PLACE = true; try { const c = makeEnemy('gcatapult', pt.x, pt.y); G.enemies.push(c); } finally { GCAT_PLACE = false; } } }
    return r; }; }
// 투석기 방 첫 페이즈: 투석기 뒤쪽에 사수 고블린 둘이 무조건 소환됨 (첫 웨이브에 든 투석기 몫은 이걸로 대신)
{ const o = spawnWave; spawnWave = function (w) {
    const c = G.catPlaced && !G.catCrewDone && G.enemies.find(e => !e.dead && e.type === 'gcatapult');
    if (c) { G.catCrewDone = true; c.armed = true;
      for (let i = 0; i < 2; i++) queueSpawn('gcrew', { x: clamp(c.px + GCAT.POST[i][0] * c.face + rand(-6, 6), A.x0 + 10, A.x1 - 10), y: clamp(c.py + rand(-14, 14), A.y0 + 10, A.y1 - 10) });
      w = w.filter(q => q[0] !== 'gcatapult'); }
    return o.call(this, w); }; }
// 사수 말고는 다 쓰러지면 투석기는 버려져 부서짐 (방 클리어를 막지 않게)
{ const o = updateRoom; updateRoom = function (dt) {
    const cats = G.enemies.filter(e => !e.dead && e.type === 'gcatapult');
    if (cats.length && G.spawning === 0) {
      const others = G.enemies.filter(e => !e.dead && e.type !== 'gcatapult' && !(e.crewOf && !e.crewOf.dead));
      const R = G.dun && G.dun.cur, rs = G.rs, last = R && R.waves && rs && rs.wave >= R.waves.length - 1;
      if (last && !others.length && cats.every(c => c.armed && (!c.crew || c.crew.every(g => !g || g.dead || g.crewOf !== c)))) for (const c of cats) { c.hp = 0; killEnemy(c, true); }
    }
    for (const c of cats) { c.recruitT -= dt; if (c.recruitT <= 0) { c.recruitT = 1.2; GCAT.recruit(c); } }
    return o.apply(this, arguments); }; }
// 웨이브: 1장 6 · 7등급 방에 한 대씩 (7등급은 폭탄병과 같은 웨이브 — 폭탄을 실어 쏨)
PHASES_MEADOW[6][0].push(['gcatapult', 1]); PHASES_MEADOW[7][1].push(['gcatapult', 1]);
