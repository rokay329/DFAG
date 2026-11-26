// 61_gsemi.js — v3.30 1장 준엘리트 2종: 점액 라이더 · 고블린 폭탄병
//  점액 라이더: 붉은 슬라임에 올라탄 고블린 (뿔 투구 · 붉은 천 단 긴 창) — 깡충 이동 · 찌르기 · 휘두르기(원형) · 돌진 연속 찌르기
//              쓰러지면 슬라임만 터지고 고블린이 굴러떨어져 일반 고블린(투구 · 창 그대로)으로 계속 싸움 — 내린 고블린은 돌진 연속 찌르기를 하지 않음
//  고블린 폭탄병: 이마 고글 · 등 뒤 가죽 자루 — 거리 두고 폭탄 하나 / 두 개 연속(탄착 두 곳) · 체력 30% 아래면 빠르게 달라붙어 자폭
//              폭발은 주변 몬스터도 다치게 함 (오폭) · 자폭 심지가 다 타기 전에 잡으면 터지지 않음
const GSEMI = (() => {
  const F = {"r_idle":{"r":[".a...................","abaa.................",".acba................",".abca....a......a....","..aada..aea....aea...",".afggdaaha......aha..",".afggaiaeaaaaaaaaea..","..afgaadaebccbbbea...",".afagaaadjjjjjjjjkaa.","..aafaallimkkkmkklla.","....a...aadlllkkaa...","..........adkkaa.....","..........nninnn.....",".........annndnnna...","........aknonndnla...",".......ak.pppppikka..","..........pqqqrpda...",".........pqqqqqrpda..","........pqssqqqqrpia.",".......pqstuvqquvrpda",".......pqwtvvtqvvrpa.","......pqqttttqqqqrrp.","......prrrxxxrrrryyp.","......prrrrrrrrrryyp.","......pppzpzpzpzpzpp."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#8a6034","e":"#e8dcc0","f":"#7a2428","g":"#a83a34","h":"#c8b898","i":"#6a4a28","j":"#3a3640","k":"#6e9a3a","l":"#46682a","m":"#ffd23a","n":"#5a4030","o":"#3a2a1e","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":13,"ay":25},"r_crouch":{"r":[".a...................","abaa.................",".acba................",".abca....a......a....","..aada..aea....aea...",".afgghaaia......aia..",".afggadaeaaaaaaaaea..","..afgaadaebccbbbea...",".afagaaahjjjjjjjjkaa.","..aafaalldmkkkmkklla.","....a...aadlllkkaa...","..........ahkkaa.....","..........nndnnn.....",".........annndnnna...","........akoooohola...",".......akopppppdkka..","........opqqppppdo...",".......opqrstppstho..",".......opurttrpttvda.","......opprrrrppppvvda","......ovvvwwwvvvvxxo.","......ovvvvvvvvvvxxo.","......oooyoyoyoyoyoo."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#8a6034","e":"#e8dcc0","f":"#7a2428","g":"#a83a34","h":"#6a4a28","i":"#c8b898","j":"#3a3640","k":"#6e9a3a","l":"#46682a","m":"#ffd23a","n":"#5a4030","o":"#1a0806","p":"#c8483a","q":"#f4a08a","r":"#6a1a18","s":"#ffffff","t":"#0a0a0a","u":"#8a2a24","v":"#8a2622","w":"#4a1210","x":"#7a201c","y":"#140605"},"ax":13,"ay":23},"r_air":{"r":[".a...................","abaa.................",".acba................",".abca....a......a....","..aada..aea....aea...",".afgghaaia......aia..",".afggahaeaaaaaaaaea..","..afgaadaebccbbbea...",".afagaaahjjjjjjjjkaa.","..aafaallhmkkkmkklla.","....a...aadlllkkaa...","..........ahkkaa.....","..........nnhnnn.....",".........annndnnna...","........aknonnhnla...",".......ak.ppppphkka..","..........pqqqrpda...",".........pqqqqqrpha..","........pqssqqqqrpha.",".......pqstuvqquvrpda",".......pqwtvvtqvvrpa.","......pqqttttqqqqrrp.","......pqqttttqqqqrrp.","......prrrxxxrrrryyp.","......prrrrrrrrrryyp.","......pppzpzpzpzpzpp."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#6a4a28","e":"#e8dcc0","f":"#7a2428","g":"#a83a34","h":"#8a6034","i":"#c8b898","j":"#3a3640","k":"#6e9a3a","l":"#46682a","m":"#ffd23a","n":"#5a4030","o":"#3a2a1e","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":13,"ay":26},"r_ready":{"r":[".............a......a........","............aba....aba.......","...........aca......aca......","...........abaaaaaaaaba......","............abdeedddba.......","..........aaaffffffffgaa.....","..........ahhgigggigghha.....","............aaghhhggaa.......","..............aaggaa.....a...","aaaaaaaaaaaaaaajjjjjjaaaadaa.","kllkllkllkllkglkllkllkglkeeda","aaaaaaaaaaaaahgjmnnnnhoppdaa.","............ag.anqqqqqopaa...","...............nqrrqqqosn....","..............nqrtuvqquvsn...","..............nqwtvvtqvvsn...",".............nqqttttqqqqssn..",".............nsssxxxssssyyn..",".............nssssssssssyyn..",".............nnnznznznznznn.."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#6a4a28","l":"#8a6034","m":"#3a2a1e","n":"#1a0806","o":"#7a2428","p":"#a83a34","q":"#c8483a","r":"#f4a08a","s":"#8a2622","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":20,"ay":20},"r_thrust":{"r":[".......a......a...................","......aba....aba..................",".....aca......aca.................",".....abaaaaaaaaba.................","......abdeedddba..................","....aaaffffffffgaa................","....ahhgigggigghha................","......aaghhhggaa..................","........aaggaa...j.j.j.j.j.j...a..",".aaaaaakkkkkkaaaaaaaaaaaaaaaaaadaa","allmllmllmllmlggglmllmllmllmllmeed",".aaaannnnnnnkhaaaaaaaaaaaaaaoppdaa","....anqqqqrnaa.......j.j.j.jopaa..","....nqqqqqqrn..............aoa....","...nqssqqqqqrn..............a.....","..nqstuvvqquvrn...................","..nqwtvvvtqvvrn...................",".nqqtttttqqqqrrn..................",".nrrrxxxxrrrryyn..................",".nrrrrrrrrrrryyn..................",".nnnznznnznznznn.................."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#c8c0a8","k":"#5a4030","l":"#8a6034","m":"#6a4a28","n":"#1a0806","o":"#7a2428","p":"#a83a34","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":8,"ay":21},"r_recover":{"r":["...........a......a.............","..........aba....aba............",".........aca......aca...........",".........abaaaaaaaaba...........","..........abdeedddba............","........aaaffffffffgaa..........","........ahhgigggigghha..........","..........aaghhhggaa............","............aaggaa..........a...",".aaaaaaaaaaajjjjjjaaaaaaaaaadaa.","akllkllkllkllkllkllgglkllklleeda",".aaaaaaaaaagjmjjmjhaaaaaanoodaa.",".........ag.ppppppa.....anoaa...","............pqqqrp......ana.....","...........pqqqqqrp......a......","..........pqssqqqqrp............",".........pqstuvqquvrp...........",".........pqwtvvtqvvrp...........","........pqqttttqqqqrrp..........","........prrrxxxrrrryyp..........","........prrrrrrrrrryyp..........","........pppzpzpzpzpzpp.........."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#6a4a28","l":"#8a6034","m":"#3a2a1e","n":"#7a2428","o":"#a83a34","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":15,"ay":22},"r_sw0":{"r":[".a......................","aba.....................",".aca....................","..aca...................","...ada..................","....aea.................",".....adaa......a........","......adfa....afa.......","......agea.....aga......","......afadaaaaaafa......",".......afbdcbbbfa.......",".....aaahhhehhhhiaa.....",".....ajjikiidkiijja.....",".......aaijjjdiaa.......",".........aaiiaea........",".........lllllldaa......","........allllllliia.....",".......ailmllmlaaea.....","......ai.nnnnnn..ada....",".........nooopn...ada...","........nooooopn...aea..",".......noqqoooopn...ada.","......noqrstoostpn...ada","......nourttrottpn....a.",".....noorrrrooooppn.....",".....npppvvvppppwwn.....",".....nppppppppppwwn.....",".....nnnxnxnxnxnxnn....."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#8a6034","e":"#6a4a28","f":"#e8dcc0","g":"#c8b898","h":"#3a3640","i":"#6e9a3a","j":"#46682a","k":"#ffd23a","l":"#5a4030","m":"#3a2a1e","n":"#1a0806","o":"#c8483a","p":"#8a2622","q":"#f4a08a","r":"#6a1a18","s":"#ffffff","t":"#0a0a0a","u":"#8a2a24","v":"#4a1210","w":"#7a201c","x":"#140605"},"ax":12,"ay":28},"r_sw1":{"r":["................a......a....................","...............aba....aba...................","..............aca......aca..................","..............abaaaaaaaaba..................","...............abdeedddba...................",".............aaaffffffffgaa.................",".............ahhgigggigghha.................",".............ajjkghhhggaa...................","..............aaajjkjaaaa...................",".................lllljkjjaaaa...............","................alllllllggjjkaaaa...........","mn.............aglollolaaaaaajjkjaaaa.......","mn............ag.pppppp......aaaajkjjaaaaaa.","mn...............pqqqrp..........aaaakjjeeda","mmn.............pqqqqqrp............nmmaaaa.",".mmn...........pqssqqqqrp..........nmm......","..mmnn........pqstuvqquvrp........nnm.......","....mmmn......pqwtvvtqvvrp......nnm.........","......mmmn.n.pqqttttqqqqrrp.nnmnm...........","..........mmnmmnrnxnnrnnmnnmm...............",".............prrmmmmmmmryyp.................",".............pppzpzpzpzpzpp................."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#8a6034","k":"#6a4a28","l":"#5a4030","m":"#f0e8d0","n":"#c8c0a8","o":"#3a2a1e","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":20,"ay":22},"r_sw2":{"r":["................a......a................","...............aba....aba...............","..............aca......aca..............","..............abdaaaaaaaba..............","...............abdefgggba...............",".............aaahhhdhhhhiaa.............",".............ajjikiideiijja.............","...............aaijjjidaa...............",".................aaiiaadea........lmm...",".................nnnnnnaada........lmm..","................annnnnnniadaa.......lmm.","ml.............ainonnonaa.aeda.......lm.","ml............ai.pppppp....aadaa.....lm.","ml...............pqqqrp......aeda....lm.",".ml.............pqqqqqrp......aadaa.lm..",".mm............pqssqqqqrp.......aedllm..","...ml.........pqstuvqquvrp.......alma...","....mmml......pqwtvvtqvvrp.....l.lmafa..",".......mml.l.pqqttttqqqqrrp.l.lmm...afa.",".........mmmlmlmlxlxlrlmlmlmmm.......aga",".............prrmmmmrmmryyp...........a.",".............pppzpzpzpzpzpp............."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#8a6034","e":"#6a4a28","f":"#a8a6b6","g":"#7c7a8a","h":"#3a3640","i":"#6e9a3a","j":"#46682a","k":"#ffd23a","l":"#c8c0a8","m":"#f0e8d0","n":"#5a4030","o":"#3a2a1e","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":20,"ay":22},"r_slime":{"r":["....aaaaaa....","....abbbca....","...abbbbbca...","..abddbbbbca..",".abdefgbbfgca.",".abheggebggca.","abbeeeebbbbcca","accciiiccccjja","accccccccccjja","aaakakakakakaa"],"p":{"a":"#1a0806","b":"#c8483a","c":"#8a2622","d":"#f4a08a","e":"#6a1a18","f":"#ffffff","g":"#0a0a0a","h":"#8a2a24","i":"#4a1210","j":"#7a201c","k":"#140605"},"ax":7,"ay":10},"b_idle":{"r":[".....a.aaaaaa........","...aabacddddca.......","..aaaecfceecfceaa.a..",".abaggdhdddhddggaaia.",".ajkaaadgggddaa.alha.","aeeeeeeaaddaa...abala","ammnmmmooooob..ama.a.","apmmmmaoooopooajjja..","apmmmadoqobqodjrjjka.","apppadpaopooaajcjkka.",".aaaagaaboqoaajjkkka.","....aa.aqqqqaaakkka..","......aaga.agaaaaa...","......aaaa.aaaa......"],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#5a3a1e","f":"#9ae0d8","g":"#46682a","h":"#ffd23a","i":"#fff3c0","j":"#3a3640","k":"#26252b","l":"#ff9a40","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#6a4a28","q":"#3a2a1e","r":"#8a889a"},"ax":10,"ay":14},"b_wind":{"r":[".....a.aaaaaa.a..","...aabacddddcaea.","..aaafcgcffcghiaa",".abajjdidddidbjha",".aklaaadjjjdmaaa.","affffffaaddkkka..","ammnmmmoookpkkla.","aqmmmmaoodkckllda","aqmmmmaorokkllla.","aqqqqqqaoqollla..",".aaaaaaaboroaa...",".......arrrra....","......aaja.ajaa..","......aaaa.aaaa.."],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#fff3c0","f":"#5a3a1e","g":"#9ae0d8","h":"#ff9a40","i":"#ffd23a","j":"#46682a","k":"#3a3640","l":"#26252b","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#8a889a","q":"#6a4a28","r":"#3a2a1e"},"ax":10,"ay":14},"b_throw":{"r":[".....................a..","....................aba.","...................acda.","...................aeaca","..................afa.a.",".....a.aaaaaa....aggga..","...aaeahiiiiha..agjggka.","..aaalhmhllhmhlaaghgkka.",".aeannidiiidiinnaggkkka.",".agkaaainnniiaaa.akkka..","allllllaaiiaa.ana.aaa...","affofffpppppe.aia.......","aqffffappppqppaia.......","aqfffaiprperpana........","aqqqaiqapqppa.a.........",".aaaanaaeprpa...........","....aa.arrrra...........","......aana.anaa.........","......aaaa.aaaa........."],"p":{"a":"#0e120a","b":"#fff3c0","c":"#ff9a40","d":"#ffd23a","e":"#a87c4c","f":"#8a6034","g":"#3a3640","h":"#55535f","i":"#6e9a3a","j":"#8a889a","k":"#26252b","l":"#5a3a1e","m":"#9ae0d8","n":"#46682a","o":"#d8b860","p":"#5a4030","q":"#6a4a28","r":"#3a2a1e"},"ax":10,"ay":19},"b_rush0":{"r":["......a.aaaaaa.a..","....aabacddddcaea.","...aaafcgcffcghiaa","..abajjdidddidbjha","..aklaaadjjjdmaaa.",".affffffaaddkkka..","ammnmmmoookpkkla..","aqmmmmaoodkckllda.","aqmmmmaorokkllla..","aqqqqqqaoqollla...",".aaaaaaaboroaa....",".......arrrra.....","......aaja.ajaa...","......aaaa.aaaa..."],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#fff3c0","f":"#5a3a1e","g":"#9ae0d8","h":"#ff9a40","i":"#ffd23a","j":"#46682a","k":"#3a3640","l":"#26252b","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#8a889a","q":"#6a4a28","r":"#3a2a1e"},"ax":10,"ay":14},"b_rush1":{"r":["......a.aaaaaa.a..","....aabacddddcaea.","...aaafcgcffcghiaa","..abajjdidddidbjha","..aklaaadjjjdmaaa.",".affffffaaddkkka..","ammnmmmoookpkkla..","aqmmmmaoodkckllda.","aqmmmmaorokkllla..","aqqqqqqaoqollla...",".aaaaaaaboroaa....",".......arrrra.....","......aaja.ajaa...","......aaaa.aaaa..."],"p":{"a":"#0e120a","b":"#cf683f","c":"#a2524a","d":"#af7936","e":"#ffaa7f","f":"#a44426","g":"#c79f8c","h":"#ff7939","i":"#ff9836","j":"#995d2d","k":"#934239","l":"#88382d","m":"#bf5932","n":"#ea894a","o":"#a44730","p":"#bf6f6a","q":"#ad4d2c","r":"#933b26"},"ax":10,"ay":14},"bomb0":{"r":[".....a..","....aba.","...acda.","...aeaca","..afa.a.",".aggga..","aghggia.","agjgiia.","aggiiia.",".aiiia..","..aaa..."],"p":{"a":"#0e120a","b":"#fff3c0","c":"#ff9a40","d":"#ffd23a","e":"#a87c4c","f":"#8a6034","g":"#3a3640","h":"#8a889a","i":"#26252b","j":"#55535f"},"ax":3,"ay":10},"bomb1":{"r":[".....aa..","....abca.","...adbada","...aeada.","..afa.a..",".aggga...","aghggia..","agjgiia..","aggiiia..",".aiiia...","..aaa...."],"p":{"a":"#0e120a","b":"#ffd23a","c":"#fff3c0","d":"#ff9a40","e":"#a87c4c","f":"#8a6034","g":"#3a3640","h":"#8a889a","i":"#26252b","j":"#55535f"},"ax":3,"ay":10},"bs0":{"r":[".abababa.","aacccccaa","bccdddccb","acdddddca","bccdddccb","aacccccaa",".abababa."],"p":{"a":"#ff7a20","b":"#c83018","c":"#ffd23a","d":"#fff3c0"},"ax":4,"ay":3},"bb0":{"r":[".....ababa.....","...aaaaaaaaa...",".abacccccccaba.","aaacccccccccaaa","bacccdddddcccab","aaccdddddddccaa","baccdddddddccab","aaccdddddddccaa","bacccdddddcccab","aaacccccccccaaa",".abacccccccaba.","...aaaaaaaaa...",".....ababa....."],"p":{"a":"#ff7a20","b":"#c83018","c":"#ffd23a","d":"#fff3c0"},"ax":7,"ay":6},"bs1":{"r":[".....a...................","................a........",".........................","........bcbcbcbcb........","......ccccccccccccc......",".....cbcaaaaaaaaacbc....a","....cccaaaaaaaaaaaccc....",".a.cbcaaaadddddaaaacbc...","...ccaaaadddddddaaaacc...","...cbaaadddddddddaaabc...","...ccaaadddddddddaaacc...","...cbaaadddddddddaaabc...","...ccaaaadddddddaaaacc...","...cbcaaaadddddaaaacbc.a.","....cccaaaaaaaaaaaccc....","a....cbcaaaaaaaaacbc.....","......ccccccccccccc......","........bcbcbcbcb........",".........................","........a................","...................a....."],"p":{"a":"#ffd23a","b":"#c83018","c":"#ff7a20","d":"#fff3c0"},"ax":12,"ay":10},"bb1":{"r":[".........a.............a.............",".....................................",".............bcbcbcbcbcb.............","..........ccccccccccccccccc..........",".........bcbcbcbcbcbcbcbcbcb.........",".......cccccccaaaaaaaaaccccccc.......","......cbcbcbaaaaaaaaaaaaabcbcbc......",".....cccccaaaaaaaaaaaaaaaaaccccc....a","....cbcbcaaaaaaaaaaaaaaaaaaacbcbc....","....ccccaaaaaaadddddddaaaaaaacccc....",".a.bcbcbaaaaadddddddddddaaaaabcbcb...","...ccccaaaaadddddddddddddaaaaacccc...","...bcbcaaaaadddddddddddddaaaaacbcb...","...ccccaaaadddddddddddddddaaaacccc...","...bcbcaaaadddddddddddddddaaaacbcb...","...ccccaaaadddddddddddddddaaaacccc...","...bcbcaaaaadddddddddddddaaaaacbcb...","...ccccaaaaadddddddddddddaaaaacccc...","...bcbcbaaaaadddddddddddaaaaabcbcb.a.","....ccccaaaaaaadddddddaaaaaaacccc....","....cbcbcaaaaaaaaaaaaaaaaaaacbcbc....","a....cccccaaaaaaaaaaaaaaaaaccccc.....","......cbcbcbaaaaaaaaaaaaabcbcbc......",".......cccccccaaaaaaaaaccccccc.......",".........bcbcbcbcbcbcbcbcbcb.........","..........ccccccccccccccccc..........",".............bcbcbcbcbcb.............",".....................................",".............a.............a........."],"p":{"a":"#ffd23a","b":"#c83018","c":"#ff7a20","d":"#fff3c0"},"ax":18,"ay":14},"bs2":{"r":[".......a.......................","...................a...........","............bbbbbbb............",".........cbcbcbcbcbcbc.........",".......bbbbbbbbbbbbbbbbb.......","......bcbcbaaaaaaaaabcbcb......",".....bbbbaaaaaaaaaaaaabbbb....a","....bcbcaaaaaadedaaaaaacbcb....",".a..bbbaaaadededededaaaabbb....","...cbcbaaadedededededaaabcbc...","...bbbaaaaedededededeaaaabbb...","...cbcaaaededededededeaaacbc...","...bbbaaadededededededaaabbb...","...cbcaaaededededededeaaacbc...","...bbbaaaaedededededeaaaabbb...","...cbcbaaadedededededaaabcbc...","....bbbaaaadededededaaaabbb..a.","....bcbcaaaaaadedaaaaaacbcb....","a....bbbbaaaaaaaaaaaaabbbb.....","......bcbcbaaaaaaaaabcbcb......",".......bbbbbbbbbbbbbbbbb.......",".........cbcbcbcbcbcbc.........","............bbbbbbb............","...........a...................",".......................a......."],"p":{"a":"#ffd23a","b":"#ff7a20","c":"#c83018","d":"#ff9a40","e":"#3a3640"},"ax":15,"ay":12},"bb2":{"r":["..........a..................a...............",".............................................","................bcbcbcbcbcbcb................",".............bbbbbbbbbbbbbbbbbbb.............","...........cbcbcbcbcbcbcbcbcbcbcbc...........",".........bbbbbbbbbbbbbbbbbbbbbbbbbbb.........","........bcbcbcbcbcaaaaaaaaacbcbcbcbcb........",".......bbbbbbbbaaaaaaaaaaaaaaabbbbbbbb.......","......bcbcbcbaaaaaaaaaaaaaaaaaaabcbcbcb......",".....bbbbbbaaaaaaaaaaaaaaaaaaaaaaabbbbbb....a","....bcbcbcaaaaaaaaadedededaaaaaaaaacbcbcb....","...bbbbbbaaaaaaaaedededededeaaaaaaaabbbbbb...","...cbcbcbaaaaaadedededededededaaaaaabcbcbc...","a.bbbbbbaaaaaadededededededededaaaaaabbbbbb..","..bcbcbcaaaaadedededededededededaaaaacbcbcb..","..bbbbbaaaaaaedededededededededeaaaaaabbbbb..","..bcbcbaaaaaededededededededededeaaaaabcbcb..","..bbbbbaaaaadededededededededededaaaaabbbbb..","..bcbcbaaaaaededededededededededeaaaaabcbcb..","..bbbbbaaaaadededededededededededaaaaabbbbb..","..bcbcbaaaaaededededededededededeaaaaabcbcb..","..bbbbbaaaaaaedededededededededeaaaaaabbbbb..","..bcbcbcaaaaadedededededededededaaaaacbcbcb..","..bbbbbbaaaaaadededededededededaaaaaabbbbbb.a","...cbcbcbaaaaaadedededededededaaaaaabcbcbc...","...bbbbbbaaaaaaaaedededededeaaaaaaaabbbbbb...","....bcbcbcaaaaaaaaadedededaaaaaaaaacbcbcb....","a....bbbbbbaaaaaaaaaaaaaaaaaaaaaaabbbbbb.....","......bcbcbcbaaaaaaaaaaaaaaaaaaabcbcbcb......",".......bbbbbbbbaaaaaaaaaaaaaaabbbbbbbb.......","........bcbcbcbcbcaaaaaaaaacbcbcbcbcb........",".........bbbbbbbbbbbbbbbbbbbbbbbbbbb.........","...........cbcbcbcbcbcbcbcbcbcbcbc...........",".............bbbbbbbbbbbbbbbbbbb.............","................bcbcbcbcbcbcb................",".............................................","...............a..................a.........."],"p":{"a":"#ffd23a","b":"#ff7a20","c":"#c83018","d":"#3a3640","e":"#ff9a40"},"ax":22,"ay":18},"bs3":{"r":["............a.b............",".......b.b.a.b.b.a.b.......","......b.b.a.b.b.a.b.b......",".....b.b.a.b.b.a.b.b.a.....","....b.b.a.b.....b.b.a.b....","...b.b.a...........a.b.b...","..b.b.a.............b.b.a..",".b.b.a...............b.a.b.","b.b.a.................a.b.b",".b.a...................b.b.","b.a.b.................b.b.a",".a.b...................b.a.","a.b.b.................b.a.b",".b.b...................a.b.","b.b.a.................a.b.b",".b.a.b...............a.b.b.","..a.b.b.............a.b.b..","...b.b.a...........a.b.b...","....b.a.b.b.....b.a.b.b....",".....a.b.b.a.b.b.a.b.b.....","......b.b.a.b.b.a.b.b......",".......b.a.b.b.a.b.b.......","............b.a............"],"p":{"a":"#3a3640","b":"#55535f"},"ax":13,"ay":11},"bb3":{"r":["..................a.a.b.a.a..................","...............b.a.a.b.a.a.b.a...............","............a.b.a.a.b.a.a.b.a.a.b............",".........a.a.b.a.a.b.a.a.b.a.a.b.a.a.........","........a.a.b.a.a...........a.b.a.a.b........",".......a.a.b.a.................a.a.b.a.......","......a.a.b.a...................a.b.a.a......",".....a.a.b.........................a.a.b.....","....a.a.b...........................a.b.a....","...a.a.b.............................b.a.a...","..a.a.b...............................a.a.b..",".a.a.b.................................a.b.a.","..a.b...................................b.a..",".a.b.a.................................b.a.a.","a.b.a...................................a.a.b",".b.a.....................................a.b.","b.a.a...................................a.b.a",".a.a.....................................b.a.","a.a.......................................a.a",".a.b.....................................a.a.","a.b.a...................................a.a.b",".b.a.....................................a.b.","b.a.a...................................a.b.a",".a.a.b.................................a.b.a.","..a.b...................................b.a..",".a.b.a.................................b.a.a.","..b.a.a...............................b.a.a..","...a.a.b.............................b.a.a...","....a.b.a...........................b.a.a....",".....b.a.a.........................b.a.a.....","......a.a.b.a...................a.b.a.a......",".......a.b.a.a.................a.b.a.a.......","........b.a.a.b.a...........a.a.b.a.a........",".........a.a.b.a.a.b.a.a.b.a.a.b.a.a.........","............b.a.a.b.a.a.b.a.a.b.a............","...............a.b.a.a.b.a.a.b...............","..................a.a.b.a.a.................."],"p":{"a":"#55535f","b":"#3a3640"},"ax":22,"ay":18},"f_helm":{"r":["..a......a..",".aba....aba.","aca......aca","aba......aba",".abdeedddba.","..ffffffff.."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640"},"ax":-1,"ay":3},"f_spear":{"r":[".a..................","abaa................",".acba...............",".abca...............","..aada..............",".aeffda.............",".aeffag.............","..aef..d............",".aeaf...d...........","..aaea...g..........","....a.....d.........","...........d........","............g.......",".............d......","..............d.....","..............ag....","................da..","................ada.",".................aga","..................a."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#8a6034","e":"#7a2428","f":"#a83a34","g":"#6a4a28"},"ax":4,"ay":5},"g_ready":{"r":[".............a......a........","............aba....aba.......","...........aca......aca......","...........abaaaaaaaaba......","............abdeedddba.......","..........aaaffffffffgaa.....","..........ahhgigggigghha.....","............aaghhhggaa.......","..............aaggaa.........","...............jjjjjj....a...",".aaaaaaaaaaaaaajjjjjjjaaadaa.","aklkklkklkklkklkklkklkglkeeda",".aaaaaaaaaaaagaajmjjahnoodaa.","............ah.ajjmjaanoaa...","............aa.ammmmaana.....","..............aaha.ahaa......","..............aaaa.aaaa......"],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#8a6034","l":"#6a4a28","m":"#3a2a1e","n":"#7a2428","o":"#a83a34"},"ax":18,"ay":17},"g_thrust":{"r":[".......a......a....................","......aba....aba...................",".....aca......aca..................",".....abaaaaaaaaba..................","......abdeedddba...................","....aaaffffffffgaa.................","....ahhgigggigghha.................","......aaghhhggaa...................","........aaggaa.....................",".......jjjjjj....k.k.k.k.k.k...a...",".aaaaaajjjjjjjaaaaaaaaaaaaaaaaadaa.","allmllmllmllmlggglmllmllmllmllmeeda",".aaaagaajnjjahaaaaaaaaaaaaaaoppdaa.","....ah.ajjnjaa.......k.k.k.kopaa...","....aa.annnna..............aoa.....","......aaha.ahaa.............a......","......aaaa.aaaa...................."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#c8c0a8","l":"#8a6034","m":"#6a4a28","n":"#3a2a1e","o":"#7a2428","p":"#a83a34"},"ax":10,"ay":17},"g_recover":{"r":["..........a......a.............",".........aba....aba............","........aca......aca...........","........abaaaaaaaaba...........",".........abdeedddba............",".......aaaffffffffgaa..........",".......ahhgigggigghha..........",".........aaghhhggaa............","...........aaggaa..............","...........jjjjjj..........a...",".aaaaaaaaaajjjjjjjaaaaaaaaadaa.","akllkllkllkllkllklggllkllkleeda",".aaaaaaaagaajmjjahaaaaaanoodaa.","........ah.ajjmjaa.....anoaa...","........aa.ammmma......ana.....","..........aaha.ahaa.....a......","..........aaaa.aaaa............"],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#6a4a28","l":"#8a6034","m":"#3a2a1e","n":"#7a2428","o":"#a83a34"},"ax":14,"ay":17},"g_sw0":{"r":[".a......................","aba.....................",".aca....................","..aca...................","...ada..................","....aea.a......a........",".....adafa....afa.......","......ada......aga......","......afeaaaaaaafa......",".......afdccbbbfa.......",".....aaahhdhhhhhiaa.....",".....ajjikieikiijja.....",".......aaijjdiiaa.......",".........aaiida.........",".........lllllea........","........allllllda.......",".......ailmllmlaia......","......ai.almlla.aea.....","......aj.allmla..ada....","......aa.ammmma...ada...","........aaja.ajaa..aea..","........aaaa.aaaa...ada.",".....................ada","......................a."],"p":{"a":"#0e120a","b":"#7c7a8a","c":"#a8a6b6","d":"#8a6034","e":"#6a4a28","f":"#e8dcc0","g":"#c8b898","h":"#3a3640","i":"#6e9a3a","j":"#46682a","k":"#ffd23a","l":"#5a4030","m":"#3a2a1e"},"ax":12,"ay":22},"g_sw1":{"r":["............a......a....................","...........aba....aba...................","..........aca......aca..................","..........abaaaaaaaaba..................","...........abdeedddba...................",".........aaaffffffffgaa.................",".........ahhgigggigghha.................","..........aaaghhhggaa...................",".........ajjkaaggaa.....................","..........aaajjkjllaa...................","............alllljkjjaaaa...............","...........aglmllmlagkjjkaaaa...........","..........ag.almlla.aaaaajjkjaaaa.......","no........ah.allmla......aaaajkjjaaaaaa.","no........aa.ammmma..........aaaakjjeeda","no..........aaha.ahaa..........onaaaaaa.","nno.........aaaa.aaaa.........onn.......",".nno........................oonn........","...nnoo....................oon..........",".....nnnoo............oo.oon............","........nnonnoonnoonoonnn..............."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#8a6034","k":"#6a4a28","l":"#5a4030","m":"#3a2a1e","n":"#f0e8d0","o":"#c8c0a8"},"ax":16,"ay":17},"g_sw2":{"r":["............a......a................","...........aba....aba...............","..........aca......aca..............","..........abaaaaaaaaba..............","...........adeffeeeba...............",".........aaagdhgggggiaa.............",".........ajjikidikiijja.............","...........aaijjdhiaa...............",".............aaiiadaa...............",".............lllllldha..............","............alllllllada......m......","...........ailnllnlaiadaa....omm....","..........ai.alnlla.a.ahda....om....","mo........aj.allnla....aadaa...om...","mo........aa.annnna......ahda..om...","mo..........aaja.ajaa.....aadaaom...","mmo.........aaaa.aaaa.......ahomm...",".mmm........................oomma...","...mmo....................oomm.afa..",".....mmmmo............o.oomm....afa.",".........mmmomoomomomommm........aea"],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#8a6034","e":"#7c7a8a","f":"#a8a6b6","g":"#3a3640","h":"#6a4a28","i":"#6e9a3a","j":"#46682a","k":"#ffd23a","l":"#5a4030","m":"#f0e8d0","n":"#3a2a1e","o":"#c8c0a8"},"ax":16,"ay":17},"b_w0":{"r":[".....................",".....a.aaaaaa........","...aabacddddca.......","..aaaecfceecfceaa.a..",".abaggdhdddhddggaaia.",".ajkaaadgggddaa.alha.","aeeeeeeaaddaa...abala","ammnmmmooooob..ama.a.","apmmmmaoooopooajjja..","apmmmadoqobqodjrjjka.","apppadpaopooaajcjkka.",".aaaagaaboqoaajjkkka.","....aa.aqqqqaaakkka..","....aaaa...aaaa......"],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#5a3a1e","f":"#9ae0d8","g":"#46682a","h":"#ffd23a","i":"#fff3c0","j":"#3a3640","k":"#26252b","l":"#ff9a40","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#6a4a28","q":"#3a2a1e","r":"#8a889a"},"ax":10,"ay":14},"b_w1":{"r":[".....a.aaaaaa........","...aabacddddca.......","..aaaecfceecfceaa.a..",".abaggdhdddhddggaaia.",".ajkaaadgggddaa.alha.","aeeeeeeaaddaa...abala","ammnmmmooooob..ama.a.","apmmmmaoooopooajjja..","apmmmadoqobqodjrjjka.","apppadpaopooaajcjkka.",".aaaagaaboqoaajjkkka.","....aa.aqqqqaaakkka..",".......aagagaaaaaa...",".......aaaaaaa......."],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#5a3a1e","f":"#9ae0d8","g":"#46682a","h":"#ffd23a","i":"#fff3c0","j":"#3a3640","k":"#26252b","l":"#ff9a40","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#6a4a28","q":"#3a2a1e","r":"#8a889a"},"ax":10,"ay":14},"b_i1":{"r":[".....a.aaaaaaa.......","...aabacddddcceaa.a..","..aaaecfceecfdggaaia.",".abaggdhdddhdaa.alha.",".ajkaaadgggdd...abala","aeeeeeeaaddaa..ama.a.","ammnmmmoooooboajjja..","apmmmmaoooopodjrjjka.","apmmmadoqobqoajcjkka.","apppadpaopooaajjkkka.",".aaaagaaboqoaaakkka..","....aa.aqqqqaaaaaa...","......aaga.agaa......","......aaaa.aaaa......"],"p":{"a":"#0e120a","b":"#a87c4c","c":"#55535f","d":"#6e9a3a","e":"#5a3a1e","f":"#9ae0d8","g":"#46682a","h":"#ffd23a","i":"#fff3c0","j":"#3a3640","k":"#26252b","l":"#ff9a40","m":"#8a6034","n":"#d8b860","o":"#5a4030","p":"#6a4a28","q":"#3a2a1e","r":"#8a889a"},"ax":10,"ay":14},"r_body":{"r":["....a......a....","...aba....aba...","..aca......aca..","..abaaaaaaaaba..","...abdeedddba...",".aaaffffffffgaa.",".ahhgigggigghha.","...aaghhhggaa...",".....aaggaa.....","....ajjjjjja....","...agjjjjjjga...","..aagjmjjmjha...","..ag.ppppppa....",".....pqqqrp.....","....pqqqqqrp....","...pqssqqqqrp...","..pqstuvqquvrp..","..pqwtvvtqvvrp..",".pqqttttqqqqrrp.",".prrrxxxrrrryyp.",".prrrrrrrrrryyp.",".pppzpzpzpzpzpp."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#6a4a28","l":"#8a6034","m":"#3a2a1e","n":"#7a2428","o":"#a83a34","p":"#1a0806","q":"#c8483a","r":"#8a2622","s":"#f4a08a","t":"#6a1a18","u":"#ffffff","v":"#0a0a0a","w":"#8a2a24","x":"#4a1210","y":"#7a201c","z":"#140605"},"ax":8,"ay":22},"g_body":{"r":["....a......a.....","...aba....aba....","..aca......aca...","..abaaaaaaaaba...","...abdeedddba....",".aaaffffffffgaa..",".ahhgigggigghha..","...aaghhhggaa....",".....aaggaa......",".....jjjjjj......","....ajjjjjjja....","...agjjjjjjjga...","..agaajmjjaha....","..ah.ajjmjaa.....","..aa.ammmma......","....aaha.ahaa....","....aaaa.aaaa...."],"p":{"a":"#0e120a","b":"#e8dcc0","c":"#c8b898","d":"#7c7a8a","e":"#a8a6b6","f":"#3a3640","g":"#6e9a3a","h":"#46682a","i":"#ffd23a","j":"#5a4030","k":"#6a4a28","l":"#8a6034","m":"#3a2a1e","n":"#7a2428","o":"#a83a34"},"ax":8,"ay":17}};
  const CV = {}, CW = {};
  const cv = k => CV[k] || (CV[k] = gCanvas(fromRows(F[k].r), F[k].p));
  const cw = k => { if (CW[k]) return CW[k]; const s = cv(k), [c, g] = mkCanvas(s.width, s.height); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); return (CW[k] = c); };
  // 궤적(찌른 줄 · 휘두른 원) 칸을 뺀 그림 — 외곽선(오오라) 실루엣에는 몸만 들어가게
  const TRAIL = ['#c8c0a8', '#f0e8d0'], CN = {};
  const cn = k => { if (CN[k]) return CN[k]; const f = F[k], bad = Object.keys(f.p).filter(ch => TRAIL.includes(f.p[ch]));
    return (CN[k] = bad.length ? gCanvas(fromRows(f.r.map(r => r.split('').map(ch => bad.includes(ch) ? '.' : ch).join(''))), f.p) : cv(k)); };
  // 그림 k를 기준점(ax, ay 칸)이 (x, y)에 오게 — flip이면 좌우 반전
  function put(k, x, y, flip, white, alpha) {
    const f = F[k], s = white ? cw(k) : cv(k), X = Math.round(x / 2) * 2, Y = Math.round(y / 2) * 2;
    const A = !white && AUR ? pxAuraCv(cn(k), AUR) : null; // 준엘리트 외곽선 한 줄 (다른 장 준엘리트와 같은 방식 — 그림마다 테두리)
    ctx.save(); if (alpha != null && alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); if (A) ctx.drawImage(A.c, -f.ax * 2 - A.p, -f.ay * 2 - A.p); ctx.drawImage(s, -f.ax * 2, -f.ay * 2); }
    else { if (A) ctx.drawImage(A.c, X - f.ax * 2 - A.p, Y - f.ay * 2 - A.p); ctx.drawImage(s, X - f.ax * 2, Y - f.ay * 2); }
    ctx.restore();
  }
  const BLAST_E = () => 46 * STG().hpMul; // 오폭: 몬스터가 받는 피해 (일반 고블린 한 마리 남짓)

  // ---------------------------------------------------------------- 폭발 (플레이어 · 주변 몬스터)
  function blast(x, y, r, dmg, src, big) {
    const P = G.player;
    if (!P.dead && Math.hypot(P.x - x, (P.y - y) * 1.2) < r + P.r) hurtPlayer(dmg, src && !src.dead ? src : null);
    const eDmg = BLAST_E() * (big ? 1.6 : 1);
    for (const o of G.enemies.slice()) {
      if (o.dead || o === src || o.type === 'boss' || isDummy(o) || o.type === 'flag') continue;
      if (Math.hypot(o.x - x, (o.y - y) * 1.2) > r + o.r) continue;
      const v = Math.round(eDmg * (1 - (o.def || 0) / ((o.def || 0) + 500)));
      o.hp -= v; o.flash = 0.12; o.hitT = time;
      const ang = Math.atan2(o.y - y, o.x - x), kb = 160 * (o.kbRes == null ? 1 : o.kbRes); o.vx += Math.cos(ang) * kb; o.vy += Math.sin(ang) * kb; o.lastAng = ang;
      G.nums.push({ x: o.x, y: o.y - 22, v: String(v), t: 0.6, c: '#ffb060', s: 1 });
      if (o.hp <= 0) killEnemy(o);
    }
    G.fx.push({ kind: 'pxboom', x, y, big: !!big, t: 0.42, max: 0.42 });
    for (let i = 0; i < (big ? 26 : 16); i++) { const a = rand(0, TAU), sp = rand(60, big ? 220 : 160); G.parts.push({ x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 50, t: rand(0.3, 0.7), c: pick(['#ffd23a', '#ff7a20', '#3a3640', '#55535f']), g: 260, floor: y + rand(-6, 8) }); }
    splat(x, y, big ? 26 : 16, '40,32,26'); dust(x, y, big ? 12 : 6);
    addShake(big ? 7 : 4); sfx('blast');
  }

  // ---------------------------------------------------------------- 점액 라이더
  function updRider(e, dt, d, a, moveTo) {
    const P = G.player; e.squash = Math.max(0, (e.squash || 0) - dt);
    if (e.state === 'aim') { if (e.t <= 0) { /* 찌르기는 예고 onFire에서 */ } return; }
    if (e.state === 'thrust') { if (e.t <= 0) { e.state = 'recover'; e.t = 0.4; e.atkFr = 'recover'; e.cd = rand(1.1, 1.7); } return; }
    if (e.state === 'swing0') { e.swk = e.swTele ? Math.min(1, e.swTele.t / e.swTele.dur) : 1; return; }
    if (e.state === 'swing') { if (e.t <= 0) { e.state = 'recover'; e.t = SW_R; e.atkFr = 'sw2'; e.cd = rand(1.4, 2.0); } return; }
    if (e.state === 'aim2') return;
    if (e.state === 'rcharge') {
      const sp = 290; e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
      e.x = clamp(e.x, A.x0 + 12, A.x1 - 12); e.y = clamp(e.y, A.y0 + 12, A.y1 - 12);
      e.jabT = (e.jabT || 0) - dt; e.walk += dt * 10;
      if (e.jabT <= 0) { e.jabT = 0.13; e.jab = !e.jab;
        hitShape({ shape: 'cone', x: e.x, y: e.y, ang: e.lockAng, arc: 70 * DEG, r: 40, owner: e }, e.atk * 0.55);
        if (e.jab) { sfx('swing', rand(1.1, 1.3)); dust(e.x - Math.cos(e.lockAng) * 8, e.y, 2); } }
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.6; e.atkFr = 'recover'; e.cd = rand(2.0, 2.8); e.squash = 0.18; }
      return;
    }
    if (e.state !== 'chase') return;
    e.atkFr = null;
    if (e.hop) { stepHop(e, dt); return; }
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (e.cd <= 0) {
      if (d > 110 && d < 260 && Math.random() < 0.5) { // 돌진 연속 찌르기
        e.state = 'aim2'; e.lockAng = a; e.face = Math.cos(a) >= 0 ? 1 : -1; alertMark(e, 50, true); sfx('warn');
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 230, w: 26, t: 0, dur: 0.75, owner: e,
          onFire: () => { e.state = 'rcharge'; e.t = 0.75; e.jabT = 0; sfx('growl', 1.2); } });
        return;
      }
      if (d < 64) {
        if (Math.random() < 0.4 || d < 30) { // 휘두르기: 둘레 원형
          e.state = 'swing0'; alertMark(e, 46); sfx('warn', 0.9);
          const tw = { shape: 'circle', x: e.x, y: e.y, r: 50, t: 0, dur: 0.6, owner: e }; e.swTele = tw;
          G.tele.push(Object.assign(tw, {
            onFire: tt => { hitShape({ shape: 'circle', x: e.x, y: e.y, r: 50 }, e.atk * 1.1); e.state = 'swing'; e.t = SW_T; e.swTele = null; sfx('heavy', 0.9); dust(e.x, e.y, 6); } }));
        } else { // 찌르기
          e.state = 'aim'; e.lockAng = a; e.face = Math.cos(a) >= 0 ? 1 : -1; e.t = 0.5;
          G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 74, w: 18, t: 0, dur: 0.5, owner: e,
            onFire: tt => { hitShape(tt, e.atk); e.state = 'thrust'; e.t = 0.2; e.x += Math.cos(e.lockAng) * 6; e.y += Math.sin(e.lockAng) * 6; sfx('swing', 0.9); } });
        }
        return;
      }
    }
    // 깡충 이동 (가까우면 옆으로 맴돎)
    e.hopT = (e.hopT || 0) - dt;
    if (e.hopT <= 0) { e.hopT = rand(0.18, 0.38); const ang = d > 50 ? a + rand(-0.3, 0.3) : a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
      e.hop = { t: 0, dur: 0.4, ang: steer(e, ang), sp: e.spd * 1.2, h: 8 }; }
  }
  // v3.53 창은 몸(r_body)과 따로 그림 — 찌르기 · 돌진은 겨눈 방향 그대로(위 · 아래도), 휘두르기는 몸 둘레를 한 바퀴 반 돌며 궤적을 남김
  const SPC = { o: '#0e120a', s1: '#8a6034', s2: '#6a4a28', m1: '#a8a6b6', m2: '#7c7a8a', m3: '#e8e6f0', r1: '#a83a34', r2: '#7a2428', t1: '#f0e8d0', t2: '#c8c0a8' };
  const SW_T = 0.28, SW_R = 0.45, SW_ALL = SW_T + SW_R * 0.6; // 휘두르기 시간 · 회복 (회전은 회복 앞부분까지 이어서 감속)
  const cel = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2); };
  function spearLine(gx, gy, vx, vy, back, fwd, white) { // 쥔 곳(gx, gy)에서 v 방향(길이 1 이하 = 원근으로 짧아짐)으로
    const L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L, nx = -uy, ny = ux, a0 = -back * L, a1 = fwd * L, W = c => white ? '#ffffff' : c, pts = [];
    for (let d = a0; d <= a1; d += 1) pts.push(d);
    for (const d of pts) { const x = gx + ux * d, y = gy + uy * d; cel(x + nx * 2, y + ny * 2, W(SPC.o)); cel(x - nx * 2, y - ny * 2, W(SPC.o)); } // 외곽선
    cel(gx + ux * (a0 - 2), gy + uy * (a0 - 2), W(SPC.o)); cel(gx + ux * (a1 + 2), gy + uy * (a1 + 2), W(SPC.o));
    const hb = Math.max(a0, a1 - 9 * Math.max(0.6, L));
    for (let d = hb + 1; d <= a1 - 3; d += 1) { const x = gx + ux * d, y = gy + uy * d; for (const sg of [1, -1]) { cel(x + nx * 2 * sg, y + ny * 2 * sg, W(SPC.m2)); cel(x + nx * 4 * sg, y + ny * 4 * sg, W(SPC.o)); } } // 창날 넓은 부분
    let i = 0; for (const d of pts) { const x = gx + ux * d, y = gy + uy * d; cel(x, y, W(d > hb ? (d > a1 - 4 ? SPC.m3 : SPC.m1) : (Math.floor((d - a0) / 2) % 3 === 0 ? SPC.s2 : SPC.s1))); i++; }
    const rd = hb - 2, rx = gx + ux * rd, ry = gy + uy * rd, fl = Math.floor(time * 10) % 2; // 붉은 천: 늘 아래로 처져 나부낌
    for (let k = 0; k < 3; k++) cel(rx - ux * 2 * k + (fl && k === 2 ? 2 : 0), ry + 2 + 2 * k, W(k % 2 ? SPC.r2 : SPC.r1));
  }
  function hand(gx, gy, white) { cel(gx, gy, white ? '#ffffff' : '#6e9a3a'); cel(gx, gy + 2, white ? '#ffffff' : '#46682a'); }
  function speedLines(gx, gy, ux, uy, fwd) { const nx = -uy, ny = ux, off = Math.floor(time * 60) % 6;
    for (const sg of [1, -1]) for (let d = fwd - 34 + off; d < fwd - 8; d += 6) for (let q = 0; q < 3; q += 1) cel(gx + ux * (d + q * 2) + nx * 6 * sg, gy + uy * (d + q * 2) + ny * 6 * sg, q ? SPC.t2 : SPC.t1); }
  function swingTrail(cx, cy, th, dir, span, R, front) { // 창끝이 지나간 초승달 궤적: 최근일수록 두껍고 밝음 (front: 앞쪽 반 / 뒤쪽 반)
    let n = 0; for (let d = 0; d <= span; d += 0.035, n++) { const ph = th - dir * d, sy = Math.sin(ph); if ((sy >= 0) !== front) continue; const k = 1 - d / span;
      if (k < 0.25 && n % 2) continue; const cs = Math.cos(ph), T = k > 0.66 ? 3 : k > 0.3 ? 2 : 1;
      for (let q = 0; q < T; q++) { const rr = R - q * 2.4; cel(cx + cs * rr, cy + sy * rr * 0.55, q === 0 && k > 0.45 ? SPC.t1 : SPC.t2); } }
  }
  const easeO = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const ST_ALIAS = { faim: 'aim', fthrust: 'thrust', fsw0: 'swing0', fswing: 'swing' }; // 낙마한 고블린도 같은 창 동작
  function riderSpear(e0, sc = 1) { const st = ST_ALIAS[e0.state] || e0.state, e = st === e0.state ? e0 : Object.assign(Object.create(e0), { state: st }); const r = riderSpear0(e); if (r && sc !== 1) { r.back *= sc; r.fwd *= sc; } return r; }
  function riderSpear0(e) { // 지금 자세의 창 { vx, vy, back, fwd, lines, trail }
    const f = e.face || 1, la = e.lockAng != null ? e.lockAng : (f > 0 ? 0 : Math.PI), cx = Math.cos(la), sy = Math.sin(la);
    if (e.state === 'aim' || e.state === 'aim2') { const k = Math.min(1, e.glow || 0); return { vx: cx, vy: sy, back: 24 + 6 * k, fwd: 28 - 6 * k }; }
    if (e.state === 'thrust') return { vx: cx, vy: sy, back: 8, fwd: 46, lines: e.t > 0.06 };
    if (e.state === 'rcharge') return e.jab ? { vx: cx, vy: sy, back: 8, fwd: 46, lines: true } : { vx: cx, vy: sy, back: 22, fwd: 30 };
    if (e.state === 'recover' && e.atkFr === 'recover') { const k = easeO(1 - (e.t || 0) / 0.4); return { vx: cx, vy: sy, back: 8 + 14 * k, fwd: 46 - 16 * k }; }
    const th0 = f > 0 ? Math.PI : 0, dir = -f;
    if (e.state === 'swing0') { const k = e.swk != null ? e.swk : Math.min(1, e.glow || 0); return { vx: Math.cos(th0 - dir * 0.5 * k), vy: Math.sin(th0 - dir * 0.5 * k) * 0.55 - 0.45 * k, back: 16, fwd: 32 }; } // 뒤로 크게 젖힘
    let s = null; if (e.state === 'swing') s = SW_T - Math.max(0, e.t); else if (e.state === 'recover' && e.atkFr === 'sw2') s = SW_T + SW_R - Math.max(0, e.t);
    if (s != null) { const u = Math.min(1, s / SW_ALL), th = th0 + dir * Math.PI * 3 * easeO(u), spd = 3 * Math.pow(1 - u, 2);
      return { vx: Math.cos(th), vy: Math.sin(th) * 0.55, back: 16, fwd: 32, pivot: true, trail: { th, dir, span: Math.min(Math.PI * 3 * easeO(u), 0.6 + 3.0 * Math.min(1, spd * 0.8)), w: spd } }; }
    return null;
  }
  function drawSpearPose(e, SP, body, x0, oy, hy, hx, white, flip, al) { // body 그림 + 따로 그린 창 (hy: 쥔 높이 · hx: 앞으로 내민 손)
    const aimSt = e.state === 'aim' || e.state === 'aim2' || e.state === 'swing0' || e.state === 'faim' || e.state === 'fsw0';
    const sh = aimSt && e.glow > 0.6 ? (Math.floor(time * 20) % 2) * 2 : 0;
    const ox = x0 + sh, py = oy - hy, gx = SP.pivot ? ox + SP.vx * 6 : ox + e.face * hx, gy = SP.pivot ? py + SP.vy * 6 : py, behind = SP.vy < -0.15 && !SP.trail; // 휘두를 땐 몸 가운데를 축으로 손도 같이 돎
    const A = () => { if (al != null && al !== 1) ctx.globalAlpha = al; };
    const T = SP.trail && SP.trail.w > 0.12 ? SP.trail : null, TR = SP.fwd + 8;
    ctx.save(); A(); if (T && !white) swingTrail(ox, py, T.th, T.dir, T.span, TR, false);
    if (behind || (SP.trail && SP.vy < 0)) { spearLine(gx, gy, SP.vx, SP.vy, SP.back, SP.fwd, white); ctx.restore(); put(body, ox, oy, flip, white, al); ctx.save(); A(); hand(gx, gy, white); }
    else { ctx.restore(); put(body, ox, oy, flip, white, al); ctx.save(); A(); spearLine(gx, gy, SP.vx, SP.vy, SP.back, SP.fwd, white); hand(gx, gy, white); if (SP.lines && !white) { const L = Math.hypot(SP.vx, SP.vy) || 1; speedLines(gx, gy, SP.vx / L, SP.vy / L, SP.fwd); } }
    if (T && !white) swingTrail(ox, py, T.th, T.dir, T.span, TR, true);
    ctx.restore();
  }
  function drawRider(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0;
    drawShadow(e.x, e.y + 1, 12 * (1 - Math.min(0.5, z / 60)));
    if (e.dead) { put('r_slime', e.x, e.y + 2 + ya, flip, white, al); return; } // 낙마: 슬라임만
    const SP = riderSpear(e);
    if (SP && !e.dead) { drawSpearPose(e, SP, 'r_body', e.x, e.y + 2 + ya - z, 23, 7, white, flip, al); return; } // v3.53 몸 + 따로 그린 창
    let k = 'r_idle';
    if (e.state === 'aim' || e.state === 'aim2') k = 'r_ready';
    else if (e.state === 'thrust') k = 'r_thrust';
    else if (e.state === 'rcharge') k = e.jab ? 'r_thrust' : 'r_recover';
    else if (e.state === 'swing0') k = 'r_sw0';
    else if (e.state === 'swing') k = e.t > 0.14 ? 'r_sw1' : 'r_sw2';
    else if (e.state === 'recover' && e.atkFr) k = 'r_' + e.atkFr;
    else if (z > 0.5) k = 'r_air';
    else if (e.squash > 0) k = 'r_crouch';
    const sh = (e.state === 'aim' || e.state === 'aim2' || e.state === 'swing0') && e.glow > 0.6 ? (Math.floor(time * 20) % 2) * 2 : 0;
    put(k, e.x + sh, e.y + 2 + ya - z, flip, white, al);
  }

  // ---------------------------------------------------------------- 고블린 폭탄병
  function toss(e, tx, ty) {
    tx = clamp(tx, A.x0 + 12, A.x1 - 12); ty = clamp(ty, A.y0 + 12, A.y1 - 12);
    const dur = 0.9, bo = { bomber: e }, dmg = e.atk;
    G.fx.push({ kind: 'lob', bomb: true, x0: e.x + e.face * 10, y0: e.y - 22, gy0: e.y, x1: tx, y1: ty, h: 52, d0: 0, t: dur, max: dur, owner: bo });
    G.tele.push({ shape: 'circle', x: tx, y: ty, r: 32, t: 0, dur, owner: bo, onFire: tt => blast(tt.x, tt.y, tt.r, dmg, e, false) });
    sfx('swing', 0.8);
  }
  function updBomber(e, dt, d, a, moveTo) {
    const P = G.player;
    if (!e.rushing && e.hp < e.maxHp * 0.3 && (e.state === 'chase' || e.state === 'recover')) { // 자폭 시작
      e.rushing = true; e.state = 'rush'; e.t = 3.5; e.spd0 = e.spd; alertMark(e, 40, true); sfx('warn'); sfx('growl', 1.4);
    }
    if (e.state === 'rush') {
      e.face = Math.cos(a) > 0 ? 1 : -1; moveTo(a, e.spd0 * 2.4);
      if (Math.random() < dt * 14) G.parts.push({ x: e.x + e.face * 4, y: e.y - 26, vx: rand(-20, 20), vy: -rand(20, 50), t: 0.35, c: pick(['#ffd23a', '#ff9a40', '#fff3c0']), g: 0, glow: true });
      if (d < 28 || e.t <= 0) {
        e.state = 'fuse'; sfx('warn', 1.2);
        G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 58, t: 0, dur: 0.75, owner: e, heavy: true,
          onFire: tt => { e.exploded = true; blast(e.x, e.y, 58, e.atk * 1.6, e, true); if (!e.dead) { e.hp = 0; killEnemy(e); } } });
      }
      return;
    }
    if (e.state === 'fuse') { if (Math.random() < dt * 20) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(18, 30), vx: 0, vy: -30, t: 0.3, c: '#ffd23a', g: 0, glow: true }); return; }
    if (e.state === 'hug') {
      if (e.t <= 0) { e.state = 'toss'; e.t = 0.28; toss(e, P.x, P.y);
        if (e.two) { const pa = a + Math.PI / 2, o = rand(40, 60) * (Math.random() < 0.5 ? 1 : -1); e.second = { x: P.x + Math.cos(pa) * o + Math.cos(a) * rand(-20, 30), y: P.y + Math.sin(pa) * o + Math.sin(a) * rand(-20, 30) }; e.secT = 0.32; } }
      return;
    }
    if (e.state === 'toss') {
      if (e.second) { e.secT -= dt; if (e.secT <= 0) { toss(e, e.second.x, e.second.y); e.second = null; e.t = 0.28; } return; }
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.4; e.cd = rand(2.0, 2.8); }
      return;
    }
    if (e.state !== 'chase') return;
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (d < 120) moveTo(a + Math.PI, e.spd); else if (d > 210) moveTo(a, e.spd); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
    if (Math.random() < dt * 0.5) e.strafe = -(e.strafe || 1);
    if (e.cd <= 0 && d < 290) { e.state = 'hug'; e.t = 0.5; e.two = Math.random() < 0.35; sfx('swing', 1.4); }
  }
  function drawBomber(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0;
    drawShadow(e.x, e.y + 1, 8);
    const mv = e.walk !== e.bwPrev; if (mv) e.bwMove = time; e.bwPrev = e.walk; const moving = time - (e.bwMove || -9) < 0.12;
    let k = moving ? (Math.floor(e.walk * 0.9) % 2 ? 'b_w0' : 'b_w1') : (Math.floor(time * 2.6 + e.x * 0.01) % 3 === 2 ? 'b_i1' : 'b_idle'), bob = 0; // v3.53 걷기 2프레임 · 대기(폭탄을 손에서 통통 튕김)
    if (e.state === 'hug') k = 'b_wind';
    else if (e.state === 'toss') k = 'b_throw';
    else if (e.state === 'rush' || e.state === 'fuse') k = Math.floor(time * (e.state === 'fuse' ? 16 : 8)) % 2 ? 'b_rush1' : 'b_rush0';
    put(k, e.x, e.y + 2 + ya + bob, flip, white, al);
  }

  // ---------------------------------------------------------------- 낙마한 고블린: 투구 · 창을 일반 고블린 몸에 겹쳐 그림 (머리 · 앞팔 움직임을 따라감)
  function drawFallen(e, x, by, flip, o, off) {
    if (!o || o.white) return;
    const F2 = flip ? -1 : 1, ox = x - 14 * F2, oy = by - 28;
    const hd = (off && off.head) || [0, 0], af = (off && off.armF) || [0, 0];
    const at = (k, d) => { const f = F[k], s = cv(k), X = Math.round((ox + d[0] * 2 * F2) / 2) * 2, Y = Math.round((oy + d[1] * 2) / 2) * 2; // GOB 원점 기준 (머리 · 앞팔 자세 따라)
      ctx.save(); if (o.alpha != null && o.alpha !== 1) ctx.globalAlpha = o.alpha;
      if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); ctx.drawImage(s, -f.ax * 2, -f.ay * 2); } else ctx.drawImage(s, X - f.ax * 2, Y - f.ay * 2);
      ctx.restore(); };
    at('f_spear', af); at('f_helm', hd);
  }

  // ---------------------------------------------------------------- 폭탄 투사체 · 도트 폭발
  function drawBombLob(f, p) {
    const k = p; if (k < 0) return;
    const x = f.x0 + (f.x1 - f.x0) * k, gy = f.gy0 + (f.y1 - f.gy0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h;
    dshEll(ctx, x, gy, 4, 2, 0.5);
    put(Math.floor(time * 12) % 2 ? 'bomb1' : 'bomb0', x, y + 6, f.x1 < f.x0, false, 1);
  }
  function drawBoom(f) {
    const p = 1 - f.t / f.max, i = Math.min(3, Math.floor(p * 4)), k = (f.big ? 'bb' : 'bs') + i;
    put(k, f.x, f.y - (f.big ? 10 : 6), false, false, i === 3 ? 0.8 : 1);
  }

  // ---------------------------------------------------------------- 낙마한 고블린: 걸어서 쫓아와 창으로 찌르기 · 휘두르기 (돌진 연속 찌르기는 없음)
  function updFallen(e, dt, d, a, moveTo) {
    if (e.state === 'faim' || e.state === 'fsw0') return;
    if (e.state === 'fthrust') { if (e.t <= 0) { e.state = 'recover'; e.t = 0.4; e.atkFr = 'recover'; e.cd = rand(1.0, 1.6); } return; }
    if (e.state === 'fswing') { if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; e.atkFr = 'sw2'; e.cd = rand(1.3, 1.9); } return; }
    if (e.state !== 'chase') return;
    e.atkFr = null; e.face = Math.cos(a) > 0 ? 1 : -1;
    if (d < 58 && e.cd <= 0) {
      if (Math.random() < 0.35 || d < 22) {
        e.state = 'fsw0'; sfx('warn', 0.9);
        G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 42, t: 0, dur: 0.55, owner: e,
          onFire: () => { hitShape({ shape: 'circle', x: e.x, y: e.y, r: 42 }, e.atk * 1.1); e.state = 'fswing'; e.t = 0.28; sfx('heavy', 1.0); dust(e.x, e.y, 4); } });
      } else {
        e.state = 'faim'; e.lockAng = a; e.face = Math.cos(a) >= 0 ? 1 : -1;
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 64, w: 16, t: 0, dur: 0.45, owner: e,
          onFire: tt => { hitShape(tt, e.atk); e.state = 'fthrust'; e.t = 0.2; e.x += Math.cos(e.lockAng) * 5; e.y += Math.sin(e.lockAng) * 5; sfx('swing', 1.0); } });
      }
      return;
    }
    if (d > 26) moveTo(a, e.spd);
  }
  const isFallenAtk = e => e.helm && !e.dead && (e.state === 'faim' || e.state === 'fthrust' || e.state === 'fsw0' || e.state === 'fswing' || (e.state === 'recover' && e.atkFr));
  function drawFallenAtk(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0;
    drawShadow(e.x, e.y + 1, 8);
    const SP = riderSpear(e, 0.85); if (SP) { drawSpearPose(e, SP, 'g_body', e.x, e.y + 2 + ya, 12, 6, white, flip, al); return; } // v3.55 라이더와 같은 창 동작 (조금 짧은 창)
    let k = 'g_ready';
    if (e.state === 'fthrust') k = 'g_thrust'; else if (e.state === 'fsw0') k = 'g_sw0'; else if (e.state === 'fswing') k = e.t > 0.14 ? 'g_sw1' : 'g_sw2'; else if (e.state === 'recover' && e.atkFr) k = 'g_' + e.atkFr;
    const sh = (e.state === 'faim' || e.state === 'fsw0') && e.glow > 0.6 ? (Math.floor(time * 20) % 2) * 2 : 0;
    put(k, e.x + sh, e.y + 2 + ya, flip, white, al);
  }
  // 준엘리트 외곽선 한 줄 (다른 장 준엘리트와 같은 도트 오오라)
  const AURA = { grider: '#ff6a50', gbomber: '#ffc040' };
  let AUR = null;
  function withLine(e, al, fn) { AUR = e.flash > 0 || e.dead || al < 0.5 ? null : [AURA[e.type], 1]; try { fn(); } finally { AUR = null; } }
  return { AURA, withLine, updFallen, isFallenAtk, drawFallenAtk, updRider, drawRider, updBomber, drawBomber, drawFallen, drawBombLob, drawBoom, blast };
})();

// ---- 연결
SEMI_T.add('grider'); SEMI_T.add('gbomber');
NM_AURA.grider = [GSEMI.AURA.grider, 1]; NM_AURA.gbomber = [GSEMI.AURA.gbomber, 1]; // 휘두름 궤적 색도 같게
{ const o = makeEnemy; makeEnemy = function (type, x, y) { const e = o.apply(this, arguments);
    if (e && e.type === 'grider') { e.semiName = '점액 라이더'; e.tall = 50; e.z = 0; e.squash = 0; }
    else if (e && e.type === 'gbomber') { e.semiName = '고블린 폭탄병'; e.tall = 34; }
    return e; }; }
{ const o = killEnemy; killEnemy = function (e, silent) { const r = o.apply(this, arguments);
    if (e && e.type === 'grider' && !silent && G.dun) { // 낙마: 고블린이 굴러떨어져 계속 싸움
      const g = makeEnemy('goblin', clamp(e.x + e.face * 6, A.x0 + 10, A.x1 - 10), e.y + 2); g.gv = 0; g.helm = true; g.rise = 0; g.vx = -e.face * 90; g.vy = 0; g.cd = 0.9; g.state = 'stun'; g.t = 0.5;
      G.enemies.push(g); dust(g.x, g.y, 6); sfx('crunch', 0.8); }
    return r; }; }
{ const o = nrBiped; nrBiped = function (e, map, pal, x, by, flip, op, M) { const off = o.apply(this, arguments); if (e && e.helm && !e.dead) GSEMI.drawFallen(e, x, by, flip, op, off); return off; }; }
{ const o = drawLob; drawLob = function (f, p) { if (f.bomb) return GSEMI.drawBombLob(f, p); return o.apply(this, arguments); }; }
{ const o = drawFx; drawFx = function (f) { if (f.kind === 'pxboom') { ctx.save(); GSEMI.drawBoom(f); ctx.restore(); return; } return o.apply(this, arguments); }; }
// 웨이브: 1장 전투방 등급은 1 · 2 · 6 · 7뿐 — 라이더 2등급 · 7등급, 폭탄병 6등급 · 7등급 (한 방에 한 종씩 웨이브를 나눠서)
PHASES_MEADOW[2][1].push(['grider', 1]); PHASES_MEADOW[6][2].push(['gbomber', 1]); PHASES_MEADOW[7][1].push(['gbomber', 1]); PHASES_MEADOW[7][2].push(['grider', 1]);
