# integrated strategies Clone Coding Project
명일방주 통합전략을 모방하는 토이 프로젝트입니다.

# stack
react
vite
tailwindcss

# structure
```
src/
├── assets/             # 이미지, 폰트, SVG 등 정적 자원
├── components/         # 공통 UI 컴포넌트 (Button, Modal 등)
├── features/           # 기능 단위 폴더 (UI + 로직 + API)
│   ├── auth/           # 로그인, 회원가입 등
│   ├── posts/          # 게시물 관련 기능
│   └── ...
├── hooks/              # 커스텀 훅
├── pages/              # 라우트 단위 페이지 컴포넌트
├── routes/             # 라우터 설정 파일
├── styles/             # 글로벌 스타일(CSS, tailwind 포함)
├── utils/              # 공통 유틸 함수
├── App.jsx             # 루트 컴포넌트
└── main.jsx            # 진입점
```

