const fs = require('fs');
const css = fs.readFileSync('index.css', 'utf8');
const fontFaces = css.match(/@font-face\s*\{[^}]+\}/g) || [];
const fonts = {};

// 한글 폰트 이름 매핑
const koreanFontNames = {
  'applegothic': '애플 고딕',
  'applemyungjo': '애플 명조',
  'bmdohyeon': '배민 도현체',
  'bmhanna11yrs': '배민 한나는 열한살',
  'bmjua': '배민 주아체',
  'maplestory': '메이플스토리',
  'paperlogy': '페이퍼로지',
  'aritadotumkr': '아리따 돋움',
  'tvn-enjoystories': 'tvN 즐거운이야기체',
  'chosunnm': '조선일보명조',
  'chosungu': '조선일보굴림',
  'hakgyoansimjiugaer': '학교안심 지우개',
  'vitro': '비트로',
  'wigglehangeul': '위글한글',
  'creattion': '크리에이션',
  'residentevil': '레지던트 이블',
  'theplaying': '더 플레잉',
  'waltdisney': '월트 디즈니',
  'cafedeparis': '카페 드 파리',
  'partylet': '파티렛',
  'arial': '에리얼',
  'times-new-roman': '타임스 뉴 로만',
  'courier-new': '쿠리어 뉴',
  'georgia': '조지아',
  'verdana': '버다나',
  'tahoma': '타호마',
  'trebuchet-ms': '트레뷰쳇',
  'comic-sans-ms': '코믹 산스',
  'impact': '임팩트',
  'charter': '차터',
  'baskerville': '바스커빌',
  'hoefler-text': '회플러 텍스트',
  'palatino': '팔라티노',
  'bigcaslon': '빅 캐슬론',
  'bodoni': '보도니',
  'brush-script': '브러시 스크립트',
  'luminari': '루미나리',
  'zapfino': '자피노',
  'herculanum': '헤르쿨라눔',
  'papyrus': '파피루스',
  'trattatello': '트라타텔로',
  'bradley-hand': '브래들리 핸드',
  'chalkduster': '초크더스터',
  'academy-engraved': '아카데미 엔그레이브드',
  'andale-mono': '앤데일 모노',
  'apple-chancery': '애플 챈서리',
  'ayuthaya': '아유타야',
  'din': 'DIN',
  'webdings': '웹딩스',
  'wingdings': '윙딩스',
  'microsoft-sans-serif': '마이크로소프트 산스',
  'noto': '본고딕',
  'stix': 'STIX',
  'nanum': '나눔',
  'malgun': '맑은',
  'gowun': '고운',
  'jua': '주아',
  'black-han-sans': '검은고딕',
  'do-hyeon': '도현',
  'phosphate': '포스페이트',
  'og': 'OG 르네상스',
  '210': '210',
};

// 카테고리 분류 함수
const getCategoryForFont = (familyName) => {
  const lower = familyName.toLowerCase();

  // 추천 글꼴
  if (lower.includes('paperlogy') || lower.includes('applegothic') || lower.includes('applemyungjo') ||
      lower.includes('notosans') && !lower.includes('regular') || lower.includes('malgun') || lower.includes('aritadotum')) {
    return '추천 글꼴';
  }

  // 나눔 글꼴
  if (lower.includes('nanum')) {
    return '나눔 글꼴';
  }

  // 제목용 글꼴
  if (lower.includes('black-han') || lower.includes('jua') || lower.includes('do-hyeon') ||
      lower.includes('bmdohyeon') || lower.includes('bmhanna') || lower.includes('bmjua') ||
      lower.includes('impact') || lower.includes('phosphate') || lower.includes('chalkduster') ||
      lower.includes('tvn') || lower.includes('og')) {
    return '제목용 글꼴';
  }

  // 본문용 글꼴
  if (lower.includes('gowun') || lower.includes('chosun') || lower.includes('georgia') ||
      lower.includes('times') || lower.includes('baskerville') || lower.includes('charter') ||
      lower.includes('hoefler')) {
    return '본문용 글꼴';
  }

  // 고딕 & 산세리프
  if (lower.includes('gothic') && !lower.includes('malgun') || lower.includes('sans') ||
      lower.includes('arial') || lower.includes('verdana') || lower.includes('tahoma') ||
      lower.includes('trebuchet') || lower.includes('din')) {
    return '고딕 & 산세리프';
  }

  // 명조 & 세리프
  if (lower.includes('myungjo') || lower.includes('myeongjo') || lower.includes('bodoni') ||
      lower.includes('caslon') || lower.includes('palatino')) {
    return '명조 & 세리프';
  }

  // 필기체 & 캘리그래피
  if (lower.includes('script') || lower.includes('brush') || lower.includes('hand') ||
      lower.includes('chancery') || lower.includes('zapfino') || lower.includes('trattatello') ||
      lower.includes('luminari') || lower.includes('comic')) {
    return '필기체 & 캘리그래피';
  }

  // 고정폭 글꼴
  if (lower.includes('mono') || lower.includes('courier')) {
    return '고정폭 글꼴';
  }

  // 장식용 글꼴
  if (lower.includes('herculanum') || lower.includes('papyrus') || lower.includes('skia')) {
    return '장식용 글꼴';
  }

  // 캐주얼 글꼴
  if (lower.includes('maplestory') || lower.includes('hakgyo') || lower.includes('playing') ||
      lower.includes('wiggle')) {
    return '캐주얼 글꼴';
  }

  // 210 시리즈
  if (lower.includes('210')) {
    return '210 시리즈';
  }

  // 특수 효과 글꼴
  if (lower.includes('cafe') || lower.includes('creattion') || lower.includes('resident') ||
      lower.includes('vitro') || lower.includes('disney') || lower.includes('palladium')) {
    return '특수 효과 글꼴';
  }

  // Noto 글꼴
  if (lower.includes('noto') && lower.includes('regular')) {
    return 'Noto 글꼴';
  }

  // STIX 글꼴
  if (lower.includes('stix')) {
    return 'STIX 글꼴';
  }

  // 기타 & 심볼
  if (lower.includes('webdings') || lower.includes('wingdings')) {
    return '기타 & 심볼';
  }

  return '기타';
};

// 폰트 패밀리 이름 정규화 함수
const normalizeFontFamily = (fullName) => {
  // 스타일 부분 제거하여 패밀리만 추출
  const parts = fullName.split('-');

  // 마지막 부분이 스타일인지 확인
  const lastPart = parts[parts.length - 1];
  const styleKeywords = ['Regular', 'Bold', 'Italic', 'Light', 'Medium', 'Black', 'Thin',
                         'ExtraLight', 'SemiBold', 'ExtraBold', 'OTF', 'ttf', 'Narrow',
                         'Condensed', 'Extended', 'Rounded', 'Script', 'Smallcaps', 'Ornaments'];

  if (styleKeywords.some(keyword => lastPart.includes(keyword))) {
    return parts.slice(0, -1).join('-');
  }

  return fullName;
};

fontFaces.forEach(face => {
  const familyMatch = face.match(/font-family:\s*'([^']+)'/);
  if (familyMatch) {
    const fullName = familyMatch[1];
    const family = normalizeFontFamily(fullName);
    const parts = fullName.split('-');
    let style = 'Regular';

    if (parts.length >= 2) {
      style = parts[parts.length - 1];
    }

    if (!fonts[family]) {
      fonts[family] = new Set();
    }
    fonts[family].add(style);
  }
});

const result = Object.entries(fonts).map(([family, styles]) => {
  // 기본 displayName 처리
  let displayName = family.replace(/-/g, ' ').replace(/^210\s+/, '210 ').trim();

  // 한글 매핑 확인
  const lowerFamily = family.toLowerCase();
  for (const [key, koreanName] of Object.entries(koreanFontNames)) {
    if (lowerFamily.includes(key)) {
      // 특별한 경우 처리
      if (lowerFamily.includes('vitro')) {
        if (lowerFamily.includes('core')) displayName = '비트로 코어';
        else if (lowerFamily.includes('inspire')) displayName = '비트로 인스파이어';
        else if (lowerFamily.includes('pride')) displayName = '비트로 프라이드';
        else displayName = koreanName;
      } else if (lowerFamily.includes('210')) {
        displayName = displayName.replace('210', '210');
      } else {
        displayName = koreanName;
      }
      break;
    }
  }

  // 카테고리 결정
  const category = getCategoryForFont(family);

  return {
    name: family,
    displayName: displayName,
    category: category,
    styles: Array.from(styles).sort()
  };
}).sort((a, b) => {
  // 카테고리별로 먼저 정렬
  if (a.category !== b.category) {
    const categoryOrder = [
      '추천 글꼴', '나눔 글꼴', '제목용 글꼴', '본문용 글꼴',
      '고딕 & 산세리프', '명조 & 세리프', '필기체 & 캘리그래피',
      '고정폭 글꼴', '장식용 글꼴', '캐주얼 글꼴', '210 시리즈',
      '특수 효과 글꼴', 'Noto 글꼴', 'STIX 글꼴', '기타 & 심볼', '기타'
    ];
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  }
  // 같은 카테고리 내에서는 displayName으로 정렬
  return a.displayName.localeCompare(b.displayName, 'ko');
});

console.log(JSON.stringify(result, null, 2));
