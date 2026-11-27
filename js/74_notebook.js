'use strict';
// 잿빛 왕관 원정대 — 74_notebook.js : v3.80 원정 수첩 (시안 _시안/원정수첩_시안02.html) · 메모 색연필 밑줄 (시안 _시안/원정수첩_메모_색연필_시안03 · 밑줄은 일자)
//  · 주인공이 대화로 「들은 것」을 그대로 적어 두는 수첩 — 힌트 · 진행 상태 · 빈칸 없음 (기억하기 위한 기능)
//  · 여는 방법: N 키 · 인벤토리(I) 아래 「원정 수첩」 단추 · 닫기: N / ESC
//  · 탭: N번째 밤(이번 판에 들은 것) · 소문(음유시인 · 정보원) · 진실 기록(양피지 · 판이 바뀌어도 남음, F로 다시 펼침) · 해(「해」가 나온 말)
//  · 적는 곳: TRUTH.talk(11d) 시작 · 엠브라즈 대화(36_ruin)가 끝날 때 → NOTEBOOK.heard(lines) · 아래 TITLE 표에 있는 대화만 적음
const NOTEBOOK = (() => {
  const POR = {"kirk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAOCAYAAAAi2ky3AAABTklEQVR4AYSRIUtDcRTFjy8YDCIGMYgMk8Egpn2C4ScwmPwGwoKIwWAQMYiWZfOyQRaMsiDDYBDDeIhZxLC6vd9l5+394Y2Nd94999zzP+/yX6Y5v9X1lXEd5thVG0TA1+BFVZzc7AswU80vYwA8g3PAvetF6y5o86ghPNEULziIjTxEcMh1ry2j8CdP1Q9nmP3/jpb63VwIABE8NCUAJ5DKVrsHa9DSz1kyYiMIAghX8TrtS6Cg8RAGPgd/0eMFnEWIIAgCeDx/p9Vl61bwKtAYOgA/PSiDaAwOX/XO4l/izgw0e7hPc2oSxHBv+1DgrbOp4+WNANyo2yYJckhja0dG+372HWt8BC8gwAgnIutbXFQJw885eyOIS+NeLLqyRXUr61T8nIODCIIY+c8wqGs00xca4dM2KWUQ6R/fzwL5sBv16bUTFc3csyRF0gQAAP//59qnzgAAAAZJREFUAwAL8Me54qHVHgAAAABJRU5ErkJggg==", "owl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAPCAYAAAARZmTlAAACHElEQVR4AYSTTUhUURiGX4cImWCIGFyEoIsICZGBZhG0GSpaRQnSrFrprqKfTa2y27SIIoiiwkXTIqRCUESkhdggIoPEKBE0TEY/xiAhg4mkiwjqPmc6l9NV78h9zne+9/t5nb+YGvztiif+RLU0qjMbacKCnlRSRJrDoG9XpwbMRJrQ0NmelF3EkAs6dfpc6Dl1IK65wgPzD25rQiNLGGbR9e4OhUGnjk4/960ITGhysc29uTuyWI1oNSJ5mExnsw4euaD1jbUmY8LywgtPLgydu3qeoB1VT13pbmOGwGKr2ZwI7LqX3aPLQyvGAC2GOHzthH6US/9B0aU8mjJp9njcRA6rcY8ixsvpuTmuMAw9uv1Qn97P63erZ/g542li6islk6OTPO2/QjAfMpfTuUFCgHm7yPKXMnJBG35b05dbTzR55qxhdmBZiUrc3K3W1nVSN0Yr+jiU1WsvrWrllT687Gc8MA1MjOofh/av+Wf96WuJq/h9RbnmFj3el9pE37tqsPxb+bN67xbrg/55MZP0z/qzyWR2IVGv+Gd+eUOT7R1Ktu71s60flruVw+ljbmrugUmxtCAXqnz/F9/Mq1ZdIm3IyNiAINwYmORnluRCI+810WVuZNxNddQraezfl2F1+pnA5rbRmKz7P5gozKspTKjmw+D04PMmzNp27xTcn6oZMwyBHNhJvzHh0ojF1V8Ct48c0FgYBh3+AgAA//9xKNqIAAAABklEQVQDADOcLT5BvjrxAAAAAElFTkSuQmCC", "prs": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAAAt0lEQVR4XmNkwAK4ufj+owt//faJEZtaFADSGB4Q///bp3dwDOJjM5CgRpghBA0AmQ5SDKNhGkH8a+cvYdjOhM0fr188AAuHeHiAaRgfHcA1g0z3cQtEkV+zYwcKHySP7HcMmz+fuoQ1UIXfvsNtMwzcvnYHwwCQgSBxdACOO5iTt+xaD5bf2dHHoKqlgmKge0URmI8S37B4RfYLiI2OsfoFpghZEiSWFRYAFkNmEwWQDcRmOAwAAPibhedyYTu4AAAAAElFTkSuQmCC", "dw": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAA3ElEQVR4XmNgYGBg4Obi+w/CIDYugKIGxPmwYMX/F4ujcGoEqQHJg9SB2Cwgkx/cuMMgoQ2xA5+NIHUgwAhTeHemDz7XgYFy+haGr98+MTKBTEbWAJJABsh8kDqQeiaQAuGAHrg6fy0hMJvjrx+YhvGR1TGCA+LlDbimtxtKwOwXV7UYJLSvoSgGAQFxDUxNhABIE9h5MNNB4OvRUyj6kPknu8PAcmBNyBq5rc1QNMH4yAYzgYIQFkLIEsgAJH7n9iMG955L4CCHy4EDZMcGcIyjY5g4hn/xpT90OQBdfG4PGKR6gQAAAABJRU5ErkJggg==", "krug": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAfCAYAAADwbH0HAAADt0lEQVR4AbSWT0hUURTGTyLRHxESMSgpFy1CokW5lhCiP7QQpoIktEVZtKiQkJjEhQspCfuzKmtRBrYoRSS0DNRyUYmFhIVKyFiThMkIMSMW0tTv5nncefNeM6UJ35xzz/2+8917593nZIjP3+pV2fG7hYXx8ty8OLkPLakMFx0gTyIsFJKMIYPrBfnyZGpadublLlD/LqClB72AW51gDAEyQNg6O+fmpxzHZr8uOxEKOwsOrFoh9KO3LXaMmZh41yl7OpvMTtWUBdiCdHN0ugB60hsP1RtjCkw0NlwydUxZOdDcTKT5YeswV9npIyWCF2NjTDI4OCjFJTtkY+FeQUgN2DnjdKE6Ij21v+odYy38z/isp89pn8HWOeaioiIJlNcm7NZhLTJh1/Suqj4reOGZsGP7O1ikV4IcIwz1GWLSMXZ/B0wuJdz9MzgGvnyOGiylmd2L3gAvPJ0dK4kj4Wh0vNhIL3q6+yQYcxygtbnO3DdEbkG6Y7SAXvQEtjbB2J5glQCxwp73ypVHRAvsK2RrjDFnztnrhE1GzNNOpKFy3JE55cHVeV5KmuOBF2NjTEKBu0Zukxlz//QqYOAFN48x0E3QGw9qwDFmwAQEJVMDmIaj6ySw/7DcaGp2MDo27uTUq2pbBB4aBZugJ721RkwwpgDh6u0e887maKix4/ysSVLp7u52EAzWOjl1CMpDC7xM4SUZU8RcgRiwmP6R+wJG5jsFRDe8MJFcAQ++3YfcDU9jN2lX1SZT6spcKyuHZuRlSKQ5lCX1Pd9NjD4IOzWIyif3wx+NeYjY+ePG90ZftiYqm6u3SqzjkWwf+iDBkuUmDkwOS6Akx4whwkeHnrEXfI0RcS2IvAS8xBh41eGjU70Xx9cY8oGDlUIT3rHE0d6IYFZcsVs4TkX5lTJTZw6e8muDNbTxhK8xRzUwHJaLDU2irzuuDMj/lNgLw7JDx8zVYgZ+R1u73Gl/7fv/3deYo6oo3SaYt3Z9lOm5AnrK8cpyCa8XaTp6TeYfRkyNnbfcuylPe/sNDy6m6OljSK4PX2N2jBh+8fMuaRupM2AMKm+dksx9OcZcF/Dqc6vhxOuDUP5txygxJ4LweEQA+Y83Manfkm123XDu90lQn/kScziMbT1jG747tknkb9sjAnh4Llw+L6HMUvPdE0/WnDEP4dTwN8OBnwoZqQismt/GRLgtHWMCAr9+GCoYA+bh2XxqXkhpjIhmRDDY1yaAXOuMATWgdXI/pGVsiyemZwWkqtnzXvlPAAAA///t5NaDAAAABklEQVQDAH6zbG0A0cXGAAAAAElFTkSuQmCC", "bal": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAARCAYAAAAyhueAAAAB50lEQVR4Xo2UTShEURTHz2jkK0zCkEYhhpGahdHMgsKKbLCapJSFrZpiY4lQs2FloRQ1i/GxkWxQLIjNRAgTZcIQLx9jEEX/y33ue/Pe5F/Tvffc//3NuefcGSINJRqTvvARt/haPXKJZxK0oFBbS7cCcLrkZmv1CC/i8HMZ9KDcuLA0xSwzfRUx1s6xIzkB+D4+3xlPF8ozyMu1UPg2RK7qJrKW2hTgaZ+X+D4H/gsKGKQGigJchOrWFNf/DxDqcnvk+kNGvZpCwbM9Mj3e0ETDIrn9DqX14oh8nkhsPF5NkamtzEGZGdns6uGbC8ozF8pgcY35ypo/fqPENyqCtcSBkGb3AZuvqaXgncRM/WcHMqewoJzMOfnyejewrvgOze5zINS+s8mKz4XuAmqzVlFP6gBNRgfpXrpjYLUPcN1GNVqW/6C/MwAtNiv1HA7QsNTLolo+9qR4lrMnQXb10eJKuppLYL+Y1VCzDEeGocNjNnJhHz7v+CW5UtIZK+6TgnB1aKjDQM462Edogoy0vRGmzsDfviiD2JxtSSJnVlZMk9Ewh72exVFHcd5qyqfztxcqSUujq2iEtl6ff6CcAsPiw7Xm0yktqmLx0/N9xRyyJ2dQ4O1JPseg/DmIc1Hq/1ZROKtmfAMNOeioeiVKoQAAAABJRU5ErkJggg==", "gor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAXCAYAAACFxybfAAACtklEQVR4Xp1VPWhTURQ+DUFEOoQ2BDEdMhQrHYpKoAVDkLhn6CAdCkqHUtChSOkkuGQKHboI4iAIRUqQDEWKDpYSnhDhoSIU0lKkQ+wQ+uAhoiCFyHfCiffd93efHzzeffedv3vOd84dIQ1XLmT6+h5w+scdCdqPQmJbUMDTd4/7nbfb/JYH3/LfJBCRhZ6JrRSMQul7z6a9nWc+H4dtm6bmioT/eMJOJxBbkA0CbMGPaislSiogCOc6sBcViG4LdoJsCMRWGhtyWijlc35FCAcFZYJKdcUn5suScEDqHmQYJ9Rrq5dF+KRyKax0qizsciaC0qYCnVGprjBvoqBmCxmI6ihVNi0fcUpSNrWe+VxxmLkgUodBP1Q6Lgsq3PQEdZoP6d7Tz/Tx/Qdq7r6h2Tu3eO0S8frlgxvUyyx4uiVuxqSSEK61Z7EDOJ3NvmZHWAP4xloPIKqbBIkyMdNuU2F9gei8S07jnCZpe2jIIaJMuUvVcoGmRi/S5kY4e0BMtXwptCSeqJRB6evaIi1Z+8ydk/o/5yqyLYv/5yv3CfJRkFkE38b3AQJ5UbrNdh+19ungd4ecJ7Whn3J9y7M3s7HF/2TGqPNC7bL/CqI4NxF5wvH1VXLqmxwEsiuplwaQwShDETI8J5LirFwKnYQIQIW0o+5DLX+icoihpcvTtLp402O3sdOh2pF3mMW1poBv0TjoN2NpMkd2u8tq48uDu+Zu9Ro9vjpYm964xkFIAKilOlPADQTgPLd9gaDekEUbxl39gBEn3s2vsVOQTToEkADwFkhJ0K6SrTgYBWEd9+hb7yfbwqy4filD9OnLoAyuRY1XGNpegCOnP37F+WcYEVNSKkTD93y2EOigeXYybE0ImJDTKBNBhqbHshyE2hEgJvZrR3bspaXCKBM6dLLJUFLlTDIg+Av9KNzBzkdlkgAAAABJRU5ErkJggg==", "zak": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAiCAYAAAA3WXuFAAAEX0lEQVR4AbSWTWhUVxTHT7KwpWSR1lSk4yKEIYa2hNAK7SKEErKQOoSQRSkltGK7abTtUFIJrcVRggTJwo/oQhBUgkgWQUTcKEFCEBdRRFRMCJKFERE/shCJbuL9HXMe992ZN8nMxPD+73yf85/zbt5MtbzHv8/W1S4BG+Hr5gvleyHEYDD/ZEoAOjA9JOHba0qIoYDBQAc9XlBSke2c5ACn5l0xQklJeVWBgzrA0PnbVyS1YYuII6JwudNnL4hBc7zNuXDsighpw9cvBBnLWMEg34ZAINXcIfOuD5LS6fEJRAQjhoM66tENSggnTaZv3DX/qqTWuU8bJp8+fDJGKoxjQwwZQgmFzpJt7/GUUgupcEtlE4q2A5llFvaYlk0V7dn9MjxwRpDqCG4hqWpt7J655Y1fm1zxHGkNj2qZDEQAPQ4cHEIoOAYoR7vqEUoqiZgmuFv1ozcLVakPPnZq6RckAD1A2IG+3XX18sf5OUESJ68YqYKPbDVbojlgAJKt+dvBBx68WhADNqAmJGVnqSAhiowUg7B90JB3DZI4KESGmoaPauWWIwXIx1cI1k8Jkch6N3/9RSwXUoCBIUjEBxGAbfjlr1+FfmYjmYE0YIdbIqaEUEigSUiKGKRCQAIQ9+GT4dyMPZ0Tevs5puOHlP+fFhEiiYQkUsTBcGeP/N2RQc2DkaFPXrCIY/NPnVE0RggvzYwU2wL4DUevZU1VCQkDddRrwN04zE6s6oqdobCCpjQ3HBkaFsPO/utSv3WrjJw9p7AcJHX04mzxuFY6yOSGyNuQJVjzru4f1XWs/0OVdrt84ktVP29x3+xOs3ynlnRRZ9uhMJEQn9LIkLhzcBERAbuxIa02pMhXo4wbpKwskRAJMw9mEVJMGilNdDeItbh3z1iR/y6XlngVJETTbF+/Fh0b/FYlpC6P9kTkQv/YpYvRdyAvQy0q45ZHCDI0/6c3I/duTUmqMSt9NTWybmZWnp2YknMdTYptLTmV2OR801Qr9iHK4BGV5BEiMjE+KamG1tgLbe7lgqzft4ew4owj3HZwJPKR39beqrFyHxfFMUK2nUNDg8RiqK+plWd7B2K+id09su3Td4+Ug9n9fabiLcUIMY3tIBmANPz5VYus352V5qGRCNhsynKQtiX0chAjBAm2g/Sb7Zi8KuD/5p9lT+OWCLw/IEg+2+VlyJaw/fpS9BghCv1mpzY2LekQ9yOLWGt6g/zQ2aQYmJnSH13EIUN8LZBHyJoyJLOjQ3LbW4VDOj6c0y0dGrkpoxfuy4FPNsqu3HaN3e7rEUCe1ZcrEwl5DVVt35UTXnjpN8/l4sNZGV1cFHwa9G7+hj33qtWihNiEnRE6Zjal5VXdJkECfIAcctErRSIhPunvbTXRu4jDzDDOTu+dK1VIfIBcbCQ5lSCREE2rjp+vQgJIABs6/9t3gg2Imx+9EhQlVKjxUm/XEn6fLPZaIZHQv3VpHRzK/0bv6OzQb7YGK7i9BQAA///A5OhUAAAABklEQVQDACpBajpRq5lcAAAAAElFTkSuQmCC", "utu": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAqCAYAAADS4VmSAAAEJklEQVR4AcyXT0hUQRzHf3aIqAgpCWk9SAhFgUR46OBBwlNJhHQrCiJCpCIiOtgfKkIiPEQH8bQgFISEhIhUmIissMISIhoaEhJtLCK1RIgUZO8zu7/H7NvZt4vuQsL3/f7NzPc782bmrVsk5G/f1ur1kHJZSgUFQJ5cTgi2LEwFBikooED7sqedAph1cma07GSuAZ0C7IYIQZCdK6efJwAySMtJEjZWjoAc8tpqkVTa9EUQNROU+ZEj4NvvdFWksTWPghy1vEIZEjkC/PG82V89dMaElSSHwC2ACvCEYCqJcAGVZM6O/X8KOFnfKoMrSxLZ2ySV2nzZBRDnCuzf7h1Br0WlyT0KtwAKQXAP2AjWNxo7V8AeTEn5MtrQvN12I36oAEiUVH6tiY3qvyJjQ32b/lyHCoDcJw1Mb24pJu1tHZsWkSOAGR/xNiAnwCcPEGt4uL5ZECFfUpsSkSOAwfUE4AOIFMSA2Lb4LjAh4KppLk+AFjZiIbOR/Lkoyc+x0H1SVMCc964RoxZ/sPc+JvMKjJd5KCGkmYzIwkjml5UK07zaggK4BWXnNtPOJmf5D5xo9cmPX7kvx091mHb6UFLii9e6MaLiVAiWQkEB3IK2CAaFnE742Mj+Zn9gYheiz7r8tPazxfgCUKQnAHJi09M7/xAza2JWo70z8wqIgQ6MXyq0jy+AjnoCIOcYAmYJKSKClj793nF8eOupdO+ulbO1TdLfdEbsOH6vT1q8ox1sR57+OQJIAIgX4gkBgyPDMjWfluibjJ3788OPaftubU3uPbkuXd9ThHIh8cqPX6QScuxhh4yvpuWCt5m1nebp4BQAMRtraGJJJsZitPMx9X7S93EYDAtsn7gUOAVAzj542vNYGuNxSXf3SMPYyzyUQmC30RNh55wCIGcfRJtbpOlYndyYGJc9D+7Y/Zx+v7cfnIVs0j4R2VTm9wBkegK0YNu5lYREdhyUxp7nOdA2rplprZj1V0BPABsQQXS8GBs3hHcbz8vMzXN5oA3QmbHROAXkFMWsL0AbmsvHCxACPFeunzuKKQmcgpIaZhvlCSAPMSeh/2AboSTiX43dyKPY63EKeNt+U2omYv7ZVmJbyHA085Fh49kXD6/Aji9X7w6/iHjf7TX1wo8Qdj9kscVlGRiaxzV49mFazvcOCxZi/AHvAqK46YsIUpucOJr6KI8+Jcz/BMTT3k3WVtcgYLWmzlh8BNiXj/rFlp1+ii04kGAVxGC98/Q6OXwsQFjn7GgVltgFPRWuWjBnBASTGlf1vq5SH1KgYpKXWrQUavUrGmyk+VABwU7Euiq2OB2Muo3Irgbha6o5fTWaZzIFBXTVNJjlD9rbA7NmPPIMoIOZZPahgqiDbFomF8eMSw4QFBTQvbJolr+YZSCFimHW5CAA+FrDJ6f4BwAA//+YOfUiAAAABklEQVQDAFtmYV4WAXJKAAAAAElFTkSuQmCC"}; // 게임 도트 그대로 (1칸 = 1px 원본 → 화면에서 2배)
  const WHO = { kirk: ['키륵', '구덩이 실험실', ['kirk']], owl: ['음유시인', '대장간', ['owl']], inf: ['PRS-22 · DW-5000', '정보원', ['prs', 'dw']], krug: ['크루가쉬', '핏빛 엄니 부락', ['krug']], bal: ['발도르', '무너진 성채', ['bal']], anc: ['세 선조', '선조의 결투장', ['gor']] /* v3.53 초상은 고르마크 하나만 대표로 (셋을 넣으면 화면이 깨짐) */, emb: ['엠브라즈', '용의 유적', []], doc: ['', '', []] };
  const NPC = { kirk: 'kirk', owl: 'owl', prs: 'inf', dw: 'inf', krug: 'krug', bal: 'bal', zak: 'anc', gor: 'anc', utu: 'anc', emb: 'emb' };
  const SPK = { prs: 'PRS-22', dw: 'DW-5000', zak: '자카', gor: '고르마크', utu: '우투르' }; // 여럿이 말하는 장면만 이름표
  const TITLE = [ // [누가, 대사 속 글귀, 수첩 제목]
    ['owl', '시큼한 점액', '시큼한 점액 냄새'], ['owl', '이상한 그림', '성채 벽의 그림'], ['owl', '피로 그린 원', '결투의 장소'], ['owl', '휘파람', '제단의 바람 소리'],
    ['kirk', '무기 든 사람', '구덩이의 고블린'], ['kirk', '배 속', '초록 왕의 배 속'], ['kirk', '안 떠', '{해}, 안 떠'], ['kirk', '죽었어?', '녹아 버린 책'],
    ['inf', '정령의 불씨', '정령의 불씨'], ['inf', '기사단 인장', '쪼개진 기사단 인장'], ['inf', '전사의 엄니', '전사의 엄니'], ['inf', '붉은 보석', '붉은 보석'],
    ['krug', '머리가 맑다', '약속의 결투'], ['krug', '약속대로', '크루가쉬의 마지막 말'], ['bal', '해방', '해방'],
    ['anc', '들어주도록', '선조의 바람'], ['anc', '저주에서 풀려난', '답하지 못한 선조'],
    ['emb', '엠브라즈.', '엠브라즈의 부탁'], ['emb', '가려움이 사라졌군', '근원을 끊어 달라']];
  // 수첩 오른쪽 아래 메모 — 완벽한 실마리가 아니라 「무엇을 해 볼까」 정도만 (제목 기준)
  const MEMO = { '시큼한 점액 냄새': '냄새의 근원을 찾아보자.', '성채 벽의 그림': '벽에 그려진 그림을 찾아보자.', '결투의 장소': '피로 그린 원… 어딘가에 있을지도.', '제단의 바람 소리': '제단 쪽에 귀를 기울여 보자.',
    '구덩이의 고블린': '말이 통하는 고블린이다.', '초록 왕의 배 속': '초록 왕과 싸울 때 잘 살펴보자.', '{해}, 안 떠': '{해}라는 말을 기억해 두자.', '녹아 버린 책': '이미 늦어 버렸다.',
    '정령의 불씨': '남은 불씨 하나를 찾자.', '쪼개진 기사단 인장': '남은 반쪽을 찾자.', '전사의 엄니': '남은 엄니 하나를 찾자.', '붉은 보석': '남은 보석 하나를 찾자.',
    '약속의 결투': '도끼를 꺾으면 이야기를 들을 수 있다.', '크루가쉬의 마지막 말': '왕관과 {해}. 무슨 뜻일까.', '해방': '무언가에 묶여 있었던 걸까.',
    '선조의 바람': '선조들의 뜻을 크루가쉬에게 전하자.', '답하지 못한 선조': '답을 들을 기회를 놓쳤다.', '엠브라즈의 부탁': '가려움의 원인을 찾아보자.', '근원을 끊어 달라': '꼬리 쪽 구멍 너머를 살펴보자.' };
  // 색연필 밑줄 칠 낱말 (제목 기준) — [낱말, 이 글귀가 든 줄에서만] · 없으면 TITLE 표의 「대사 속 글귀」 (시안 _시안/원정수첩_메모_색연필_시안03)
  const ULW = { '시큼한 점액 냄새': ['시큼한 점액 냄새'], '{해}, 안 떠': ['{해}', '안 떠'], '크루가쉬의 마지막 말': ['{해}'], '엠브라즈의 부탁': ['엠브라즈'], '녹아 버린 책': ['죽었어'] };
  const ulWord = ttl => ULW[ttl] || (() => { const t = TITLE.find(x => x[2] === ttl); return t ? [t[1].replace(/[.?!…\s]+$/, '')] : null; })();
  const PEN = ['#e89a80', '#d0603e', '#b8402a']; // 색연필: 연함 · 보통 · 진함
  function ulImg(n, seed) { // 밑줄 그림: n칸 길이 · 두 칸 굵기로 꽉 차게 + 아래 한 칸은 군데군데 연하게 · 일자 (1칸 = 2px)
    const c = document.createElement('canvas'); c.width = n; c.height = 3; const g = c.getContext('2d'); let sd = seed; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let x = 0; x < n; x++) { const edge = x === 0 || x === n - 1; g.fillStyle = PEN[edge ? 0 : rnd() < 0.12 ? 1 : 2]; g.fillRect(x, 0, 1, 1); g.fillStyle = PEN[edge ? 0 : rnd() < 0.45 ? 1 : 2]; g.fillRect(x, 1, 1, 1); if (!edge && rnd() < 0.35) { g.fillStyle = PEN[0]; g.fillRect(x, 2, 1, 1); } }
    return c.toDataURL(); }
  const CHN = { 1: '1장 · 황혼 초원', 2: '2장 · 무너진 성채', 3: '3장 · 핏빛 엄니 부락', 4: '4장 · 잿빛 왕도' };
  const STATIC = [ // 예전 판에 본 진실 (이 수첩이 생기기 전 기록)
    ['t1', { no: '구덩이 실험실', title: '키륵의 연구 일지', ac: '#7ac050', paras: ["셋째 배양체 관찰. 동화 속도가 공급량을 상회하여 기아에 이르는 시간이 현저히 단축됨. 유기물과 무기물을 가리지 않는 무차별 포식성 확인.", "조각 주변의 채도가 점진적으로 감쇠함. 흡수라기보다 전송의 양상. 소실된 색의 수신처는 미상.", "본인은 조각의 보존을 최우선 과제로 상정하고 있음. 그 근거를 기술하고자 하였으나 전제가 성립하지 않음.", "제단으로의 이송이 필연이라는 확신이 존재함. 확신의 출처 불명. 재검토 필요.", "재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요."] }],
    ['t2', { no: '기사단 밀실', title: '바닥에 새겨진 주문', ac: '#b070ff', paras: ["기사단장 발도르여,", "{해}가 뜨지 않는 한, 너는 눕지 못하리라.", "빈 자리를 지키는 자여, 네 이름은 그 자리에 묶이리라.", "왕관이 돌아올 때마다 너는 다시 눈을 뜨리라.", "재가 되어도, 서약은 재가 되지 않으리라."] }],
    ['t3', { no: '핏빛 엄니 부락', title: '크루가쉬의 마지막 말', ac: '#ff5040', paras: ['"왕관은 {해}에 의해 정화되어야 한다…"', '"왕관의 주인은 {해}가 비치는 곳에…"', '말을 끝맺지 못한 채 크루가쉬는 무릎을 꿇었고, 다시는 일어나지 않았다.'] }]];
  const S = s => String(s).replace(/\{해\}/g, '<span class="nbSun">해</span>').replace(/\{낮\}/g, '<span class="nbSun">낮</span>').replace(/\[\(.*?\)\]/g, '');
  const plain = s => String(s).replace(/\{(해|낮)\}/g, '$1');
  const N = () => (G && (G.note || (G.note = { e: [] }))) || { e: [] };
  // v3.53 「해」 탭: 키륵에게서(누구에게든) 「해」를 처음 듣기 전엔 탭 이름을 ??? (강조 색 없이) · 내용도 비움. 캐릭터별로 기억
  const sunOn = () => typeof SAVE !== 'undefined' && !!SAVE.sunKnown;
  // ---------------------------------------------------------------- 적기
  function heard(lines) {
    if (!G || !Array.isArray(lines)) return;
    const said = lines.filter(l => l && NPC[l[0]] && typeof l[1] === 'string' && !/^[\s….!?…]*$/.test(l[1]));
    if (!said.length) return;
    if (!SAVE.sunKnown && said.some(l => l[1].includes('{해}'))) { SAVE.sunKnown = true; persist(); }
    const cnt = {}; for (const l of said) cnt[NPC[l[0]]] = (cnt[NPC[l[0]]] || 0) + 1;
    const who = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], txt = said.map(l => l[1]).join(' ');
    const T = TITLE.find(t => t[0] === who && txt.includes(t[1])); if (!T) return; // 표에 없는 대화(인사 · 되풀이)는 적지 않음
    const nb = N(); if (nb.e.some(e => e.who === who && e.ttl === T[2])) return;
    nb.e.push({ who, ttl: T[2], ch: G.stage, at: who === 'owl' && !(G.dun && G.dun.forge) ? '원정 길목' : null, q: said.filter(l => NPC[l[0]] === who).map(l => [l[0], l[1]]), nw: true });
    lootFeed(`수첩에 적었다 — ${plain(T[2])}`, '#e8dcc0', 2600);
  }
  { const o = showTruthParchment; showTruthParchment = function (p) { try { if (p && p.title && p.paras && !p.clue /* v3.81 단서 양피지는 진실 기록에 넣지 않음 */ && typeof SAVE !== 'undefined') { const D = SAVE.noteTruth || (SAVE.noteTruth = {}); if (!D[p.title]) { D[p.title] = { no: p.no, title: p.title, ac: p.ac, paras: p.paras, pages: p.pages, night: SAVE.runs }; persist(); } } } catch (e) { console.error(e); } return o.apply(this, arguments); }; }
  function truths() { const D = (typeof SAVE !== 'undefined' && SAVE.noteTruth) || {}, out = Object.values(D).map(t => Object.assign({ who: 'doc', ttl: t.title, truth: t }, {}));
    const TS = (typeof SAVE !== 'undefined' && SAVE.truth) || {}; for (const [k, t] of STATIC) if (TS[k] && !D[t.title]) out.push({ who: 'doc', ttl: t.title, truth: t });
    return out; }
  // ---------------------------------------------------------------- 화면
  let el = null, tab = 0, sel = 0, from = 'play';
  const nightName = () => `${(typeof SAVE !== 'undefined' && SAVE.runs) || 1}번째 밤`;
  const josa = n => { const c = n.charCodeAt(n.length - 1) - 0xac00; return c >= 0 && c % 28 ? '이' : '가'; };
  const TABS = () => [[nightName(), () => N().e], ['소문', () => N().e.filter(e => e.who === 'owl' || e.who === 'inf')], ['진실 기록', truths], ['{해}', () => N().e.filter(e => e.q.some(q => q[1].includes('{해}')))]];
  function css() { if (document.getElementById('nbCss')) return; const s = document.createElement('style'); s.id = 'nbCss'; s.textContent = `
  #ovNote { z-index: 41; }
  .nbWin { width: 660px; height: 404px; max-width: 96%; display: flex; flex-direction: column; box-sizing: border-box; }
  .nbWin h2 { text-align: center; margin: 0; }
  .nbSub { font: 10px 'Galmuri9'; color: var(--quiet); text-align: center; margin: 2px 0 7px; }
  .nbTabs { display: flex; gap: 3px; margin-bottom: 7px; }
  .nbTab { flex: 1; font: 10px 'Galmuri9'; color: var(--quiet); background: rgba(0,0,0,.4); border: 1px solid #2a2430; padding: 4px 0; cursor: pointer; text-align: center; position: relative; }
  .nbTab.on { color: var(--gold-l); border-color: var(--gold-d); background: #241c14; }
  .nbTab .nw { position: absolute; right: 5px; top: 3px; width: 4px; height: 4px; background: #ff6a50; box-shadow: 0 0 0 1px #000; }
  .nbBook { position: relative; flex: 1; min-height: 0; }
  .nbBook canvas { position: absolute; left: 0; top: 0; width: 632px; height: 300px; image-rendering: pixelated; }
  .nbPg { position: absolute; top: 26px; height: 248px; color: #3a2a1a; overflow: hidden; }
  .nbL { left: 36px; width: 254px; overflow-y: auto; scrollbar-width: none; } .nbR { left: 352px; width: 236px; overflow-y: auto; scrollbar-width: none; top: 22px; height: 252px; }
  .nbCh { font: 9px 'Galmuri7'; color: #8a6a40; margin: 7px 0 3px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; }
  .nbCh:first-child { margin-top: 0; } .nbCh::after { content: ''; flex: 1; height: 2px; background: repeating-linear-gradient(90deg, #c4a878 0 2px, transparent 2px 4px); }
  .nbIt { display: flex; align-items: center; gap: 6px; height: 18px; padding: 0 8px 0 10px; cursor: pointer; font: 10px 'Galmuri9'; color: #4a3420; white-space: nowrap; }
  .nbIt.sel { background: #d8c08c; box-shadow: inset 2px 0 0 #6a1a14; color: #2a1808; }
  .nbIt .w { margin-left: auto; font: 8px 'Galmuri7'; color: #9a7a50; } .nbIt .d { width: 4px; height: 4px; background: #c0401e; flex: none; }
  .nbHd { display: flex; align-items: flex-end; gap: 10px; min-height: 0; border-bottom: 2px solid #c4a878; padding-bottom: 6px; }
  .nbPor { width: 64px; min-height: 30px; display: flex; align-items: flex-end; justify-content: center; gap: 2px; flex: none; } .nbPor img { image-rendering: pixelated; }
  .nbNm { font: bold 12px 'Galmuri11'; color: #6a1a14; } .nbNm small { display: block; font: 9px 'Galmuri7'; color: #8a6a40; margin-top: 4px; font-weight: normal; }
  .nbQ { position: relative; margin: 6px 0 0; font: 10px/18px 'Galmuri9'; color: #3a2a1a; }
  .nbQ::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(to bottom, transparent 0 16px, #d6c296 16px 18px); -webkit-mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px); mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px); } /* 공책 줄: 글줄에 맞춰 따라감 */
  .nbQ p { position: relative; }
  .nbQ p { margin: 0; padding-left: 10px; text-indent: -10px; color: #3a2a1a; font: 10px/18px 'Galmuri9'; } .nbQ .tx::before { content: '「'; color: #9a7a50; } .nbQ .tx::after { content: '」'; color: #9a7a50; }
  .nbQ .sp { font: 8px 'Galmuri7'; color: #9a7a50; margin-right: 3px; }
  .nbQ.doc p { text-indent: 0; padding-left: 0; } .nbQ.doc .tx::before, .nbQ.doc .tx::after { content: ''; }
  .nbMemo { position: absolute; left: 360px; width: 230px; top: 252px; display: none; text-align: right; font: 10px 'Galmuri9'; color: #c04a30; } /* 메모: 밑줄과 같은 붉은 색연필 색 · 글씨는 또렷하게 */
  .nbMemo .nbSun { color: #c04a30; } .nbMemo .hid { opacity: 0; } .nbMemo .nbBy { font: 8px 'Galmuri7'; color: #9a7a50; margin-right: 4px; }
  .nbUl { position: relative; } .nbUl i { position: absolute; left: -2px; bottom: -6px; height: 6px; background-repeat: no-repeat; background-size: 100% 100%; image-rendering: pixelated; pointer-events: none; }
  .nbR.memo { height: 226px; }
  .nbOpen { margin-top: 10px; font: 9px 'Galmuri7'; color: #8a6a40; }
  .nbEmpty { margin-top: 40px; text-align: center; font: 10px 'Galmuri9'; color: #9a7a50; }
  .nbCnt { font: 9px 'Galmuri7'; color: #8a6a40; margin-bottom: 6px; } .nbCnt b { font: bold 14px 'Galmuri11'; color: #c0401e; margin: 0 3px; }
  .nbSun { color: #c0401e; }
  .nbKeys { margin-top: 6px; display: flex; justify-content: center; gap: 14px; font: 9px 'Galmuri7'; color: var(--quiet); } .nbKeys .key { margin-right: 3px; }`; document.head.appendChild(s); }
  function build() { if (el) return el; css();
    el = document.createElement('div'); el.className = 'ov'; el.id = 'ovNote';
    el.innerHTML = `<div class="pf win nbWin"><h2>원정 수첩</h2><div class="nbSub"></div><div class="nbTabs"></div><div class="nbBook"><canvas width="316" height="150"></canvas><div class="nbPg nbL"></div><div class="nbPg nbR"></div><div class="nbMemo"></div></div>
      <div class="nbKeys"><span><span class="key">←</span><span class="key">→</span>탭</span><span><span class="key">↑</span><span class="key">↓</span>고르기</span><span><span class="key">N</span><span class="key">ESC</span>닫기</span></div></div>`;
    $('ovInv').parentNode.appendChild(el); book(el.querySelector('canvas'));
    el.addEventListener('mousedown', e => { if (e.target === el) close(); });
    return el; }
  const imgs = (who, sc) => (WHO[who] ? WHO[who][2] : []).map(k => `<img src="${POR[k]}" style="width:${sc * (POR[k + '_w'] || 16)}px">`).join('');
  function render() {
    const T = TABS(), L = tab === 3 && !sunOn() ? [] : T[tab][1](); if (sel >= L.length) sel = Math.max(0, L.length - 1);
    for (const e of L) e.nw = false;
    const nm = CLASSES[G.cls] ? CLASSES[G.cls].name : '';
    el.querySelector('.nbSub').textContent = `${nightName()} · ${nm}${josa(nm)} 들은 것들`;
    el.querySelector('.nbTabs').innerHTML = T.map((t, i) => `<div class="nbTab${i === tab ? ' on' : ''}" data-i="${i}">${i === 3 && !sunOn() ? '???' : S(t[0])}${i !== tab && (i !== 3 || sunOn()) && t[1]().some(e => e.nw) ? '<span class="nw"></span>' : ''}</div>`).join('');
    el.querySelectorAll('.nbTab').forEach(b => b.onclick = () => { tab = +b.dataset.i; sel = 0; sfx('blip'); render(); });
    let h = '', last = -1;
    if (tab === 3 && sunOn()) h += `<div class="nbCnt">${nightName()} <span class="nbSun">해</span>를 들은 횟수<b>${L.reduce((a, e) => a + e.q.reduce((b, q) => b + q[1].split('{해}').length - 1, 0), 0)}</b></div>`;
    L.forEach((e, i) => { if (tab !== 2 && e.ch !== last) { last = e.ch; h += `<div class="nbCh">${CHN[e.ch] || ''}</div>`; }
      h += `<div class="nbIt${i === sel ? ' sel' : ''}" data-i="${i}"><span class="t">${S(e.ttl)}</span><span class="w">${e.truth ? (e.truth.night ? e.truth.night + '번째 밤' : '') : WHO[e.who][0]}</span></div>`; });
    if (!L.length) h = `<div class="nbEmpty">${tab === 2 ? '아직 기록한 진실이 없습니다.' : '아직 적은 것이 없습니다.'}</div>`;
    const Lp = el.querySelector('.nbL'); Lp.innerHTML = h;
    Lp.querySelectorAll('.nbIt').forEach(b => b.onclick = () => { sel = +b.dataset.i; sfx('blip', 1.2); render(); });
    const s = Lp.querySelector('.nbIt.sel'); if (s) { const top = s.offsetTop, bot = top + s.offsetHeight; if (top < Lp.scrollTop) Lp.scrollTop = top - 20; else if (bot > Lp.scrollTop + Lp.clientHeight) Lp.scrollTop = bot - Lp.clientHeight + 4; }
    const e = L[sel], R = el.querySelector('.nbR'), M = el.querySelector('.nbMemo'), mt = e && !e.truth && MEMO[e.ttl];
    M.style.display = mt ? 'block' : 'none'; if (mt) M.innerHTML = `<span class="nbBy">${nm}의 메모</span>` + S(mt); /* v3.53 메모 앞에 「(캐릭터)의 메모」 */ R.classList.toggle('memo', !!mt); clearTimeout(ulT);
    if (!e) { R.innerHTML = ''; return; }
    if (e.truth) { const t = e.truth; R.innerHTML = `<div class="nbHd"><div class="nbNm">${S(t.title)}<small>${t.no || ''}${t.night ? ' · ' + t.night + '번째 밤에 기록' : ''}</small></div></div><div class="nbQ doc">${t.paras.map(p => `<p><span class="tx">${S(p)}</span></p>`).join('')}</div><div class="nbOpen"><span class="key">F</span>양피지 펼치기</div>`; return; }
    const multi = new Set(e.q.map(q => q[0])).size > 1;
    R.innerHTML = `<div class="nbHd"><div class="nbPor">${imgs(e.who, 2)}</div><div class="nbNm">${S(e.ttl)}<small>${WHO[e.who][0]} · ${e.at || WHO[e.who][1]}</small></div></div>
      <div class="nbQ">${ulLines(e).map(q => `<p>${multi && SPK[q[0]] ? `<span class="sp">${SPK[q[0]]}</span>` : ''}<span class="tx">${q[2]}</span></p>`).join('')}</div>`; R.scrollTop = 0;
    /* v3.53 밑줄 · 한 글자씩 써지는 메모 연출 폐기 (메모 글만 바로 보임) */
    { const q = R.querySelector('.nbQ'); if (q) q.style.minHeight = Math.max(0, Math.floor((R.clientHeight - q.offsetTop) / 18) * 18) + 'px'; } } // 공책 줄이 쪽 아래(메모 위)까지 이어지게
  // ---------------------------------------------------------------- 색연필 밑줄 · 써지는 메모
  let ulT = 0;
  function ulLines(e) { const w = null; let done = true; /* v3.53 붉은 밑줄 폐기 — 대사는 그대로 */
    return e.q.map(q => { let h = S(q[1]); if (!done && (!w[1] || q[1].includes(w[1]))) { const i = q[1].indexOf(w[0]); if (i >= 0) { done = true; h = S(q[1].slice(0, i)) + '<span class="nbUl">' + S(w[0]) + '<i></i></span>' + S(q[1].slice(i + w[0].length)); } } return [q[0], q[1], h]; }); }
  function ulDraw(e, mt) { const u = el.querySelector('.nbR .nbUl'), M = el.querySelector('.nbMemo');
    let i = null; if (u) { i = u.querySelector('i'); const n = Math.ceil(u.offsetWidth / 2) + 3; i.style.width = n * 2 + 'px'; i.style.backgroundImage = `url(${ulImg(n, e.ttl.length * 37 + n * 13)})`; }
    if (e.ulSeen) return; e.ulSeen = true; // 처음 펼칠 때만: 밑줄이 왼쪽부터 그어지고(0.45초) → 메모가 한 글자씩(0.7초)
    const t0 = performance.now(), txt = mt ? String(mt) : '', step = () => { if (!el || !el.classList.contains('on') || !M.isConnected) return; const t = (performance.now() - t0) / 1000;
      if (i) { const k = Math.min(1, t / 0.45); i.style.clipPath = `inset(0 ${Math.round((1 - k) * 100)}% 0 0)`; }
      if (txt) { const km = Math.max(0, Math.min(1, (t - 0.5) / 0.7)), n0 = Math.floor(txt.length * km), n = txt.lastIndexOf('{', n0) > txt.lastIndexOf('}', n0 - 1) ? txt.indexOf('}', n0) + 1 : n0;
        M.innerHTML = S(txt.slice(0, n)) + '<span class="hid">' + S(txt.slice(n)) + '</span>'; }
      if (t < 1.25) ulT = setTimeout(step, 16); };
    step(); }
  function open(f) { if (!G) return; build(); from = f || 'play'; mode = 'note'; tab = 0; sel = Math.max(0, N().e.length - 1);
    for (const k in pressed) pressed[k] = false; if (from === 'inv') $('ovInv').classList.remove('on'); el.classList.add('on'); sfx('blip'); render(); }
  function close() { if (!el) return; el.classList.remove('on'); for (const k in pressed) pressed[k] = false;
    if (from === 'inv') { $('ovInv').classList.add('on'); mode = 'inv'; } else mode = 'play'; sfx('blip'); }
  function reopenTruth(t) { el.classList.remove('on'); showTruthParchment({ no: t.no, title: t.title, ac: t.ac, paras: t.paras, pages: t.pages, onClose: () => { mode = 'note'; el.classList.add('on'); render(); } }); }
  // ---------------------------------------------------------------- 수첩 그림 (1칸 = 2px)
  function book(c) { const g = c.getContext('2d'), W = c.width, H = c.height, K = '#0b0a0e', px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    let sd = 7; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    // ① 가죽 표지: 외곽선 · 결(두 톤 망점) · 위 밝은 테 · 아래 어두운 테 · 가장자리 바느질
    px(1, 2, K, W - 2, H - 4); px(2, 1, K, W - 4, H - 2);
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { let col = '#4a2c1c'; const n = rnd();
      if (n < 0.08) col = '#3e2416'; else if (n < 0.12) col = '#56341f'; if (y < 4) col = '#6a4228'; if (y > H - 5) col = '#2e1a10'; if (x < 4 || x > W - 5) col = ((x + y) & 1) ? '#3a2214' : col; px(x, y, col); }
    for (let x = 6; x < W - 6; x += 3) { px(x, 3, '#7a5434'); px(x, H - 4, '#5a3c24'); } for (let y = 6; y < H - 6; y += 3) { px(3, y, '#684628'); px(W - 4, y, '#684628'); } // 박음질은 가죽 결에 눌러 붙게 (낮은 대비)
    // ② 쇠 모서리 장식 + 못
    for (const [x, y, sx, sy] of [[2, 2, 1, 1], [W - 3, 2, -1, 1], [2, H - 3, 1, -1], [W - 3, H - 3, -1, -1]]) {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8 - i; j++) px(x + sx * i, y + sy * j, i + j === 7 ? K : i === 0 || j === 0 ? '#f0d488' : (i + j) % 4 === 0 ? '#7a5a24' : '#b8903e');
      px(x + sx * 2, y + sy * 2, K); px(x + sx * 3, y + sy * 2, '#fff0b0'); }
    const y0 = 7, y1 = H - 7; // 가죽 여백: 네 둘레 모두 4칸
    // ④ 종이 (제본 쪽 그늘은 망점 · 바깥 가장자리 살짝 누렇게 · 섬유 티)
    const page = (x0, x1, left) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const dg = left ? x1 - 1 - x : x - x0, de = left ? x - x0 : x1 - 1 - x, ed = Math.min(de, y - y0, y1 - 1 - y);
        let col = '#efe0b8'; if (dg < 1) col = '#c4a87a'; else if (dg < 3) col = ((x + y) & 1) ? '#d0b88a' : '#e0cca0'; else if (dg < 7) col = ((x + y) & 1) ? '#dcc89c' : '#efe0b8'; else if (dg < 11) col = ((x + y) % 4 === 0) ? '#e2d0a6' : '#efe0b8';
        else if (ed < 2) col = ((x + y) & 1) ? '#e0cc9e' : '#efe0b8'; else if (ed < 4 && (x + y) % 4 === 0) col = '#e6d4aa';
        if (col === '#efe0b8' && rnd() < 0.012) col = '#e0cca0'; px(x, y, col); } };
    page(7, 158, true); page(158, W - 7, false); px(6, y0 - 1, K, W - 12, 1); px(6, y0 - 1, K, 1, y1 - y0 + 1); px(W - 7, y0 - 1, K, 1, y1 - y0 + 1); // 한 장으로 이어진 펼친 면
    px(6, y1, K, W - 12, 1); // 아래 외곽선 (겹친 종이 끝 표현 없음)
    // ⑤ 오른쪽 쪽: 공책 줄 + 붉은 여백 선 · 왼쪽 쪽: 위 머리띠 줄
    for (let y = y0 + 2; y < y1 - 1; y += 1) if (y % 3) px(172, y, '#d89a86');
    for (let x = 20; x < 150; x += 2) px(x, 9, '#d6c296');
    // ⑥ 쪽 번호 · 잉크 얼룩
    const num = (cx, d) => { const D = { 1: ['.k.', 'kk.', '.k.', '.k.', 'kkk'], 2: ['kk.', '..k', '.k.', 'k..', 'kkk'], 3: ['kk.', '..k', '.k.', '..k', 'kk.'] }; D[d].forEach((r, j) => [...r].forEach((q, i) => { if (q === 'k') px(cx + i, y1 - 8 + j, '#a88a5e'); })); px(cx - 4, y1 - 6, '#c4a878', 2, 1); px(cx + 5, y1 - 6, '#c4a878', 2, 1); };
    // 쪽 번호 없음 (v3.80)
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [3, 3], [-2, 3]]) px(26 + dx, y1 - 10 + dy, dx === 3 || dx === -2 ? '#8a9ab0' : '#5a6a88');
    // ⑦ 가운데 접힘: 가는 골 + 골을 따라 드문드문 보이는 실 땀
    for (let y = y0; y < y1; y++) { px(157, y, '#b89a6c'); px(158, y, '#c8ae80'); }
    for (let y = y0 + 6; y < y1 - 6; y += 12) { px(157, y, '#8a7656', 1, 3); px(158, y + 1, '#a8946a'); }
  }
  // 도트 원래 폭
  for (const k in POR) { const im = new Image(); im.onload = () => { POR[k + '_w'] = im.width; }; im.src = POR[k]; }
  // ---------------------------------------------------------------- 연결 (N 키 · 인벤토리 단추)
  { const o = update; update = function (dt) {
      try { if (G && mode === 'play' && pressed['n'] === true && !G.cine && !G.trans && !G.player.dead && !(typeof TRUTH !== 'undefined' && TRUTH.busy()) && !(typeof LOADQ !== 'undefined' && LOADQ.on)) { pressed['n'] = false; open('play'); }
        else if (G && mode === 'inv' && pressed['n'] === true) { pressed['n'] = false; open('inv'); }
        else if (mode === 'note' && el) { const L = TABS()[tab][1]();
          if (take('n') || take('escape')) close();
          else if (take('arrowleft') || take('a')) { tab = (tab + 3) % 4; sel = 0; sfx('blip'); render(); }
          else if (take('arrowright') || take('d')) { tab = (tab + 1) % 4; sel = 0; sfx('blip'); render(); }
          else if (take('arrowup') || take('w')) { if (sel > 0) { sel--; sfx('blip', 1.2); render(); } }
          else if (take('arrowdown') || take('s')) { if (sel < L.length - 1) { sel++; sfx('blip', 1.2); render(); } }
          else if ((take('f') || take('enter')) && tab === 2 && L[sel]) reopenTruth(L[sel].truth); } } catch (e) { console.error(e); }
      return o.apply(this, arguments); }; }
  { const b = document.createElement('button'); b.className = 'pbtn'; b.id = 'ivNote'; b.style.marginRight = '6px'; b.innerHTML = '원정 수첩 <span class="key kc">N</span>'; b.onclick = () => open('inv');
    const c = $('ivClose'); if (c && c.parentNode) c.parentNode.insertBefore(b, c); }
  return { heard, open, close, get on() { return mode === 'note'; } };
})();
