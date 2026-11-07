# 루모스 · 특수교육 공방

검은 밤하늘과 금빛 마법 서재를 모티프로 한 특수교육 교사용 웹앱 허브입니다. 원작 이미지나 로고 대신 직접 작성한 SVG를 사용합니다.

- 허브: 검색·분류·즐겨찾기·외부 HTTPS 도구 추가. 사용자 추가 내용은 현재 브라우저에만 저장합니다.
- 시각 일정판: 로그인 없이 활동 추가·순서 변경·완료·삭제·인쇄. 최대 30개 활동.
- 교사 개인 일기장: Firebase Google 로그인, 비공개 CRUD, 전체 JSON 내보내기. 학생 개인정보를 기록하는 용도가 아닙니다.

## 실행

Node.js 22 이상. 정적 앱은 npm 설치가 필요 없습니다.

```sh
npm test
npm run build
npm start
```

열기: http://127.0.0.1:4173

## Firebase 연결

운영 프로젝트: `lumos-teacher-hub-rlghk33`. Google 로그인과 GitHub Pages 도메인 허용, 서울 리전 `asia-northeast3`의 기본 Firestore 및 보안 규칙을 배포했습니다. `firebase-config.js`에는 이 웹앱의 공개 클라이언트 식별자만 들어 있습니다. 프로젝트를 복제해 별도 운영할 경우 아래 절차로 본인의 Firebase에 연결하세요.

1. 본인 Firebase 프로젝트를 만들고 Cloud Firestore Standard 데이터베이스를 선택합니다. 한국에서 사용할 경우 서울 위치 `asia-northeast3`를 검토하세요. 위치는 생성 후 변경하기 어렵습니다.
2. Firebase 웹 앱을 등록하고 공개 클라이언트 설정 객체를 `firebase-config.js`에 넣습니다. `export const firebaseConfig = { apiKey, authDomain, projectId, appId, ... };` 형태입니다. 관리자 키나 서비스 계정 JSON을 넣으면 안 됩니다.
3. Authentication에서 Google 제공자를 활성화하고 실제 운영자 지원 이메일을 설정합니다. Authorized domains에 본인 GitHub Pages 호스트(`계정.github.io`)를 추가합니다. 개발용 localhost는 필요한 경우에만 추가합니다.
4. CLI 로그인 후 `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID`로 이 저장소 규칙을 배포합니다. Firebase Console의 테스트 모드를 사용하지 마세요.
5. 공개 배포 전 Google 로그인, 본인 CRUD, 로그아웃 후 비공개 화면 제거, 다른 계정 접근 거부를 검증합니다.

일기 경로는 `users/{uid}/entries/{id}`입니다. Google 로그인 소유자만 접근할 수 있고 서버 타임스탬프와 스키마를 검증합니다. IndexedDB 일기 영구 캐시를 사용하지 않습니다. 이 보안 규칙은 초기안이며, 공개 운영 전 emulator 테스트와 실제 프로젝트 검증이 필요합니다.

## GitHub Pages

1. 본인 계정에 공개 저장소를 만들고 이 소스를 `main` 브랜치로 push합니다.
2. Settings → Pages → Source를 **GitHub Actions**로 선택합니다.
3. Pages workflow가 테스트·정적 빌드 후 `dist`만 배포합니다. 사이트 경로에 의존하지 않는 상대 URL을 사용합니다.

API 키는 Firebase의 공개 클라이언트 식별자입니다. 데이터 보호는 인증·Firestore 보안 규칙·도메인 설정에 의존합니다. 비밀키, 학생 자료, 실제 일기는 저장소에 포함하지 마세요.

## 교사의 별자리

실제 공개 배포가 확인된 후에만 [등록 안내](https://github.com/Taehwan-Shin/teacher-hub/blob/main/REGISTRATION_API.md)에 따라 신청합니다. 등록용 Firebase 프로젝트는 이 앱의 백엔드가 아닙니다. 신청에는 공개 이름·소개·배포 주소만 사용합니다.

## 검증과 현재 제한

`npm test`는 URL 안전성, 손상된 저장소 복구, 활동 이동, 날짜 및 일기 입력 검증을 확인합니다. 운영 프로젝트에서 Google 로그인·일기 저장/수정/재조회·내보내기·로그아웃을 확인했습니다. Firestore emulator 보안 테스트 5건은 별도 GitHub Actions에서 통과했습니다. 보안 검토 내역은 `SECURITY-REVIEW.md`에 기록합니다.
