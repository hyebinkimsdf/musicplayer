# 🎵 Music Player

> YouTube URL 하나로 끝내는 데스크탑 뮤직 플레이어  
> 광고 없음 · 설치 간단 · 감성 충만

<br/>

## ✨ 이런 앱이에요

유튜브 링크 붙여넣기 → 재생 끝.  
복잡한 거 없어요. 그냥 틀면 됩니다.

| 기능           | 설명                                             |
| -------------- | ------------------------------------------------ |
| 🔗 URL 추가    | YouTube 링크 붙여넣으면 바로 플레이리스트에 추가 |
| 🎛 듀얼 모드   | 미니(컴팩트) ↔ 풀스크린 전환 가능                |
| 🔁 반복 재생   | 없음 / 전체 / 한 곡 반복                         |
| 🖱 드래그 정렬 | 플레이리스트 순서 드래그로 변경                  |
| 💾 자동 저장   | 껐다 켜도 목록 그대로                            |
| 🌫 투명도 조절 | 창 투명도 조절로 화면 위에 띄워두기              |

<br/>

## 🖥 미리보기

```
┌──────────────────────────────────────────┐
│  ● ─ ⛶   Music Player                   │
├──────────────────────────────────────────┤
│  [ YouTube URL 붙여넣기          ] [ + ] │
│                                          │
│           🖼 앨범 아트                    │
│                                          │
│      노래 제목                            │
│      아티스트                             │
│                                          │
│   0:00 ━━━━━━━━━━━━━━━━━━━━━━━  3:45    │
│                                          │
│        ↻   ⏮   ▶   ⏭                   │
│                                          │
│  ▸ 노래 1   아티스트 · 3:45       ✕     │
│  ▸ 노래 2   아티스트 · 4:12       ✕     │
└──────────────────────────────────────────┘
```

<br/>

## 🚀 설치 & 실행

### 사전 준비

- [Node.js 18+](https://nodejs.org) 설치 필요

### 개발 모드로 실행

```bash
# 클론
git clone <repo-url>
cd music-player

# 패키지 설치
npm install

# 실행 (React + Electron 동시)
npm run dev
```

### Windows 설치 파일 빌드

```bash
npm run dist
```

> `dist/` 폴더에 `.exe` 설치 파일이 생성됩니다.

<br/>

## 🛠 기술 스택

```
React 19            — UI
Electron 41         — 데스크탑 앱 래퍼
YouTube IFrame API  — 음악 재생
InnerTube API       — 영상 메타데이터 조회
electron-builder    — Windows 배포
```

<br/>

## 📁 프로젝트 구조

```
music-player/
├── electron.js      # 메인 프로세스 (Electron)
├── preload.js       # IPC 브릿지
├── src/
│   ├── App.js       # 상태 관리
│   ├── Player.js    # 플레이어 UI
│   └── App.css      # 스타일
└── public/
    └── icon.ico     # 앱 아이콘
```

<br/>

## 📜 스크립트

| 명령어          | 설명                           |
| --------------- | ------------------------------ |
| `npm run dev`   | 개발 서버 + Electron 동시 실행 |
| `npm run build` | React 프로덕션 빌드            |
| `npm run dist`  | Windows 설치 파일(.exe) 생성   |
| `npm start`     | React 개발 서버만 실행         |

<br/>

---

<div align="center">
  Made with 🎧 by 김혜빈
</div>
