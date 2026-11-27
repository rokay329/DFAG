'use strict';
// 잿빛 왕관 원정대 — 11g_bistro.js : 쿠키 · 쿠오의 출장 비스트로 (v3.10)
// 모닥불 방을 비스트로로: 모닥불에 묻힌 동그란 솥 · 양옆에 쿠키(왼쪽, 국자 · 코드 키 kuo) · 쿠오(오른쪽, 뒤집개 · 코드 키 cookie) — v3.14 이름만 서로 바꿈 · 메뉴판 · 채소 상자.
// 주문(F)은 기존 모닥불 축복 3택1을 요리로 보여 줌 (효과는 그대로).
const BISTRO = (() => {
  const D = {"cats":{"kuo":{"f":{"base":["......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddUdddUdCWk........","kDkcddudddudCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kDDk.kDDk.........",".....kkkk.kkkk........."],"baseB":["......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddddddddCWk........","kDkcddkdddkdCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kDDk.kDDk.........",".....kkkk.kkkk........."],"idle":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddUdddUdCWk........","kDkcddudddudCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........","..kk.kDDk.kDkk.........",".....kkkk.kkk.........."],"idleB":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddddddddCWk........","kDkcddkdddkdCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........","..kk.kDDk.kDkk.........",".....kkkk.kkk.........."],"w1":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddUdddUdCWk........","kDkcddudddudCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kDDk.kkk.........."],"w1B":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddddddddCWk........","kDkcddkdddkdCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kDDk.kkk.........."],"w3":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddUdddUdCWk........","kDkcddudddudCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kkkk.kDDk........."],"w3B":[".......................","......kkkkk............",".....kwwwwWk...........",".k.k.kwwwwWk.k.........","kTkDkkVVVVVkkDk........","kTkpDccdddcCDpk........","kTkccdddddddCWk........","kTkcddddddddCWk........","kDkcddkdddkdCWk........","kDkkccdDNDdCWkk........","kDk.kkwRRRwkkk.........","kek.kwwwRwwWk..........","kEekwkwwYwWkc..........",".kEekwwwkwwWkk.........","..kk.kkkk.kDDk........."]},"p":{"T":"#2e1c14","e":"#7a5a42","E":"#b0927a","k":"#0b0a0e","c":"#f4ead6","C":"#d8c8ac","W":"#c8c4bc","w":"#fbfaf6","V":"#d8d4cc","D":"#4a3226","d":"#6a4a36","p":"#c89090","U":"#0b0a0e","u":"#4aa8f0","N":"#1a1010","R":"#b83a3a","B":"#3a5a9a","Y":"#c9a24a","i":"#e8ecf2","I":"#a8aeb8","J":"#5a5e68","O":"#8a5a32","P":"#5a3a20","K":"#3a3e48"},"pw":{"base":[12,11],"baseB":[12,11],"idle":[12,12],"idleB":[12,12],"w1":[12,12],"w1B":[12,12],"w3":[12,12],"w3B":[12,12]}},"cookie":{"f":{"base":[".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddUdddUdCWkTk","..........kcddudddudCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kDDk.kDDkk..",".............kkkk.kkkk..."],"baseB":[".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddddddddCWkTk","..........kcddkdddkdCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kDDk.kDDkk..",".............kkkk.kkkk..."],"idle":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddUdddUdCWkTk","..........kcddudddudCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kkDDk.kDDkk..",".............kkkk.kkkk..."],"idleB":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddddddddCWkTk","..........kcddkdddkdCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kkDDk.kDDkk..",".............kkkk.kkkk..."],"w1":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddUdddUdCWkTk","..........kcddudddudCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kDDk.kkkkk.."],"w1B":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddddddddCWkTk","..........kcddkdddkdCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kDDk.kkkkk.."],"w3":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddUdddUdCWkTk","..........kcddudddudCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kkkk.kDDkk.."],"w3B":[".........................",".........................",".........................",".............kkkkkkk.....","...........k.kwwwwWk.k.k.","..........kDkkVVVVVkkDkTk","..........kpDccdddcCDpkTk","..........kccdddddddCWkTk","..........kcddddddddCWkTk","..........kcddkdddkdCWkDk","...........kccdDNDdCWkkDk","............kkwBBBwkk.kDk",".............kAAAAAAk.kek","...........kckAaaaAkwkeEk","............kAAAkAAAkeEk.",".............kkkk.kDDkk.."]},"p":{"T":"#2e1c14","e":"#7a5a42","E":"#b0927a","k":"#0b0a0e","c":"#f8eedc","C":"#e0ceb0","W":"#c8c4bc","w":"#fbfaf6","V":"#d8d4cc","D":"#7a5038","d":"#9a6a4c","p":"#d8a0a0","U":"#0b0a0e","u":"#4aa8f0","N":"#4a2a1c","R":"#b83a3a","B":"#3a5a9a","A":"#9a6440","a":"#6e4428","i":"#e8ecf2","I":"#a8aeb8","J":"#5a5e68","O":"#8a5a32","P":"#5a3a20","K":"#3a3e48"},"pw":{"base":[12,12],"baseB":[12,12],"idle":[12,13],"idleB":[12,13],"w1":[12,13],"w1B":[12,13],"w3":[12,13],"w3B":[12,13]}}},"props":{"sign":{"rows":["...kkkkkkkkkkkkk...","..kWWWWWWWWWWWWWk..","..kWkkkkkkkkkkkwk..","..kWkGGGcccGGGkwk..","..kWkccGGGGGcckwk..","..kWkGGGcccGGGkwk..","..kWkGGcccccGGkwk..","..kWkGGcccccGGkwk..","..kWkgGGcccGGgkwk..","..kWkGGGGGGGGGkwk..","..kWkgGGGGGGgGkwk..","..kWkccGcccGcckwk..","..kWkGgGGGGGGgkwk..","..kWkcccGccGcckwk..","..kWkkkkkkkkkkkwk..","..kWWWWWWWWWWWWwk..","...kwkkkkkkkkkwk...","...kwk.......kwk...","..kwk.........kwk..","..kwk.........kwk..","..kkk.........kkk.."],"pal":{"k":"#0b0a0e","W":"#c09060","w":"#7a5236","G":"#24332c","g":"#2e4038","c":"#dfe4da"}},"crate":{"rows":["....kkk..kkJk.k........","..kkRRLkkJDDkkJk.......",".kRRLLLLkDJkJDDJkk.....","kRRLLULLCkBkDJDkkEk.k..","kRLULUCGGkYXkBBkEEAkEk.","kLULULGCGkYXkYkZZWkEEAk","kLLLUGGCGkYXkYkWWkZZWWQ",".kLLGGGGCkYXkYkWWkWWWQQ","..kGGGGCk.kSkYXkQkWWQQQ","kkkkkkkkkkkkkkkkkkkkkkk","kTTTTTTTTTTTTTTTTTTTOOk","kPMPPPPPPPPPPPPPPPPPHFk","kVMNNNNNNINPNNNNNNINVFk","kPMFFFFFFFFPFFFFFFFFHFk","kPMPPPPPPPPPPPPPPPPPHFk","kVMNNNNINNNPNNNNINNNVFk","kkkkkkkkkkkkkkkkkkkkkkk"],"pal":{"A":"#2e6a24","B":"#3a7a2a","C":"#3c6e2c","D":"#4a9a34","E":"#4e9a34","F":"#5a3a20","G":"#5a9a3c","H":"#6a4628","I":"#7a5232","J":"#7ad050","L":"#86c45a","M":"#8a6038","N":"#9a6c40","O":"#a87848","P":"#b08050","Q":"#b82a22","R":"#b8e488","S":"#c8601e","T":"#d4a46a","U":"#d6f0b0","V":"#e0d0b0","W":"#e84030","X":"#f4903a","Y":"#ffb468","Z":"#ffc4a8","k":"#0b0a0e"}},"cart":{"rows":["..kZZggggZZZZggggZZZZggggZZZZggggZZZZggggZZZZk..",".kZZZggggZZZZggggZZZZggggZZZZggggZZZZggggZZZZgk.","kVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbk","kVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbk","kVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbk","kVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbbUVVVObbk","kOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUk","kOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUUuOOOqUUk","kOOOOUUUUOOOOUUUUOOOOUUUUOOOOUUUUOOOOUUUUOOOOUUk",".kqqkkuukkqqkkuukkqqkkuukkqqkkuukkqqkkuukkqqkkuk","..kkNGk0..11C200..11..003P11P300..11..00.kkkk.k.","...kNGk..45ahX6444.4444.3P33P3...4444.444kNGk...","...kNGk.4M4aaQ7MMM4MMMM43P33P3..4MMMM4MMMMkGk...","...kNGk.8fY557hIII9fWWW!33w333..8fJJJ@fYYYkGk...","...kNGk.#YYYY#IIII9WWWW!PP3PPP3.@JJJJ@YYYYkGk...","...kNGkx#YYYY#IIII9WWWW!DD$DDD$x@JJJJ@#YYYkGk...","...kNkYSS####S9999Y!!!!S$$x$$$YSS@@@@%L##kNGk...","...kNkGGGGGGGGGGGG#^^^^^GGGGGGGGGGGG&F%B*kNGk...","...kNGk(((()ww-ww^dddddd^www*wwwwwwww&B*xkNGk...","...kNkTccccT)wRw^dddddddd^wwBww)wwww&F*F&kNGk...","...kNkTTTTTT)wWR-EEEEEAAA+wwFBwTTww-RRRRRkNGk...","...kNkTccccT)xCx=EEEEEAAA+xxBxxUUxx-RRRRRkNGk...","..kkkkTTTTTTkkkkkkEEEEAAkkkkkkkkkkkkRRRRRkkkkk..",".kcbbbkkkkkkcbbbbckkkkkkbbbcbbbbcbbbkkkkkbcbbbk.",".kSYSSMSSSYSSMSSSYSSMSSSYSSMSSSYSSMSSSYSSMSSSYk.",".kGkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkGk.","..kGSSSSSSSSSSSSSSSSkkkkkkkkSSSSSSSSSSSSSSSSGk..","..kGNYNNNNGNNNNNYNNkcccccccUkNNYGNNNNNNNNNYGGk..","..kGNNHHHNNNNNNNNNkcbbbGGbbbUkNNNNHHHNNNNNNNGk..","..kMMMMMMMMMGGGCGGkcGGbbbbGGUkGMMMMMMMMMMMGGGk..","..kMNNNNkkNNNNNNNNkcbbbbbbbbUkNNNNNNNkkNNNNNCk..","..kMNYkkGGkkNNHHHNkcbbGGGGbbUkNNNNNkkGGkkNYNCk..","..kMNkGGGGGGkNNNNNkcbGGGGGGbUkHHNNkGGGGGGkNNCk..","..kMkGGNNHNGGkCCGGkUbbGGGGbbUkGMMkGGNNHNGGkCCk..","..kMkGNNXHNNGkNNNNNkUUUUUUUUkNNNNkGNNNXNNGkNCk..","...kGGNNNHNNGCkkkkkkkkkkkkkkkkkkkMGNNNHNNGGkk...","...kMGHHHHHHCCk.................kMMHHHHHHGCk....","....kGNNNHNNCk...................kGNNNHNNGk.....","....kGCNNHNCCk...................kGGNNHNCCk.....",".....kCCCCCCk.....................kCCCCCCk......","......kkCCkk.......................kkCCkk.......","........kk...........................kk........."],"pal":{"A":"#3c3a48","B":"#4a9a34","C":"#5a3a20","D":"#5a5e68","E":"#6a6774","F":"#6cc048","G":"#7a4e2a","H":"#7a5232","I":"#7ab0d8","J":"#8ac070","L":"#8ad868","M":"#9a7a5a","N":"#a06e40","O":"#a8303a","P":"#a8aeb8","Q":"#b07a20","R":"#b8603a","S":"#c89260","T":"#c8b898","U":"#d4c4a4","V":"#d84a4a","W":"#d87a5a","X":"#d8a030","Y":"#e8c070","Z":"#f07060","a":"#f2c84a","b":"#f4ead6","c":"#fbf4e4","d":"#ffc080","e":"#ffe9a0","f":"#fff4d8","g":"#fffaf0","k":"#0b0a0e","q":"#7a2028","u":"#b8a888","w":"#4a2e1a","x":"#36200f","y":"#ffd8a0","z":"#8a5e36","m":"#e8a878","n":"#4a3a2e","h":"#fff8e0","0":"#726854","1":"#4b1318","2":"#372313","3":"#686b72","4":"#5f4b37","5":"#967c2d","6":"#85631d","7":"#6d4b13","8":"#9e9785","9":"#4b6d85","!":"#854b37","@":"#557745","#":"#8f7745","$":"#373a40","%":"#558540","^":"#9e774f","&":"#42772c","*":"#2d5f20","(":"#9b978d",")":"#7c725e","-":"#723b23","+":"#25232c","=":"#413f47"}},"barrel":{"rows":["....kkkkkkkk....","..kkTTTTTTTTkk..",".kUTAATTTTTTUDk.",".kUTTTTUTTTUUDk.",".kDUUUUUUUUUUEk.","kJIIIIIIIIJJJLLk","kLJJJJJJJJJJLLLk","kCBABCBBBCCCEDEk","kCBAACBBBCCDEDEk","kCBABCBBBCCCEDEk","kCBAACBBBCCDEDEk","kJIIIIIIIIJJJLLk","kLJJJJJJJJJJLLLk",".kBABCBBBCCCEDk.",".kDDDDDDDDDDEEk.","..kkkkkkkkkkkk.."],"pal":{"k":"#0b0a0e","A":"#fde2b4","T":"#e8b47a","U":"#c48a52","B":"#d99c62","C":"#b47640","D":"#8e5a2c","E":"#663c1a","I":"#f4f6fa","J":"#b4bac6","L":"#747a88"}},"sack":{"rows":["...kkkkkkkkkk...........","..kCECCECCEDDk..........","..kADBBDBBDCDk..........","..kAABCCBCCCEk..........","..kAABBBBBCCDk..........",".kAABBBBBCBCCDk.........",".kABCBBBBCDCCDk.........",".kAABBBBBCkkkkkkkkkkk...",".kAABBBBBkAAABBBBBCCCk..",".kAABBCCBkBBBBBBBBCCCk..",".kAABBBBBkDEEEEEEEEEDk..","..kAABBBBkAABBBBBBCCCDk.","..kAABBBBkAABBBBBCBCCDk.","..kCCCCCCkAABBBBBBCCCDk.","...kkkkkkkCCCCCCCCDDDDk.","..........kkkkkkkkkkkk..","........................"],"pal":{"k":"#0b0a0e","A":"#f2dc9c","B":"#dfc27a","C":"#c6a45c","D":"#a08040","E":"#7c6030"}}},"dishes":{"atk":{"n":"잉걸불 고추 스튜","rows":["............................","............ss..............","...........ssSS.....ss......",".....ss.....SS.....ssSS.....","....ssSS........kk..SS......",".....SS........kGGk.........",".............kkgGGk.........","............kCCCgk..........",".........kkkrrrCrkk.........",".....kkkkDDcrcrccDDkkkk.....","....krccDcDccrcDdDDDDcDk....","...kRCCrUUCrrccDMurYycrck...","..kooRRRUURCrrcccrrrrrrTTk..","..ktTMMMTTTtoottootTMUUUMk..","...kMMUMttMTttMTttMMUUuUk...","...kTTTTTTTMTTTMTTTMMUUuk...","....ktTTTTTTTTTTTTMTUUUk....",".....ktTTMTMTMTMTMMUUuk.....","......kTTMMMUMUUUUmmmk......",".......kkMMUMUUuummkk.......",".........kkMUummVkk.........","..........kUummVVk..........","...........kkkkkk...........","............................"],"pal":{"k":"#0b0a0e","s":"#f2f3f8","S":"#bcc0cc","P":"#fbf6ea","p":"#ddd4c2","q":"#aaa190","Q":"#6e675c","o":"#f0b088","t":"#e09460","T":"#c0703e","U":"#8a4424","u":"#6e341c","V":"#4e2414","R":"#ff7448","r":"#d8341e","D":"#8e1a12","Y":"#ffd070","y":"#ff9a50","M":"#b06a3e","m":"#7a3a20","N":"#4e2414","C":"#ff5a3a","c":"#d42818","d":"#8a1410","G":"#7cc458","g":"#3e7a2c"}},"spd":{"n":"바람 허브 꼬치","rows":["............................","........................kk..",".......................kHHk.","......................kHHhk.",".....................kHhJk..","..................kkkkhJk...",".sSSS............kOOokknnk..","..............kkkOOooZnNNk..","..........kkkkMMmOooZZNkk...","...sSS...kHHhMMmmooooZk.....","......kkkHHhhMmmDDZZZk......",".....kMMmHHhhmmDmDkkk.......","....kMMmDhhhJJmDDk..........","....kMmmmDhJJkkkk...........","...kkmmmDDkkk...............","..knnnmDmk..................","..kNNNkkkkkkkkkkkkkkkkkkkk..",".kWWWWWWWWWWWWWWWWWWWWWwwvk.",".kWWwwvwvwvwwwvwvwvwwwvvvvk.",".kwvwvwvwvwwwvwvwvwwwvvvvvk.",".kvvvvvvvvvvvvvvvvvvvvvvVVk.","..kkkkkkkkkkkkkkkkkkkkkkkk..","............................","............................"],"pal":{"k":"#0b0a0e","s":"#f2f3f8","S":"#bcc0cc","P":"#fbf6ea","p":"#ddd4c2","q":"#aaa190","Q":"#6e675c","W":"#e0b078","w":"#b8875a","v":"#80583a","V":"#4e3420","n":"#f2dcae","N":"#b8946a","M":"#d07a44","m":"#9a4e2a","D":"#5e2a16","H":"#8ad468","h":"#4e9e3c","J":"#2e6a24","O":"#f4d070","o":"#d8a43c","Z":"#a06c20"}},"hp":{"n":"든든한 고기 파이","rows":["............................","................ss..........",".........ss....ssSS.........","........ssSS....SS..........",".........SS.................","............................","............kk..............","........kkkkHHkkkkkk........",".....kkkCYYChHCYYycckkk.....","....kyyyCYYyyFCYYyFccFyk....","...kCCyyCCCCyyCCCyccFyyyk...","...kCCCCCyyCYCCyyMGGGMGGk...","....kCYYyyFyYYyyFyyGMMGGk...","...kYCCyyyyyCyyFyyyFMGGMk...","...kCCFFFFcFFFcFFFcccMMMk...","...kCFcfcfcfcfcfcfcfcBMmk...","..kkccffBfBfBfBfBfBfBBBmkk..",".kPPcffBBBBBBBBBBBBBBBBpppk.",".kppppqpqpqpqpqpqpqpqpqpppk.","..kkkqqqqqqqqqqqqqqqqqqkkk..","...kQQQQQQQQQQQQQQQQQQQQk...","....kkkkkkkkkkkkkkkkkkkk....","............................","............................"],"pal":{"k":"#0b0a0e","s":"#f2f3f8","S":"#bcc0cc","P":"#fbf6ea","p":"#ddd4c2","q":"#aaa190","Q":"#6e675c","Y":"#fad888","y":"#dca452","F":"#d89a4a","f":"#a86a28","C":"#e0a050","c":"#b87a32","B":"#7a4818","M":"#b8442e","m":"#7a2418","G":"#d8763e","H":"#7cc458","h":"#3e7a2c"}},"stam":{"n":"깃털 수플레","rows":[".....................kk.....","....................kFFk....","...................kFFfk....","............kkkk..kFFfk.....",".........kkkyyyykknffk......",".......kkyyyyyLLYYnkk.......","......kyyyyyyyYYYYYYYk......",".....kyyyLLYYYYYYYYYYYk.....",".....kyyyYYYcccYYLLYcck.....",".....kyYYYYYYYYYYcYccck.....",".....kYYYYYYYYcccccccck.....","......kYYYYYYYYcYcccck......",".....kYYYYYYcYcYcYcccck.....","......kWWwWwYcYcWwVVVk......","......kWWwWwWwWwWwVVVk......","......kWWwWwWwWwWwVVVk......","......kWWwWwWwWwWwVVVk......","......kWWwWwWwWwWwVVVk......","....kkkWWwWwWwWwWwVVVkkk....","...kPPPWWwWwWwWwWwVVVpppk...","...kppppqpqpqpqpqpqpqpppk...","....kkkqqqqqqqqqqqqqqkkk....",".....kQQQqQQQqQQQqQQQQk.....","......kkkkkkkkkkkkkkkk......"],"pal":{"k":"#0b0a0e","s":"#f2f3f8","S":"#bcc0cc","P":"#fbf6ea","p":"#ddd4c2","q":"#aaa190","Q":"#6e675c","W":"#fcf9f2","w":"#e0d8ca","V":"#a69c8a","Y":"#f2c462","y":"#ffe6a4","c":"#c88a30","L":"#fffdf6","F":"#a8e0f8","f":"#4a9cd4","n":"#f2ead8"}},"cd":{"n":"종소리 푸딩","rows":["............................","............................","............................","..............kk............",".............kHHk...........","............khHk............","..........kkkkhkkk..........",".........kDLLCCBCBk.........","........kDDCCCCCBBBk........",".......kDDDCCCCCCBBBk.......",".......kyCCYCCYYBCcck.......","....S..kyCCYCCYYCBcck..S....","...S..kyyCCYYYYYBBccck..S...","....S.kyyyyYYYYYYcYcck.S....","......kyyyYYYYYYYYccck......",".....kyyyYYYYYYYYYYccck.....",".....kyyYYYYYYYYYYcccck.....",".....kyyyYYYYYYYYYYccck.....","..kkkyyyYYYYYYYYYYYYccckkk..",".kPPPyyyyYYYYYYYYYYYYccpppk.",".kppppqpqpqpqpqpqpqpqpqpppk.","..kkkqqqqqqqqqqqqqqqqqqkkk..","...kQQQQQqQQQqQQQqQQQqQQk...","....kkkkkkkkkkkkkkkkkkkk...."],"pal":{"k":"#0b0a0e","s":"#f2f3f8","S":"#bcc0cc","P":"#fbf6ea","p":"#ddd4c2","q":"#aaa190","Q":"#6e675c","y":"#fff2b0","Y":"#f2d474","c":"#c8a040","D":"#e09048","C":"#aa5c1e","B":"#6a3210","L":"#ffe8b8","H":"#7cc458","h":"#3e7a2c"}}},"paw":["....kk.kk....","...kLPkLPk...",".kkkPDkPDkkk.","kLPkkk.kkkLPk","kPDk.....kPDk",".kk.kkkkk.kk.","..kkLLPPPkk..",".kLLPPPPPPDk.",".kPPPPPPDDDk.","..kDDDDDDDk..","...kkkkkkk..."],"tools":{"ladle":{"rows":["..iiIJJ..",".iiIIIIJ.","iiIIIIIJJ","iIIIIIJJJ","IKKKKKKKJ",".JJJJJJJ."],"ax":-1,"ay":4},"blade":{"rows":[".iiiiiI.","iIIIIIIJ","iIKIKIKJ","iIKIKIKJ","iIKIKIKJ","iIIIIIIJ",".IIIIIJ.","...IJ..."],"ax":3,"ay":8},"bowl":{"rows":["SsSSsSS","wWWWWWd","WwwwwwD",".wwwwD.","..DDD.."],"ax":3,"ay":5}},"tpal":{"i":"#e8ecf2","I":"#a8aeb8","J":"#5a5e68","K":"#3a3e48","S":"#f07e3c","s":"#ffc080","W":"#fbf4e4","w":"#e4d6ba","d":"#c8b898","D":"#9a8a6c"}};
  // v3.19 외곽선 기준: 채소 상자 안 채소끼리 · 채소와 상자 사이 검은 선 → 제 색을 어둡게 (바깥 실루엣 · 상자 테는 그대로)
  if (window.DEOUT !== false) { const S = D.props.crate, g = S.rows.map(r => r.split('')); deOutlineGrid(g, S.pal, 0, 0, g[0].length - 1, 8, { bg: [] }); S.rows = g.map(r => r.join('')); }
  // ---- 칸 그림 → 캔버스 (2px 칸)
  const CV = {};
  function cv(key, rows, pal, s = 2) {
    const ck = key + ':' + s; if (CV[ck]) return CV[ck];
    const w = Math.max(...rows.map(r => r.length)), h = rows.length, c = document.createElement('canvas'); c.width = w * s; c.height = h * s;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch === '.' || !pal[ch]) continue; g.fillStyle = pal[ch]; g.fillRect(x * s, y * s, s, s); } });
    return (CV[ck] = c);
  }
  const feetX = rows => { const r = rows[rows.length - 1]; let a = -1, b = -1; for (let x = 0; x < r.length; x++) if (r[x] !== '.') { if (a < 0) a = x; b = x; } return (a + b + 1) / 2; };

  // ---- 큰 솥 (칸 30×22): 키륵 연구소 가마솥과 같은 방식 — 구 법선 음영 + 2칸 디더, 두꺼운 타원 테, 안쪽 벽과 동그란 국물
  const PW = 34, PH = 23, PCX = 17;
  const IRP = ['#c4c2d4', '#8c8a9e', '#666478', '#4a485c', '#343246', '#232132', '#15131e']; // 쇠 (0 = 반짝)
  const STW = ['#ffd090', '#ffa858', '#f07e3c', '#cc5a2a', '#9a401c', '#6a2a12'];          // 국물
  const BY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], dq = (x, y) => BY4[((y & 3) << 2) | (x & 3)] / 16;
  let POT = null;
  function potCanvas() {
    if (POT) return POT;
    const g = Array.from({ length: PH }, () => Array(PW).fill(null));
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < PW && y < PH) g[y][x] = c; };
    // 단계 사이만 좁게 디더 (넓은 면은 단색) — 키륵 가마솥 방식
    const ramp = (P, f, x, y) => { const fl = Math.floor(f), fr = f - fl, t = Math.max(0, Math.min(1, (fr - 0.3) / 0.4)); return P[Math.max(0, Math.min(P.length - 1, fl + (t > dq(x, y) ? 1 : 0)))]; };
    const E = (x, y, cx, cy, rx, ry) => [(x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry];
    // 둥근 배: 구 법선 음영 (왼쪽 위 빛)
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const [nx, ny] = E(x, y, PCX, 12.8, 14.2, 9.8); if (nx * nx + ny * ny > 1) continue;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), l = -nx * 0.6 - ny * 0.35 + nz * 0.75;
      put(x, y, ramp(IRP, 4.3 - l * 3.8, x, y));
    }
    for (const [x, y] of [[8, 11], [9, 11], [8, 12], [10, 10], [11, 10]]) put(x, y, IRP[0]);    // 반짝 (덩어리)
    for (let i = 0; i < 6; i++) { const q = 0.25 + i * 0.13, x = Math.round(PCX + Math.cos(q) * 13.2 - 0.5), y = Math.round(12.8 + Math.sin(q) * 8.8 - 0.5); put(x, y, IRP[3]); } // 오른쪽 아래 되비침 (불빛)
    // 귀 손잡이: 동그란 고리
    for (const s of [-1, 1]) { const bx = s < 0 ? 0 : PW - 3;
      [[1, 0], [0, 1], [2, 1], [0, 2], [2, 2], [1, 3]].forEach(([dx, dy]) => { const xx = s < 0 ? bx + dx : bx + 2 - dx; put(xx, 8 + dy, IRP[s < 0 ? (dy < 2 ? 1 : 3) : (dy < 2 ? 3 : 5)]); }); }
    // 입구 테: 두꺼운 둥근 고리 — 윗면 빛, 앞쪽 두께 띠, 테 밑 홈
    for (let y = 0; y < 13; y++) for (let x = 0; x < PW; x++) {
      const [ox, oy] = E(x, y, PCX, 6.2, 13.0, 5.8), o = ox * ox + oy * oy; if (o > 1) continue;
      const [ix, iy] = E(x, y, PCX, 5.3, 9.8, 3.2), i = ix * ix + iy * iy;
      if (i > 1) {
        const band = oy > 0.5;                                                                   // 앞쪽 두께 (2칸 띠)
        put(x, y, band ? (ox < -0.5 ? IRP[1] : ox < 0.3 ? IRP[2] : ox < 0.7 ? IRP[3] : IRP[4])
                       : (oy < -0.2 && ox < 0.1 ? IRP[1] : ox < 0.5 ? IRP[2] : IRP[3]));
        continue;
      }
      // 안쪽: 뒤쪽 벽(그늘) + 동그란 국물
      const [sx, sy] = E(x, y, PCX, 5.9, 9.4, 2.7), si = sx * sx + sy * sy;
      if (si > 1) { put(x, y, iy < 0 ? IRP[6] : IRP[5]); continue; }
      const ln = -sx * 0.55 + sy * 0.45;                                                          // 앞·왼쪽 밝게, 뒤쪽은 벽 그늘
      put(x, y, ramp(STW, 2.3 - ln * 2.0 + (sy < -0.5 ? 1.6 : 0), x, y));
    }
    // 테 밑 홈: 테 바깥 타원을 따라 동그랗게 이어지는 짙은 줄 (아래쪽 반 바퀴 → 양옆으로 올라감)
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const [ox, oy] = E(x, y, PCX, 6.2, 13.0, 5.8), o = ox * ox + oy * oy, [gx, gy] = E(x, y, PCX, 6.2, 14.0, 6.9), go = gx * gx + gy * gy;
      if (o > 1 && go <= 1 && oy > -0.5 && g[y][x]) { const f = oy > 0.45 ? 5 : oy > 0.1 ? (dq(x, y) < 0.5 ? 5 : 4) : oy > -0.2 ? 4 : (dq(x, y) < 0.5 ? 4 : 3); put(x, y, IRP[f]); } // 뒤로 갈수록 살짝 흐리게 (2칸 디더로 넘김)
    }
    for (const [x, y] of [[8, 3], [9, 3], [7, 4]]) put(x, y, IRP[0]);                             // 테 반짝
    // 건더기 · 기름 (2칸 덩어리)
    for (const [x, y, c] of [[12, 5, '#f8b040'], [13, 5, '#c87418'], [19, 5, '#7cc458'], [20, 5, '#3e7a2c'], [16, 7, '#f4ead0'], [17, 7, '#cfc2a4'], [21, 7, '#f8b040'], [22, 7, '#c87418'], [10, 6, '#ffe0b0']]) put(x, y, c);
    // 1칸 외곽선
    const out = g.map(r => r.slice());
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { if (g[y][x]) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < PH && xx >= 0 && xx < PW && g[yy][xx]) { out[y][x] = '#0b0a0e'; break; } } }
    const c = document.createElement('canvas'); c.width = PW * 2; c.height = PH * 2; const cx = c.getContext('2d');
    out.forEach((r, y) => r.forEach((col, x) => { if (col) { cx.fillStyle = col; cx.fillRect(x * 2, y * 2, 2, 2); } }));
    return (POT = c);
  }
  // 김 (키륵 등장 연기처럼): 동글동글한 연기 덩이가 피어오르며 커지고, 칸이 성겨지며 사라짐
  const B4S = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function steam(x, y) { // 쿠오 뒤에서 피어올라 머리 위로 올라옴
    const N = 4; // v3.25 고양이 귀 연기: 덩이마다 귀가 보이게 수를 줄이고 간격을 벌림
    for (let i = 0; i < N; i++) {
      const k = (time * 0.26 + i / N) % 1, sw = Math.sin(time * 1.1 + i * 2.1) * (2 + k * 7);
      const cx = Math.round((x + [-3, 4, -4, 3][i] + sw) / 2), cy = Math.round((y - 4 - k * 72) / 2), r = 2.8 + k * 3.4;
      // v3.25 연기 덩이마다 고양이 귀 두 개 (쿠키 · 쿠오의 비스트로) — 동그라미 위 양옆에 뾰족한 삼각형
      const ear = (xx, yy) => { for (const sd of [-1, 1]) { const u = (xx * sd - r * 0.22) / (r * 0.7), v = (-yy - r * 0.55) / (r * 0.8); if (u >= 0 && u <= 1 && v >= 0 && v <= 1 - Math.abs(2 * u - 1) * 1.05) return true; } return false; };
      for (let yy = -Math.ceil(r * 1.4); yy <= Math.ceil(r); yy++) for (let xx = -Math.ceil(r); xx <= Math.ceil(r); xx++) {
        const q = Math.hypot(xx, yy * 1.15) / r, E = q > 1 && ear(xx, yy); if (q > 1 && !E) continue;
        const gx = cx + xx, gy = cy + yy, th = B4S[((gy & 3) * 4) + (gx & 3)] / 16;
        if (!E && q > 0.78 && th < (q - 0.78) * 4 && yy > -r * 0.5) continue; // 가장자리만 살짝 성기게 (귀 사이 윗변은 또렷하게)
        if (th < (k - 0.6) * 2.4) continue;                          // 끝무렵에 옅어지며 사라짐
        ctx.fillStyle = yy < -r * 0.25 ? '#f0f2f6' : yy < r * 0.35 ? '#ccd0d8' : '#a2a8b4';
        ctx.fillRect(gx * 2, gy * 2, 2, 2);
      }
    }
  }
  function drawPot(b) {
    const x = Math.round(b.x) & ~1, y = Math.round(b.y) & ~1, P2 = (px, py, c) => { ctx.fillStyle = c; ctx.fillRect(px & ~1, py & ~1, 2, 2); };
    { const rb = srArt('ringBack', G.stage, SR.ringBack); ctx.drawImage(rb, x - rb.width / 2, y - rb.height + 4); }
    for (const sx of [-1, 1]) for (let i = -6; i <= 6; i++) { const px = x + i * 2, py = y - 6 + Math.round(i * sx * 0.5) * 2; P2(px, py - 2, '#140c08'); P2(px, py, Math.abs(i) < 2 ? '#2a1a10' : '#8a6038'); P2(px, py + 2, Math.abs(i) < 3 ? '#ff7020' : '#3a2416'); P2(px, py + 4, '#140c08'); }
    // 솥 밑을 감싸는 불꽃
    const ft = Math.floor(time * 10), nz = (a, c) => { const v = Math.sin(a * 12.9898 + c * 78.233 + ft * 3.1) * 43758.5453; return v - Math.floor(v); };
    for (let xx = -30; xx <= 30; xx += 2) { const e = Math.abs(xx) / 30, h = Math.round((0.6 + e * 0.6) * (8 + 10 * nz(xx, 1)) / 2) * 2; // 솥 뒤에서 양옆으로 솟음
      for (let yy = 0; yy < h; yy += 2) { const kk = yy / Math.max(2, h); if (nz(xx, yy) < 0.25) continue; P2(x + xx, y - 6 - yy, kk < 0.35 ? '#ffd060' : kk < 0.7 ? '#ff8a2a' : '#e2501c'); } }
    const pc = potCanvas(), px = x - PCX * 2, py = y + 4 - pc.height; // 둥근 바닥이 돌 둘레 안에 묻힘
    ctx.drawImage(pc, px, py);
    // 끓는 거품: 동그란 수면 안에서 생겼다 터짐 (2칸)
    for (let i = 0; i < 3; i++) { const t = (time * 0.9 + i * 0.41) % 1, n = Math.floor(time * 0.9 + i * 0.41), bx = px + (11 + ((i * 5 + n * 7) % 12)) * 2, by = py + (5 + (i % 2)) * 2;
      if (t < 0.25) { P2(bx, by, '#ffc080'); P2(bx + 2, by, '#e0783c'); } else if (t < 0.6) { P2(bx, by - 2, '#ffe0b0'); P2(bx + 2, by - 2, '#ffc080'); P2(bx - 2, by, '#ffc080'); P2(bx, by, '#f49a4c'); P2(bx + 2, by, '#f49a4c'); P2(bx + 4, by, '#c0582c'); } else if (t < 0.8) { P2(bx - 2, by - 2, '#ffe0b0'); P2(bx + 4, by - 2, '#ffc080'); P2(bx, by, '#94401e'); P2(bx + 2, by, '#94401e'); } }
    { const rf = srArt('ringFront', G.stage, SR.ringFront); ctx.drawImage(rf, x - rf.width / 2, y - 4); }
    if (Math.random() < 0.3) G.parts.push({ x: x + pick([-1, 1]) * rand(26, 32), y: y - 10, vx: rand(-10, 10), vy: -rand(20, 40), t: rand(0.4, 0.8), c: pick(['#ffb050', '#ff7030']), g: 0, glow: true });
  }

  // ---- 쿠오 · 쿠키 (플레이어와 같은 숨 고르기 · 깜빡임)
  const CAT_LINES = {
    kuo: ['오늘의 메뉴다. 골라라.', '맛은 보장한다.', '불 앞에선 조용히.'],
    cookie: ['어서 오세요! 따끈따끈해요!', '쿠키 · 쿠오의 출장 비스트로, 개점이에요!', '배고프면 싸움도 못 해요!'],
  };
  const CAT_DONE = { kuo: ['잘 먹었으면 됐다.', '다음 불가에서 보자.'], cookie: ['또 오세요!', '배부르면 힘이 나요!'] };
  const sent = l => l.split(/(?<=[.!?])\s+/).filter(Boolean);
  // F 대화: 멈춰 서서 한 문장씩 넘겨 듣기 (말 걸 때마다 다음 대사)
  const TALKS = {
    kuo: ['국물은 귀로 듣는 거다. 보글보글 소리가 낮아지면 불을 줄인다. 너는 몰라도 된다. 먹기만 해라.',
      '원정대가 가는 곳이면 어디든 간다. 솥이 무거워도 간다. 빈속으로 싸우는 건 못 본다.',
      '국자는 무기가 아니다. 휘두르면 꽤 아프긴 하다. 그러니 줄은 잘 서라.'],
    cookie: ['저희 요리는요, 먹으면 힘이 나고 발이 가벼워져요! 진짜예요! 쿠키가 맛은 보장한대요!',
      '재료는 오는 길에 다 구했어요! 당근은 초원에서, 양배추는 성채 텃밭에서요. 고기는 묻지 마세요!',
      '기록 보관소의 코코아 님이 저희 요리법을 적어 갔어요! 용족이라던데, 제 눈엔 도마뱀 같았어요. 이건 비밀이에요!'],
  };
  const TK = { kuo: 0, cookie: 0, on: null };
  const TALK = { who: 'cookie', q: [], cur: null, until: 0, next: 0, near: false };
  function catTalk(R, near) {
    const T = TALK;
    if (near && !T.near && time >= T.next - 6) { T.who = 'cookie'; T.q = sent(pick(R.used ? CAT_DONE.cookie : CAT_LINES.cookie)); T.until = 0; }
    else if (near && time >= T.next && !T.q.length && T.until <= time) { T.who = T.who === 'kuo' ? 'cookie' : 'kuo'; const L = (R.used ? CAT_DONE : CAT_LINES)[T.who]; T.q = sent(pick(L)); }
    T.near = near;
    if (T.until <= time && T.q.length) { T.cur = T.q.shift(); T.until = time + Math.max(2.2, 1 + T.cur.length * 0.08); if (!T.q.length) T.next = T.until + rand(5, 8); }
    return T.until > time ? { who: T.who, line: T.cur } : null;
  }
  // ---- 도구 (손잡이 + 머리): 앞발(0,0)에서 끝 칸(ex, ey)까지 2칸 굵기 선, 끝에 머리. 각도마다 칸 그림으로 캐시
  const TC = {};
  function toolCv(head, ex, ey, noLine) {
    const ck = head + ':' + ex + ':' + ey + ':' + (noLine ? 1 : 0); if (TC[ck]) return TC[ck];
    const cells = new Map(), put = (x, y, c) => cells.set(x + ',' + y, [x, y, c]);
    if (!noLine) {
      const n = Math.max(Math.abs(ex), Math.abs(ey)), steep = Math.abs(ey) >= Math.abs(ex);
      for (let i = 0; i <= n; i++) { const x = Math.round(ex * i / n), y = Math.round(ey * i / n), wood = i < 3;
        const a = wood ? '#8a5a32' : '#e8ecf2', b = wood ? '#5a3a20' : '#5a5e68';
        if (steep) { put(x, y, a); put(x + 1, y, b); } else { put(x, y, a); put(x, y + 1, b); } }
    }
    if (head) { const H = D.tools[head]; H.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') put(ex - H.ax + i, ey - H.ay + j, D.tpal[r[i]]); }); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of cells.values()) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    x0--; y0--; x1++; y1++;
    const c = document.createElement('canvas'); c.width = (x1 - x0 + 1) * 2; c.height = (y1 - y0 + 1) * 2; const g = c.getContext('2d');
    g.fillStyle = '#0b0a0e';
    for (const [x, y] of cells.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has((x + dx) + ',' + (y + dy))) g.fillRect((x + dx - x0) * 2, (y + dy - y0) * 2, 2, 2);
    for (const [x, y, col] of cells.values()) { g.fillStyle = col; g.fillRect((x - x0) * 2, (y - y0) * 2, 2, 2); }
    return (TC[ck] = { c, ox: x0, oy: y0 });
  }
  // 쿠오: 솥 젓기 (국자 머리는 국물 속) 4자리 × 2바퀴 → 들어 올려 국물 똑 (머리 보임)
  // 솥 뒤쪽 테 가운데에 올라선 쿠오: 앞쪽 국물 속을 젓기
  const STIR = [[-1, 4], [2, 5], [5, 4], [2, 3]]; // 끝 칸이 늘 국물 속 (솥 밖으로 안 나옴)
  const kuoPose = (t, step = 0.15) => ({ e: STIR[Math.floor(t / step) % 4], head: null, dip: true });
  // 쿠키: 뒤집개를 박자에 맞춰 까딱 (쿠오와 엇박)
  const cookiePose = t => ({ e: Math.floor(t / 0.3) % 2 ? [-5, -8] : [-6, -7], head: 'blade' });
  // ---- 쿠오 상태: 땅(까딱) → 가끔 점프로 솥 뒤 테에 올라가 젓다가 내려옴. 주문하면 어느 상태에서든 자연스럽게 요리로 넘어감
  //   ground → up(웅크림 0.12 + 점프 0.44) → pot(평소: 0.15초 칸으로 4바퀴 / 주문: 0.12초 칸으로 2바퀴 → 국자 꺼냄 → 요리) → down(점프 0.44) → ground
  const SERVE = { k: null, want: false, popT: -9 }, JUMP = 0.44, CROUCH = 0.12;
  const K = { room: null, ph: 'ground', t: 0, mode: 'idle', next: 0, liftT: 0 };
  function kuoTick(R) {
    if (K.room !== R) { K.room = R; K.ph = 'ground'; K.t = time; K.mode = 'idle'; K.next = time + rand(3, 5); SERVE.want = false; SERVE.popT = -9; }
    const dt = time - K.t;
    if (K.ph === 'ground') { if (SERVE.want || (time >= K.next && !TK.on)) { K.ph = 'up'; K.t = time; K.mode = SERVE.want ? 'serve' : 'idle'; if (SERVE.want) SERVE.want = false; } }
    else if (K.ph === 'up') { if (SERVE.want) { K.mode = 'serve'; SERVE.want = false; } if (dt >= CROUCH + JUMP) { K.ph = 'pot'; K.t = time; K.liftT = 0; } }
    else if (K.ph === 'pot') {
      if (SERVE.want && K.mode === 'idle') { K.mode = 'serve'; K.t = time; SERVE.want = false; }       // 젓던 중에 주문: 그 자리에서 두 바퀴부터
      if (K.mode === 'idle' && dt >= 2.4) { K.ph = 'down'; K.t = time; }
      if (K.mode === 'serve') {
        if (!K.liftT && dt >= 0.96) { K.liftT = time; SERVE.popT = time + 0.46; }                   // 두 바퀴 → 국자 꺼냄 → 0.46초 뒤 요리
        if (K.liftT && time >= SERVE.popT + 1.36) { K.ph = 'down'; K.t = time; }
      }
    }
    else if (K.ph === 'down') { if (dt >= JUMP) { K.ph = 'ground'; K.t = time; K.mode = 'idle'; K.next = time + rand(6, 10); } }
  }
  const kuoOnPot = () => K.ph === 'pot';
  const serving = () => K.mode === 'serve' || SERVE.want || time < SERVE.popT + 1.6;
  // 쿠오 자리: 땅(솥 왼쪽) ↔ 솥 뒤 테 가운데, 사이는 포물선 점프
  function kuoAt(B) {
    const g = B.kuo, p = B.kuoPot, dt = time - K.t, arc = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 26, sh: null });
    if (K.ph === 'up') return dt < CROUCH ? { x: g.x, y: g.y, sh: g.y } : arc(g, p, Math.min(1, (dt - CROUCH) / JUMP));
    if (K.ph === 'pot') return { x: p.x, y: p.y, sh: p.y };
    if (K.ph === 'down') return arc(p, g, Math.min(1, dt / JUMP));
    return { x: g.x, y: g.y, sh: g.y };
  }
  function poseOf(key) {
    if (key === 'kuo') {
      const dt = time - K.t;
      if (K.ph === 'ground') return { e: Math.floor(time / 0.3) % 2 ? [7, -9] : [8, -8], head: 'ladle' };      // 땅에서 국자를 들고 까딱
      if (K.ph !== 'pot') return { e: [6, -10], head: 'ladle' };                                               // 점프 중엔 국자를 번쩍
      if (K.mode === 'idle') return kuoPose(dt, 0.15);                                                         // 평소 젓기
      if (!K.liftT) return kuoPose(dt, 0.12);                                                                   // 주문: 두 바퀴
      const li = Math.floor((time - K.liftT) / 0.1); if (li < 3) return [{ e: [3, 1], dip: true }, { e: [4, -2], head: 'ladle' }, { e: [4, -4], head: 'ladle' }][li];
      return { e: [4, -5], head: 'ladle', drip: time < SERVE.popT + 0.4 };                                     // 국자를 든 채 요리가 나옴
    }
    const st = time - SERVE.popT;
    if (st >= 0 && st < 1.4) return { e: [st < 0.2 ? -2 : -4, st < 0.2 ? -1 : 1], head: 'bowl', noLine: true, front: true };
    return cookiePose(time + 0.15);
  }
  function drawCat(key, c, say) {
    const F = D.cats[key], n = Math.floor((time + (key === 'kuo' ? 0 : 0.6)) / 0.6) % 2, bt = (time + (key === 'kuo' ? 1.3 : 4.1)) % 8.6, blink = bt < 0.12 || (bt >= 4.3 && bt < 4.42);
    const fk = (n ? 'idle' : 'base') + (blink ? 'B' : ''), rows = F.f[fk], cc = cv(key + fk, rows, F.p), fx = feetX(F.f.base);
    const x = Math.round(c.x - fx * 2) & ~1, y = (Math.round(c.y) - cc.height + 2) & ~1;
    if (c.sh !== null) dshEll(ctx, c.x, (c.sh === undefined ? c.y : c.sh) + 1, 10, 3, 0.5); /* v3.23 디더 그림자 */
    const p = poseOf(key), pw = F.pw[fk], ax = x + pw[0] * 2, ay = y + pw[1] * 2, T = toolCv(p.head, p.e[0], p.e[1], p.noLine);
    if (!p.front) ctx.drawImage(T.c, ax + T.ox * 2, ay + T.oy * 2);         // 도구는 몸 뒤 (앞발이 손잡이를 쥠)
    ctx.drawImage(cc, x, y);
    if (p.front) ctx.drawImage(T.c, ax + T.ox * 2, ay + T.oy * 2);          // 내미는 그릇은 몸 앞
    if (p.dip) { const ex = ax + p.e[0] * 2, ey = ay + p.e[1] * 2, f = Math.floor(time / 0.15) % 2;   // 국자가 들어간 자리 물결
      ctx.fillStyle = '#ffc080'; ctx.fillRect(ex - 4 - f * 2, ey + 2, 4, 2); ctx.fillRect(ex + 4 + f * 2, ey + 2, 4, 2); }
    if (p.drip) { const ex = ax + (p.e[0] + 4) * 2, ey = ay + (p.e[1] + 3) * 2 + Math.floor((time * 10) % 3) * 2; ctx.fillStyle = '#f07e3c'; ctx.fillRect(ex, ey, 2, 4); }
    if (say) drawBubble(say, c.x, ((Math.round(c.y) - F.f.base.length * 2 + 2) & ~1) + 2, 0); // v3.19 자세가 바뀌어도 말주머니 높이는 고정 (기본 자세 키 기준)
  }
  // 고른 요리가 솥 위로 퐁 떠올랐다가 칸이 성겨지며 사라짐
  const DQ = {};
  function dishPop() {
    const st = time - SERVE.popT, b = G.bonfire; if (!SERVE.k || st < 0 || st > 1.3 || !b) return;
    const lv = st < 0.9 ? 0 : Math.min(3, 1 + Math.floor((st - 0.9) / 0.14)), key = SERVE.k + lv;
    if (!DQ[key]) { const d = D.dishes[SERVE.k], base = cv('dish_' + SERVE.k, d.rows, d.pal, 2), c = document.createElement('canvas'); c.width = base.width; c.height = base.height; const g = c.getContext('2d'); g.drawImage(base, 0, 0);
      for (let yy = 0; yy < c.height / 2; yy++) for (let xx = 0; xx < c.width / 2; xx++) if (B4S[((yy & 3) << 2) | (xx & 3)] / 16 < lv / 4) g.clearRect(xx * 2, yy * 2, 2, 2);
      DQ[key] = c; }
    const c = DQ[key], up = Math.min(1, st / 0.3);
    ctx.drawImage(c, (Math.round(b.x - c.width / 2)) & ~1, (Math.round(b.y - 64 - c.height - up * 14)) & ~1);
  }
  // ---- 자리 (모닥불 · 큰 솥 기준) — srPlace에서 부름
  function place(r) {
    const f = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy };
    r.bis = { kuo: { x: f.x - 58, y: f.y + 6 }, kuoPot: { x: f.x - 1, y: f.y - 37 }, cookie: { x: f.x + 58, y: f.y + 6 }, sign: { x: f.x + 106, y: f.y - 12 }, crate: { x: f.x - 74, y: f.y - 48 }, cart: { x: f.x - 156, y: f.y - 36 }, barrel: { x: f.x + 128, y: f.y - 56 }, sack: { x: f.x + 148, y: f.y - 60 } }; // v3.12 출장 식당 소품
    const B = r.bis;
    r.obs.push({ t: 'prop', c: true, x: f.x, y: f.y - 8, r: 26 });
    for (const k of ['kuo', 'cookie']) r.obs.push({ t: 'prop', c: true, x: B[k].x, y: B[k].y - 4, r: 9 });
    const box = (x0, y0, x1, y1) => r.obs.push({ t: 'prop', c: false, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, x0, y0, x1, y1 });
    box(B.sign.x - 16, B.sign.y - 8, B.sign.x + 16, B.sign.y); box(B.crate.x - 23, B.crate.y - 10, B.crate.x + 23, B.crate.y); box(B.cart.x - 46, B.cart.y - 14, B.cart.x + 46, B.cart.y); box(B.barrel.x - 16, B.barrel.y - 12, B.sack.x + 24, B.barrel.y);
  }
  function ents(list) {
    const R = G.dun && G.dun.cur; if (!R || R.type !== 'rest' || !G.bonfire) return;
    const b = G.bonfire, B = R.bis; list.push({ y: b.y, d: () => drawPot(b) }); if (!B) return; kuoTick(R); list.push({ y: b.y + 7, d: () => steam(Math.round(b.x) & ~1, (Math.round(b.y) & ~1) + 4 - potCanvas().height - 2) }); // 김은 늘 같은 자리에서 그대로 피어오르고, 솥 위의 쿠오를 가림
    const P = G.player, near = P && !P.dead && Math.hypot(P.x - b.x, P.y - b.y) < 150, say = mode === 'play' && !TK.on ? catTalk(R, near) : null, quiet = serving(); // 주문 연출 동안은 말풍선 쉼
    for (const k of ['kuo', 'cookie']) list.push({ y: B[k].y, d: () => drawCat(k, k === 'kuo' ? kuoAt(B) : B[k], !quiet && say && say.who === k ? say.line : null) });
    list.push({ y: 1e9, d: dishPop });
    for (const k of ['sign', 'crate', 'cart', 'sack', 'barrel']) list.push({ y: B[k].y, d: () => { const S = D.props[k], c = cv(k, S.rows, S.pal), x = (B[k].x - c.width / 2) & ~1, y = (B[k].y - c.height + 2) & ~1; dshEll(ctx, x + c.width / 2, B[k].y + 1, (c.width - 8) / 2, 3, 0.5); /* v3.23 디더 그림자 */ ctx.drawImage(c, x, y); } });
  }

  // ---- 주문 창: 기존 모닥불 축복 3택1을 요리로
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let PICBG = null;
  function picBg() { // 접시 자리: 2px 칸 4×4 디더로 가운데가 따뜻하게
    if (PICBG) return PICBG;
    const W0 = 140, H0 = 64, c = document.createElement('canvas'); c.width = W0; c.height = H0; const g = c.getContext('2d'), cols = ['#120e15', '#1b1419', '#251b1c', '#30231f', '#3c2b22'];
    for (let y = 0; y < H0; y += 2) for (let x = 0; x < W0; x += 2) { const v = Math.max(0, 1 - Math.hypot((x / W0 - 0.5) / 0.5, (y / H0 - 0.55) / 0.55)), b = B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)] / 16, lv = Math.min(4, Math.floor(v * 4.2 + b)); g.fillStyle = cols[lv]; g.fillRect(x, y, 2, 2); }
    return (PICBG = c.toDataURL());
  }
  const CHEF = ['kuo', 'cookie'];
  // ---- v3.12 메뉴 화면 요리 애니메이션: 그림 속 김 · 바람 줄 · 흔들림 칸을 떼어 내고 움직이는 효과로 다시 그림 (주문 창이 열려 있을 때만)
  const DFX = { atk: { steam: [[6, 5], [13, 3], [21, 4]] }, hp: { steam: [[10, 4], [17, 3]] }, stam: { steam: [[11, 3], [17, 3]] }, spd: { lines: [[1, 6, 4], [3, 9, 3]] }, cd: { jig: [[4, 12, -1], [23, 12, 1]] } };
  const FXC = ['#f2f3f8', '#bcc0cc'], DB = {};
  function dishBase(k) { if (DB[k]) return DB[k]; const d = D.dishes[k], fx = Object.keys(d.pal).filter(c => FXC.includes(d.pal[c].toLowerCase())); return (DB[k] = cv('dishB_' + k, d.rows.map(r => [...r].map(c => fx.includes(c) ? '.' : c).join('')), d.pal, 2)); }
  function drawDish(c, k, t) {
    const g = c.getContext('2d'), fx = DFX[k] || {}, P = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 2, (y + 4) * 2, 2, 2); };
    g.clearRect(0, 0, c.width, c.height); g.drawImage(dishBase(k), 0, 8);
    (fx.steam || []).forEach(([sx, sy], i) => { for (const ph of [0, 0.5]) {               // 김: 작게 솟아 → 둥글게 부풀고 → 흩어짐 (3초)
      const u = (t / 3.0 + ph + i * 0.31) % 1, y = Math.round(sy + 1 - u * 6), x = sx + Math.round(Math.sin(u * 6.28 + i * 2) * 0.8);
      const sh = u < 0.18 ? [[0, 0, 0], [1, 0, 1]] : u < 0.5 ? [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 1]] : u < 0.8 ? [[1, -1, 0], [2, -1, 0], [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 1], [1, 1, 1], [2, 1, 1]] : [[0, 0, 1], [2, 0, 1], [1, 1, 1], [3, 1, 1]];
      for (const [dx, dy, ci] of sh) P(x + dx, y + dy, FXC[ci]); } });
    (fx.lines || []).forEach(([x, y, n], i) => { const o = Math.floor(t * 5 + i * 2) % 6; if (o > 3) return; for (let j = 0; j < n; j++) if (x - o + j >= 0) P(x - o + j, y, j ? FXC[1] : FXC[0]); }); // 바람 줄: 왼쪽으로 흘러감
    (fx.jig || []).forEach(([x, y, s]) => { const o = Math.floor(t * 2.5) % 2 ? s : 0; P(x + o, y - 1, FXC[1]); P(x - s + o, y, FXC[1]); P(x + o, y + 1, FXC[1]); }); // 탱글탱글 흔들림
  }
  let DA = 0;
  function dishAnim() { const ov = document.getElementById('ovRest'); if (!ov || !ov.classList.contains('on')) { DA = 0; return; } const t = performance.now() / 1000; ov.querySelectorAll('canvas.dishCv').forEach(c => drawDish(c, c.dataset.k, t)); DA = requestAnimationFrame(dishAnim); }
  function menu(opts) {
    const win = $('ovRest').querySelector('.win'); win.classList.add('bis');
    const kc = cv('pawP', D.paw, { k: '#0b0a0e', L: '#ffd6e2', P: '#f7a8c2', D: '#d87a9c' }, 2).toDataURL(), cc = cv('pawS', D.paw, { k: '#0b0a0e', L: '#d6f2ff', P: '#94d4f4', D: '#5eaad8' }, 2).toDataURL();
    win.querySelector('h2').innerHTML = `<img class="bisPaw" src="${kc}"><span>${NAME}</span><img class="bisPaw" src="${cc}">`; // 연분홍 발바닥(왼쪽 쿠키) · 하늘색 발바닥(오른쪽 쿠오)
    win.querySelector('p').textContent = ascOn(9) ? '식사를 하면 체력이 절반 회복되고 이로운 효과를 얻습니다.' : '식사를 하면 체력이 모두 회복되고 이로운 효과를 얻습니다.';
    const first = Math.random() < 0.5 ? 0 : 1;
    setTimeout(() => { if (!DA) dishAnim(); }, 0);
    return opts.map((k, i) => { const d = D.dishes[k], who = CHEF[(first + i) % 2], img = '';
      return `<button class="choice dish pf" data-b="${k}"><span class="dishPic" style="background-image:url(${picBg()})"><canvas class="dishCv" data-k="${k}" width="56" height="56"></canvas></span><span class="chef">${who === 'kuo' ? '쿠키의 요리' : '쿠오의 요리'}</span><b>${d.n}</b>${BUFFS[k].d}<br><span class="key">${i + 1}</span></button>`; }).join('');
  }
  let last = null;
  const ate = k => { last = k; SERVE.k = k; SERVE.want = true; };
  const doneText = () => [last && D.dishes[last] ? `「${D.dishes[last].n}」` : '맛있게 먹었습니다', '든든하게 배를 채웠습니다'];
  function lights(list) { const R = G.dun && G.dun.cur; if (!R || R.type !== 'rest' || !R.bis) return; for (const k of ['kuo', 'cookie']) list.push({ x: R.bis[k].x, y: R.bis[k].y - 16, r: 56, a: 0.6, c: '255,190,120', ca: 0.05 }); list.push({ x: R.bis.cart.x - 24, y: R.bis.cart.y - 58, r: 70, a: 0.8, c: '255,200,120', ca: 0.08 }); /* 수레 등불 */ list.push({ x: R.bis.sign.x, y: R.bis.sign.y - 20, r: 44, a: 0.4 }); const st = time - SERVE.popT; if (st >= 0 && st < 1.5 && G.bonfire) list.push({ x: G.bonfire.x, y: G.bonfire.y - 100, r: 60, a: 0.9, c: '255,220,160', ca: 0.08 }); } // 떠오른 요리는 밝게
  function interact() { // 쿠키 · 땅에 있는 쿠오 바로 옆이면 「F 대화하기」 (솥의 「F 주문하기」보다 먼저)
    const R = G.dun && G.dun.cur, P = G.player; if (!R || R.type !== 'rest' || !R.bis || !P || P.dead || TK.on) return null;
    const c = R.bis.cookie; if (Math.hypot(P.x - c.x, P.y - c.y) < 30) return { k: 'bis', who: 'cookie', x: c.x, y: c.y + 16, t: 'F 대화하기' };
    const k = R.bis.kuo; if (K.ph === 'ground' && !serving() && Math.hypot(P.x - k.x, P.y - k.y) < 30) return { k: 'bis', who: 'kuo', x: k.x, y: k.y + 16, t: 'F 대화하기' };
    return null;
  }
  function act(it) {
    const who = it.who, L = TALKS[who][TK[who]++ % TALKS[who].length];
    TALK.q = []; TALK.until = 0; TALK.next = Infinity; TK.on = who;
    TRUTH.talk(sent(L).map(l => [who, l]), () => { TK.on = null; TALK.next = time + rand(5, 8); if (K.ph === 'ground') K.next = Math.max(K.next, time + 2); });
  }
  function spk(who) { const R = G.dun && G.dun.cur; if (!R || !R.bis || (who !== 'kuo' && who !== 'cookie')) return null; const c = who === 'kuo' ? kuoAt(R.bis) : R.bis.cookie; return { x: c.x, y: c.y - 34 }; }
  const NAME = '쿠키 · 쿠오의 출장 비스트로';
  return { _k: () => K, _pot: () => potCanvas(), interact, act, spk, place, ents, lights, menu, ate, doneText, NAME, dishName: k => D.dishes[k] && D.dishes[k].n };
})();
