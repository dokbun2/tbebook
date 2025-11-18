# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

상세페이지 만들기 웹 애플리케이션 - 텍스트와 이미지를 자유롭게 배치하고 스타일을 지정하여 상세 페이지를 만드는 비주얼 에디터입니다. Google AI Studio에서 생성된 프로젝트입니다.

**주요 기능:**
- 드래그 앤 드롭 캔버스 에디터
- 텍스트 및 이미지 블록 관리 (크기 조정, 이동, z-index 제어)
- 실시간 속성 편집 (폰트, 색상, 정렬 등)
- 실행 취소/다시 실행 (Undo/Redo)
- PNG/JPG 이미지 내보내기 (html2canvas 사용)
- 프로젝트 백업 및 복원 (JSON)
- 반응형 디자인 (모바일 및 데스크톱)

## 기술 스택

- **프레임워크**: React 19.2.0 + TypeScript
- **빌드 도구**: Vite 6.2.0
- **스타일링**: Tailwind CSS (CDN)
- **외부 라이브러리**: html2canvas (이미지 캡처)
- **개발 서버**: Vite dev server (포트 3000)

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm preview
```

## 프로젝트 구조

```
/
├── index.html          # 앱 진입점, Tailwind/html2canvas CDN 포함
├── index.tsx           # React root 렌더링
├── App.tsx             # 메인 앱 컴포넌트 (상태 관리 및 이벤트 핸들러)
├── types.ts            # TypeScript 타입 정의 (ContentBlock, TextBlockType, ImageBlockType)
├── vite.config.ts      # Vite 설정, 환경변수 로드 (GEMINI_API_KEY)
├── components/
│   ├── Canvas.tsx              # 메인 캔버스 (블록 렌더링, 드래그/리사이즈)
│   ├── PropertiesPanel.tsx     # 속성 편집 패널 (텍스트/이미지/캔버스 설정)
│   ├── Toolbar.tsx             # 상단 툴바 (추가, Undo/Redo, 내보내기 등)
│   ├── ContextMenu.tsx         # 우클릭 컨텍스트 메뉴 (앞으로/뒤로 보내기)
│   ├── ExportModal.tsx         # 이미지 내보내기 모달 (PNG/JPG 선택)
│   └── icons.tsx               # SVG 아이콘 컴포넌트
└── fonts/              # 로컬 폰트 파일 (사용되지 않을 수 있음, Google Fonts 사용)
```

## 아키텍처 및 상태 관리

### 핵심 상태 (`App.tsx`)
- `blocks: ContentBlock[]` - 캔버스의 모든 텍스트/이미지 블록
- `selectedId: string | null` - 현재 선택된 블록 ID
- `zCounter: number` - z-index 할당을 위한 카운터
- `zoom: number` - 캔버스 줌 레벨 (0.2 ~ 3.0)
- `past: AppState[]`, `future: AppState[]` - Undo/Redo 히스토리
- `draggingState`, `resizingState` - 드래그 및 리사이즈 임시 상태
- `canvasSize: {width, height}` - 캔버스 크기 (px)

### 주요 데이터 흐름
1. **블록 생성**: `handleAddText` / `handleAddImage` → `blocks` 배열에 추가 → `zCounter` 증가
2. **블록 업데이트**: `handleUpdateBlock` → 블록 속성 부분 업데이트 (불변성 유지)
3. **드래그/리사이즈**:
   - 마우스 다운 → `draggingState` / `resizingState` 설정 + `saveHistory()`
   - 마우스 이동 → 상태 기반 좌표/크기 계산 → `handleUpdateBlock` 호출
   - 마우스 업 → 상태 초기화
4. **히스토리 관리**:
   - 변경 전 `saveHistory()` 호출 → `past`에 현재 상태 저장
   - Undo: `past` → 현재, 현재 → `future`
   - Redo: `future` → 현재, 현재 → `past`

### 컴포넌트 역할
- **App**: 상태 관리 허브, 모든 이벤트 핸들러 소유
- **Canvas**: 블록 렌더링, 마우스/터치 이벤트 위임 (props로 핸들러 전달)
- **PropertiesPanel**: 선택된 블록/캔버스 속성 표시 및 수정 UI
- **Toolbar**: 액션 버튼 (추가, Undo/Redo, 백업/복원, 내보내기)

## 환경 변수

`.env.local` 파일 필요:
```
GEMINI_API_KEY=your_api_key_here
```

**주의**: 현재 코드에서 `GEMINI_API_KEY`는 `vite.config.ts`에서 `process.env.API_KEY`와 `process.env.GEMINI_API_KEY`로 정의되지만, 실제 사용처는 코드베이스에 명시되지 않음. AI Studio 통합용으로 추정됨.

## 주요 기술 구현

### 1. 드래그 앤 드롭
- 마우스 및 터치 이벤트 모두 지원
- `getClientCoords` 헬퍼로 이벤트 타입 통합
- `zoom` 레벨 고려한 좌표 계산: `(clientX - startX) / zoom`

### 2. 리사이즈 핸들
- 8방향 핸들 (`Canvas.tsx:renderHandles`)
- 각 핸들별 커서 및 위치 스타일 적용
- `top`, `left`, `right`, `bottom` 조합으로 크기 및 위치 동시 조정

### 3. Undo/Redo
- 키보드 단축키: `Ctrl/Cmd+Z` (Undo), `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` (Redo)
- 변경 전 `saveHistory()` 호출 필수 (드래그 시작, 속성 변경 등)
- 입력 필드 포커스 시 Delete 키 무시 처리

### 4. 이미지 내보내기
- html2canvas로 캔버스 DOM을 이미지로 변환
- 내보내기 전 선택 상태 제거 (`setSelectedId(null)`)
- `scale` 파라미터로 줌 레벨 보정: `2 / zoom`

### 5. 반응형 디자인
- 데스크톱: 좌측 고정 PropertiesPanel
- 모바일: 하단 슬라이드업 PropertiesPanel (선택 시에만 표시)
- Tailwind `md:` breakpoint 사용

## 개발 시 주의사항

### TypeScript
- 블록 타입: `ContentBlock = TextBlockType | ImageBlockType` (Union 타입)
- 속성 업데이트 시 `Partial<ContentBlock>` 사용하여 타입 안전성 보장
- 컴포넌트 props는 명시적 인터페이스 정의 필수

### 상태 업데이트
- 블록 업데이트는 항상 `handleUpdateBlock`를 통해 수행 (불변성)
- 히스토리에 영향을 주는 변경 전에는 **반드시** `saveHistory()` 호출
- `setBlocks(prev => prev.map(...))` 패턴 사용으로 불변성 유지

### 이벤트 처리
- `stopPropagation()` 사용하여 블록 클릭이 캔버스 클릭으로 전파되지 않도록 함
- 터치 이벤트의 경우 롱프레스로 컨텍스트 메뉴 표시 (700ms)
- 입력 필드 포커스 시 Delete 키 이벤트 무시 (`activeElement` 체크)

### 성능
- `useCallback` 훅으로 핸들러 메모이제이션
- 불필요한 리렌더링 방지를 위해 상태 분리
- 캔버스 줌은 CSS `transform: scale()` 사용 (GPU 가속)

### Path Alias
- `@/*` → 프로젝트 루트 (`tsconfig.json`, `vite.config.ts`)
- 예: `import App from '@/App'`

## 폰트 및 스타일
- Google Fonts CDN: Roboto, Lato, Montserrat, Poppins, Noto Sans KR 등 (`index.html`)
- Tailwind CSS CDN 사용 (`index.html`)
- 추가 커스텀 스타일은 `/index.css` (존재 여부 확인 필요)

## 테스트 및 빌드 확인
이 프로젝트에는 테스트가 구성되어 있지 않습니다. 변경 사항이 있을 경우:
1. `npm run dev`로 개발 서버 실행 후 수동 테스트
2. `npm run build`로 빌드 오류 확인
3. 주요 기능 (드래그, 리사이즈, Undo/Redo, 내보내기) 수동 검증

## AI Studio 통합
- 프로젝트는 AI Studio에서 생성됨: https://ai.studio/apps/drive/1MnHPej6i2TB5fwGDTaXvunCzAczUB-74
- `metadata.json`에 앱 설명 및 권한 정의
- Gemini API 키 환경변수로 제공 (사용처 미확인)
